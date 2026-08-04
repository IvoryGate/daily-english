import threading
import uuid
from datetime import datetime, timezone


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CrawlScheduler:
    """在单进程内跑抓取任务：串行（同一时间只跑一个）+ 内存任务状态。"""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._running = False
        self._tasks: dict[str, dict] = {}

    def start(self, sources: list[str] | None = None, per_source: int = 6) -> str:
        with self._lock:
            if self._running:
                raise RuntimeError("已有抓取任务在运行，请稍后再试")
            self._running = True
            task_id = uuid.uuid4().hex
            self._tasks[task_id] = {
                "status": "running",
                "created_at": _now_iso(),
                "sources": sources,
            }

        def run() -> None:
            from app.crawler import crawl
            from app.database import SessionLocal

            db = SessionLocal()
            try:
                result = crawl(db, sources=sources, per_source=per_source)
                with self._lock:
                    self._tasks[task_id] = {
                        "status": "done",
                        "created_at": self._tasks[task_id]["created_at"],
                        "finished_at": _now_iso(),
                        "sources": sources,
                        "result": result,
                    }
            except Exception as exc:
                with self._lock:
                    self._tasks[task_id] = {
                        "status": "error",
                        "created_at": self._tasks[task_id]["created_at"],
                        "finished_at": _now_iso(),
                        "sources": sources,
                        "error": str(exc),
                    }
            finally:
                db.close()
                with self._lock:
                    self._running = False

        threading.Thread(target=run, daemon=True).start()
        return task_id

    def get(self, task_id: str) -> dict | None:
        with self._lock:
            return self._tasks.get(task_id)

    def trigger_daily(self) -> None:
        with self._lock:
            if self._running:
                print("[scheduler] 已有抓取在跑，跳过本次定时任务")
                return
        try:
            task_id = self.start()
            print(f"[scheduler] 定时抓取已启动: {task_id}")
        except RuntimeError as exc:
            print(f"[scheduler] {exc}")


scheduler = CrawlScheduler()
