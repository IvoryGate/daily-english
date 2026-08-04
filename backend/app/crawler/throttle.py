import time

import requests


class RateLimiter:
    """每源最小请求间隔（令牌式限速）。"""

    def __init__(self, min_interval: float) -> None:
        self.min_interval = min_interval
        self._last = 0.0

    def wait(self) -> None:
        now = time.monotonic()
        elapsed = now - self._last
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last = time.monotonic()


class CircuitOpenError(RuntimeError):
    pass


class CircuitBreaker:
    """熔断：连续失败达到阈值后短暂开路，批量抓取时直接跳过该源。"""

    def __init__(self, failure_threshold: int = 5, open_period: float = 300.0) -> None:
        self.failure_threshold = failure_threshold
        self.open_period = open_period
        self._failures = 0
        self._open_until = 0.0

    def record_success(self) -> None:
        self._failures = 0

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self.failure_threshold:
            self._open_until = time.monotonic() + self.open_period

    def is_open(self) -> bool:
        if self._failures < self.failure_threshold:
            return False
        if time.monotonic() >= self._open_until:
            self._failures = 0
            return False
        return True

    def try_pass(self) -> None:
        if self.is_open():
            raise CircuitOpenError("熔断已开启，本批跳过该来源")
        self.record_failure()


class SafeFetcher:
    """封装每个爬虫来源的网络请求：限速 + 指数退避 + 熔断。"""

    def __init__(
        self,
        min_interval: float = 1.5,
        max_retries: int = 3,
        failure_threshold: int = 5,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.limiter = RateLimiter(min_interval)
        self.circuit = CircuitBreaker(failure_threshold)
        self.max_retries = max_retries
        self.headers = headers or {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            )
        }

    def get(self, url: str) -> requests.Response:
        self.circuit.try_pass()
        attempt = 0
        while True:
            self.limiter.wait()
            try:
                response = requests.get(url, headers=self.headers, timeout=25)
                response.raise_for_status()
                self.circuit.record_success()
                return response
            except Exception as exc:
                self.circuit.record_failure()
                if self.circuit.is_open():
                    raise CircuitOpenError(f"{url} 触发熔断") from exc
                attempt += 1
                if attempt >= self.max_retries:
                    raise
                time.sleep(min(2**attempt, 30))