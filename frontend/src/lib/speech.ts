let voicesLoaded = false

function loadVoices(): void {
  if (voicesLoaded || !('speechSynthesis' in window)) return
  voicesLoaded = true
  // 预加载 voices（部分浏览器异步填充）
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    undefined
  )
}

/** 朗读一段英文（自动选英语音色）。 */
export function speak(text: string, rate = 0.9): void {
  if (!('speechSynthesis' in window)) return
  loadVoices()
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  const voice = pickEnglishVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

let articleQueue: string[] = []

export function isSpeakingArticle(): boolean {
  return articleQueue.length > 0
}

/** 开始朗读整篇文章（逐段排队）。 */
export function startArticleSpeak(
  content: string,
  onEnd: () => void,
  rate = 0.9,
): boolean {
  if (!('speechSynthesis' in window)) {
    onEnd()
    return false
  }
  loadVoices()
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) {
    onEnd()
    return false
  }
  articleQueue = [...paragraphs]

  const speakNext = () => {
    const text = articleQueue.shift()
    if (text === undefined) {
      onEnd()
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    utterance.onend = speakNext
    utterance.onerror = () => {
      if (articleQueue.length === 0) onEnd()
    }
    window.speechSynthesis.speak(utterance)
  }
  window.speechSynthesis.cancel()
  speakNext()
  return true
}

/** 停止朗读。 */
export function stopArticleSpeak(): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  articleQueue = []
}
