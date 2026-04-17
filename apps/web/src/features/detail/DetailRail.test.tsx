import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DetailRail } from './DetailRail'
import { useImageStore } from '@/stores/imageStore'
import { tagBatchApi, duplicatesApi } from '@/lib/api'
import type { Image } from '@emohub/shared'

vi.mock('@/stores/imageStore', () => ({
  useImageStore: vi.fn()
}))

vi.mock('@/lib/api', () => ({
  tagBatchApi: {
    mutate: vi.fn()
  },
  duplicatesApi: {
    list: vi.fn()
  },
  imageApi: {
    getThumbnailUrl: vi.fn(id => `/api/images/${id}/thumbnail`),
    getFullUrl: vi.fn(id => `/api/images/${id}/full`)
  }
}))

const mockSetState = vi.fn()
const mockedUseImageStore = Object.assign(vi.mocked(useImageStore), {
  setState: mockSetState
})

const mockImage: Image = {
  id: 'img1',
  filename: 'test.jpg',
  originalName: 'test-image.jpg',
  mimeType: 'processing',
  size: 0,
  width: 0,
  height: 0,
  hash: 'abc123hash',
  storagePath: '/path/to/test.jpg',
  thumbnailPath: '/thumbs/test-image.jpg',
  createdAt: new Date('2023-01-01T12:00:00Z'),
  updatedAt: new Date('2023-01-01T12:00:00Z'),
  tags: [{ id: 'general:landscape', name: 'general:landscape', category: 'general' }]
}

const mockImage2: Image = {
  ...mockImage,
  id: 'img2',
  originalName: 'test-image-2.png',
  tags: []
}

const createMockStore = (overrides: Partial<ReturnType<typeof useImageStore>> = {}): ReturnType<typeof useImageStore> => ({
  images: [mockImage, mockImage2],
  total: 2,
  page: 1,
  isLoading: false,
  hasMore: false,
  selectedIds: new Set<string>(),
  activeTagFilter: [],
  searchQuery: '',
  isInitialized: true,
  fetchImages: vi.fn(async () => undefined),
  fetchMore: vi.fn(async () => undefined),
  addImages: vi.fn(),
  removeImages: vi.fn(),
  toggleSelect: vi.fn(),
  selectAll: vi.fn(),
  clearSelection: vi.fn(),
  setSearchQuery: vi.fn(),
  ...overrides
})

describe('DetailRail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(duplicatesApi.list).mockResolvedValue({ items: [] })
    vi.mocked(tagBatchApi.mutate).mockResolvedValue({ updated: 1 })
  })

  const mockStore = (overrides: Partial<ReturnType<typeof useImageStore>> = {}) => {
    mockedUseImageStore.mockReturnValue(createMockStore(overrides))
  }

  it('renders empty state when no images are selected', () => {
    mockStore()

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('No image selected')).toBeInTheDocument()
    expect(screen.queryByText('Details')).not.toBeInTheDocument()
  })

  it('renders detail view when exactly one image is selected', async () => {
    mockStore({
        selectedIds: new Set(['img1'])
    })

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    
    const img = screen.getByAltText('test-image.jpg')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/thumbs/test-image.jpg')

    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('processing')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    
    expect(screen.getByText('general:landscape')).toBeInTheDocument()

    expect(screen.getByPlaceholderText('Add tag (e.g. category:name)...')).toBeInTheDocument()
    expect(screen.getByText(/Duplicate Context/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('No pending duplicates')).toBeInTheDocument()
    })
  })

  it('does not render a preview image when thumbnail path is only a relative storage path', () => {
    mockStore({
      selectedIds: new Set(['img1']),
      images: [{
        ...mockImage,
        thumbnailPath: 'ab/cd.jpg'
      }]
    })

    render(<DetailRail />)

    expect(screen.queryByAltText('test-image.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('Preview unavailable')).toBeInTheDocument()
  })

  it('renders summary state when multiple images are selected', () => {
    mockStore({
        selectedIds: new Set(['img1', 'img2'])
    })

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('2 images selected')).toBeInTheDocument()
    expect(screen.getByText('Batch Tagging')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tag (e.g. category:name)...')).toBeInTheDocument()
  })

  it('renders an explicit fallback state when a selected image is missing from the current list', () => {
    mockStore({
        selectedIds: new Set(['missing-image-id'])
    })

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Selected image is not available in the current results')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Add tag (e.g. category:name)...')).not.toBeInTheDocument()
  })

  it('adds a tag to a single image', async () => {
    mockStore({
        selectedIds: new Set(['img1'])
    })

    render(<DetailRail />)

    const input = screen.getByPlaceholderText('Add tag (e.g. category:name)...')
    fireEvent.change(input, { target: { value: 'person:alice' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(tagBatchApi.mutate).toHaveBeenCalledWith(
        ['img1'],
        [{ category: 'person', name: 'alice' }],
        []
      )
    })
  })

  it('rejects an unstructured single-image tag before calling the backend', async () => {
    mockStore({
      selectedIds: new Set(['img1'])
    })

    render(<DetailRail />)

    const input = screen.getByPlaceholderText('Add tag (e.g. category:name)...')
    fireEvent.change(input, { target: { value: 'landscape' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Use the format category:name')).toBeInTheDocument()
    })
    expect(tagBatchApi.mutate).not.toHaveBeenCalled()
  })

  it('removes a tag from a single image', async () => {
    mockStore({
        selectedIds: new Set(['img1'])
    })

    render(<DetailRail />)

    const removeButton = screen.getByTitle('Remove tag')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(tagBatchApi.mutate).toHaveBeenCalledWith(
        ['img1'],
        [],
        ['general:landscape']
      )
    })
  })

  it('adds a tag to multiple images', async () => {
    mockStore({
        selectedIds: new Set(['img1', 'img2'])
    })

    render(<DetailRail />)

    const input = screen.getByPlaceholderText('Tag (e.g. category:name)...')
    fireEvent.change(input, { target: { value: 'event:birthday' } })
    
    const addButton = screen.getByText('Add to All')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(tagBatchApi.mutate).toHaveBeenCalledWith(
        ['img1', 'img2'],
        [{ category: 'event', name: 'birthday' }],
        []
      )
    })
  })

  it('rejects an unstructured batch tag before calling the backend', async () => {
    mockStore({
      selectedIds: new Set(['img1', 'img2'])
    })

    render(<DetailRail />)

    const input = screen.getByPlaceholderText('Tag (e.g. category:name)...')
    fireEvent.change(input, { target: { value: 'birthday' } })
    fireEvent.click(screen.getByText('Add to All'))

    await waitFor(() => {
      expect(screen.getByText('Use the format category:name')).toBeInTheDocument()
    })
    expect(tagBatchApi.mutate).not.toHaveBeenCalled()
  })

  it('removes a tag from multiple images', async () => {
    mockStore({
        selectedIds: new Set(['img1', 'img2'])
    })

    render(<DetailRail />)

    const input = screen.getByPlaceholderText('Tag (e.g. category:name)...')
    fireEvent.change(input, { target: { value: 'event:birthday' } })
    
    const removeButton = screen.getByText('Remove from All')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(tagBatchApi.mutate).toHaveBeenCalledWith(
        ['img1', 'img2'],
        [],
        ['event:birthday']
      )
    })
  })

  it('displays duplicate candidates when present', async () => {
    mockStore({
        selectedIds: new Set(['img1'])
    })
    
    vi.mocked(duplicatesApi.list).mockResolvedValue({
      items: [
        { id: 'dup1', image_a_id: 'img1', image_b_id: 'otherimg', score: 0.95, status: 'pending' },
        { id: 'dup2', image_a_id: 'img1', image_b_id: 'another', score: 0.88, status: 'pending' }
      ]
    })

    render(<DetailRail />)

    await waitFor(() => {
      expect(screen.getByText('otherimg...')).toBeInTheDocument()
      expect(screen.getByText('95.0% match')).toBeInTheDocument()
      expect(screen.getByText('another...')).toBeInTheDocument()
      expect(screen.getByText('88.0% match')).toBeInTheDocument()
    })
  })
})
