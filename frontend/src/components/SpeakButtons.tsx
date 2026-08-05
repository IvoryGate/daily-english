import { Volume2 } from 'lucide-react'
import { speak, type Accent } from '@/lib/speech'

/** 发音按钮组：美音 + 英音两个独立按钮（有真实音频优先播放，无则 TTS）。 */
export function SpeakButtons({
  word,
  audioUs,
  audioUk,
  size = 'sm',
}: {
  word: string
  audioUs?: string
  audioUk?: string
  size?: 'sm' | 'xs'
}) {
  const play = (accent: Accent) => {
    const audio = accent === 'us' ? audioUs : audioUk
    if (audio) {
      new Audio(audio).play().catch(() => speak(word, 0.9, accent))
    } else {
      speak(word, 0.9, accent)
    }
  }
  const btn = size === 'xs' ? 'p-1' : 'p-1.5'
  const icon = size === 'xs' ? 'size-3.5' : 'size-4'
  const label = size === 'xs' ? 'text-[10px]' : 'text-xs'

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => play('us')}
        className={`flex cursor-pointer items-center gap-0.5 rounded-md ${btn} text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground`}
        aria-label={`美音朗读 ${word}`}
        title="美音发音"
      >
        <Volume2 className={icon} aria-hidden="true" />
        <span className={label}>美</span>
      </button>
      <button
        type="button"
        onClick={() => play('uk')}
        className={`flex cursor-pointer items-center gap-0.5 rounded-md ${btn} text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground`}
        aria-label={`英音朗读 ${word}`}
        title="英音发音"
      >
        <Volume2 className={icon} aria-hidden="true" />
        <span className={label}>英</span>
      </button>
    </span>
  )
}
