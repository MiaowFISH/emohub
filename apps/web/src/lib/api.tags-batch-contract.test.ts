import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { imageApi, tagApi } from './api'

describe('tagApi batch contract', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updated: 1 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('posts add mutation to /api/tags/batch with backend payload shape', async () => {
    await tagApi.batchAdd(['img-1', 'img-2'], ['tag-1'])

    expect(fetchMock).toHaveBeenCalledWith('/api/tags/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_ids: ['img-1', 'img-2'],
        add: ['tag-1'],
        remove: []
      })
    })
  })

  it('posts remove mutation to /api/tags/batch with backend payload shape', async () => {
    await tagApi.batchRemove(['img-1'], ['tag-2'])

    expect(fetchMock).toHaveBeenCalledWith('/api/tags/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_ids: ['img-1'],
        add: [],
        remove: ['tag-2']
      })
    })
  })

  it('posts batch delete to /api/gallery/batch with backend payload shape', async () => {
    await imageApi.deleteBatch(['img-1', 'img-2'])

    expect(fetchMock).toHaveBeenCalledWith('/api/gallery/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['img-1', 'img-2'] })
    })
  })
})
