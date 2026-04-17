import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerServiceWorker } from './registerServiceWorker'

describe('registerServiceWorker', () => {
  const originalServiceWorker = navigator.serviceWorker

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker
    })
  })

  it('registers the service worker when supported', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register }
    })

    await registerServiceWorker()

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('skips registration when service workers are unavailable', async () => {
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: undefined
    })

    await expect(registerServiceWorker()).resolves.toBeUndefined()
  })
})
