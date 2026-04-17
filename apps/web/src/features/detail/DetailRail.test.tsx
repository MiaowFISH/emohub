import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DetailRail } from './DetailRail'
import { useImageStore } from '@/stores/imageStore'
import type { Image } from '@emohub/shared'

vi.mock('@/stores/imageStore', () => ({
  useImageStore: vi.fn()
}))

const mockImage: Image = {
  id: 'img1',
  filename: 'test.jpg',
  originalName: 'test-image.jpg',
  mimeType: 'image/jpeg',
  size: 2621440,
  width: 1920,
  height: 1080,
  hash: 'abc123hash',
  storagePath: '/path/to/test.jpg',
  thumbnailPath: null,
  createdAt: new Date('2023-01-01T12:00:00Z'),
  updatedAt: new Date('2023-01-01T12:00:00Z'),
  tags: [{ id: 'tag1', name: 'landscape', category: null }]
}

const mockImage2: Image = {
  ...mockImage,
  id: 'img2',
  originalName: 'test-image-2.png'
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
  })

  it('renders empty state when no images are selected', () => {
    vi.mocked(useImageStore).mockReturnValue(createMockStore())

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('No image selected')).toBeInTheDocument()
    expect(screen.queryByText('Details')).not.toBeInTheDocument()
  })

  it('renders detail view when exactly one image is selected', () => {
    vi.mocked(useImageStore).mockReturnValue(createMockStore({
      selectedIds: new Set(['img1'])
    }))

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    
    const img = screen.getByAltText('test-image.jpg')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/api/images/img1/file')

    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('1920 × 1080')).toBeInTheDocument()
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()
    expect(screen.getByText('image/jpeg')).toBeInTheDocument()
    
    expect(screen.getByText('landscape')).toBeInTheDocument()

    expect(screen.getByText(/Tag Editor/i)).toBeInTheDocument()
    expect(screen.getByText(/Duplicate Context/i)).toBeInTheDocument()
  })

  it('renders summary state when multiple images are selected', () => {
    vi.mocked(useImageStore).mockReturnValue(createMockStore({
      selectedIds: new Set(['img1', 'img2'])
    }))

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('2 images selected')).toBeInTheDocument()
    expect(screen.getByText(/Bulk actions will be available here/i)).toBeInTheDocument()
  })

  it('renders an explicit fallback state when a selected image is missing from the current list', () => {
    vi.mocked(useImageStore).mockReturnValue(createMockStore({
      selectedIds: new Set(['missing-image-id'])
    }))

    render(<DetailRail />)

    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Selected image is not available in the current results')).toBeInTheDocument()
    expect(screen.queryByText('Tag Editor')).not.toBeInTheDocument()
  })
})
