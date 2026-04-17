import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUploadQueue } from './useUploadQueue'
import { uploadApi } from '../../lib/api'
import { hashFile } from '../../lib/hash'
import { useImageStore } from '../../stores/imageStore'

vi.mock('../../lib/api', () => ({
  uploadApi: {
    precheck: vi.fn(),
    uploadFile: vi.fn()
  }
}))

vi.mock('../../lib/hash', () => ({
  hashFile: vi.fn()
}))

vi.mock('../../stores/imageStore', () => ({
  useImageStore: Object.assign(
    vi.fn((selector) => {
      const store = {
        fetchImages: vi.fn(),
        activeTagFilter: [],
        searchQuery: ''
      }
      return selector ? selector(store) : store
    }),
    {
      getState: vi.fn(() => ({
        fetchImages: vi.fn(),
        activeTagFilter: [],
        searchQuery: ''
      }))
    }
  )
}))

describe('useUploadQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hashes files, prechecks, marks duplicates, and uploads missing sequentially', async () => {
    const mockFetchImages = vi.fn()
    const mockFile1 = new File(['content1'], '1.png', { type: 'image/png' })
    const mockFile2 = new File(['content2'], '2.png', { type: 'image/png' })
    const mockStoreState: ReturnType<typeof useImageStore.getState> = {
      images: [],
      total: 0,
      page: 1,
      isLoading: false,
      hasMore: false,
      selectedIds: new Set<string>(),
      activeTagFilter: [],
      searchQuery: '',
      isInitialized: false,
      fetchImages: mockFetchImages,
      fetchMore: vi.fn(),
      addImages: vi.fn(),
      removeImages: vi.fn(),
      toggleSelect: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      setSearchQuery: vi.fn()
    }

    vi.mocked(hashFile).mockImplementation(async (f) => f.name === '1.png' ? 'hash1' : 'hash2')
    vi.mocked(uploadApi.precheck).mockResolvedValue({
      existing: [{ hash: 'hash1', image_id: 'existing-id' }],
      missing: ['hash2']
    })
    
    vi.mocked(uploadApi.uploadFile).mockResolvedValue({
      duplicate: false,
      image: { id: 'new-id', sha256: 'hash2', processing_state: 'processing', thumbnail_url: '' }
    })

    vi.mocked(useImageStore.getState).mockReturnValue(mockStoreState)

    const { result } = renderHook(() => useUploadQueue())

    await act(async () => {
      await result.current.addFiles([mockFile1, mockFile2])
    })

    const items = result.current.items
    expect(items.length).toBe(2)
    
    const item1 = items.find(i => i.file.name === '1.png')
    expect(item1?.status).toBe('duplicate')
    
    const item2 = items.find(i => i.file.name === '2.png')
    expect(item2?.status).toBe('uploaded')

    expect(uploadApi.uploadFile).toHaveBeenCalledTimes(1)
    expect(uploadApi.uploadFile).toHaveBeenCalledWith(mockFile2, expect.any(Function))
    
    const storeState = useImageStore.getState()
    expect(mockFetchImages).toHaveBeenCalledWith(1, storeState.activeTagFilter, storeState.searchQuery)
  })
})
