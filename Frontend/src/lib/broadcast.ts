const CHANNEL_NAME = 'prodify-sync'
let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

export function sendRefreshSignal() {
  try {
    getChannel().postMessage({ type: 'REFRESH' })
  } catch {
    // BroadcastChannel mungkin tidak tersedia di semua browser
  }
}

export function listenRefreshSignal(callback: () => void) {
  try {
    const bc = getChannel()
    bc.onmessage = (event) => {
      if (event.data?.type === 'REFRESH') {
        callback()
      }
    }
    return () => {
      bc.close()
      channel = null
    }
  } catch {
    return () => {}
  }
}
