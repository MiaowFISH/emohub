import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { imageApi } from './api'

describe('imageApi gallery/search contract', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('maps /api/gallery items into the frontend image shape', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'img-1',
            original_name: 'cat.png',
            thumbnail_url: 'c3/cat.jpg',
            processing_state: 'ready',
            embedding_state: 'ready',
            tags: ['character:艾玛', 'mood:happy']
          }
        ]
      })
    })

    const response = await imageApi.list(1, 50, ['character:艾玛'])

    expect(fetchMock).toHaveBeenCalledWith('/api/gallery?tag=character%3A%E8%89%BE%E7%8E%9B')
    expect(response.data).toEqual([
      expect.objectContaining({
        id: 'img-1',
        originalName: 'cat.png',
        thumbnailPath: '/media/thumbs/c3/cat.jpg',
        tags: [
          { id: 'character:艾玛', name: 'character:艾玛', category: 'character' },
          { id: 'mood:happy', name: 'mood:happy', category: 'mood' }
        ]
      })
    ])
    expect(response.meta).toEqual({ total: 1, page: 1, limit: 50 })
  })

  it('uses /api/search when a search query is present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mode: 'text_tag_fallback', items: [] })
    })

    await imageApi.list(1, 50, ['mood:happy'], 'wave')

    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=wave&tag=mood%3Ahappy')
  })
})
