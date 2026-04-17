export async function registerServiceWorker(): Promise<void> {
  const isDevelopmentRuntime = import.meta.env.DEV && import.meta.env.MODE !== 'test'
  if (isDevelopmentRuntime || typeof navigator.serviceWorker?.register !== 'function') {
    return
  }

  await navigator.serviceWorker.register('/sw.js')
}
