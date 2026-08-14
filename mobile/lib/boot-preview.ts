const listeners = new Set<() => void>()

export function replayBoot() {
  listeners.forEach((listen) => listen())
}

export function onReplayBoot(listen: () => void) {
  listeners.add(listen)
  return () => {
    listeners.delete(listen)
  }
}
