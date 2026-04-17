import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WorkspaceLayout } from './WorkspaceLayout'

vi.mock('@/stores/imageStore', () => ({
  useImageStore: vi.fn().mockImplementation((selector) => {
    const store = {
      images: [],
      selectedIds: new Set(),
      isLoading: false,
      hasMore: false,
      fetchImages: vi.fn(),
      fetchMore: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
      activeTagFilter: []
    };
    return selector ? selector(store) : store;
  })
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('WorkspaceLayout', () => {
  it('composes the rails and gallery together', () => {
    render(<WorkspaceLayout />)
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    expect(screen.getByTestId('search-rail')).toBeInTheDocument()
    expect(screen.getByTestId('gallery-grid')).toBeInTheDocument()
    expect(screen.getByTestId('detail-rail')).toBeInTheDocument()
  })
})