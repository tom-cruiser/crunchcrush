let ctx: AudioContext | undefined

function context() {
  ctx ??= new AudioContext()
  return ctx
}

/** Browsers only allow audio after a user gesture; call this from a click to unlock it. */
export async function unlockAudio(): Promise<boolean> {
  try {
    await context().resume()
    return context().state === 'running'
  } catch {
    return false
  }
}

export const audioUnlocked = () => ctx?.state === 'running'

/** Short two-tone chime, loud enough for a busy kitchen. No audio file needed. */
export function playNewOrderChime() {
  if (!ctx || ctx.state !== 'running') return
  const now = ctx.currentTime
  ;[
    [880, 0],
    [1320, 0.18],
    [880, 0.5],
    [1320, 0.68],
  ].forEach(([freq, offset]) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.18)
  })
}
