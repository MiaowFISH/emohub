import { create } from 'zustand'
import type { Image } from '@emohub/shared'
import { imageApi } from '@/lib/api'

interface ImageState {
  images: Image[]
  total: number
  page: number
  isLoading: boolean
  hasMore: boolean
  selectedIds: Set<string>
  activeTagFilter: string[]
  searchQuery: string
  fetchImages: (page?: number, tagIds?: string[], search?: string) => Promise<void>
  fetchMore: () => Promise<void>
  addImages: (images: Image[]) => void
  removeImages: (ids: string[]) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setSearchQuery: (query: string) => void
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  total: 0,
  page: 1,
  isLoading: false,
  hasMore: true,
  selectedIds: new Set<string>(),
  activeTagFilter: [],
  searchQuery: '',

  fetchImages: async (page = 1, tagIds?: string[], search?: string) => {
    set({ isLoading: true })
    try {
      const response = await imageApi.list(page, 50, tagIds, search)
      const data = response.data || []
      set({
        images: data,
        total: response.meta.total,
        page: response.meta.page,
        isLoading: false,
        hasMore: data.length < response.meta.total,
        activeTagFilter: tagIds || [],
        searchQuery: search || ''
      })
    } catch (error) {
      console.error('Failed to fetch images:', error)
      set({ isLoading: false })
    }
  },

  fetchMore: async () => {
    const { isLoading, hasMore, page, images, activeTagFilter, searchQuery } = get()
    if (isLoading || !hasMore) return
    set({ isLoading: true })
    try {
      const nextPage = page + 1
      const tagIds = activeTagFilter.length > 0 ? activeTagFilter : undefined
      const response = await imageApi.list(nextPage, 50, tagIds, searchQuery || undefined)
      const newData = response.data || []
      const merged = [...images, ...newData]
      set({
        images: merged,
        total: response.meta.total,
        page: nextPage,
        isLoading: false,
        hasMore: merged.length < response.meta.total
      })
    } catch (error) {
      console.error('Failed to fetch more images:', error)
      set({ isLoading: false })
    }
  },

  addImages: (newImages) => {
    set(state => ({
      images: [...newImages, ...state.images],
      total: state.total + newImages.length
    }))
  },

  removeImages: (ids) => {
    set(state => {
      const newSelectedIds = new Set(state.selectedIds)
      ids.forEach(id => newSelectedIds.delete(id))
      return {
        images: state.images.filter(img => !ids.includes(img.id)),
        total: state.total - ids.length,
        selectedIds: newSelectedIds
      }
    })
  },

  toggleSelect: (id) => {
    set(state => {
      const newSelectedIds = new Set(state.selectedIds)
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      return { selectedIds: newSelectedIds }
    })
  },

  selectAll: () => {
    set(state => ({
      selectedIds: new Set(state.images.map(img => img.id))
    }))
  },

  clearSelection: () => {
    set({ selectedIds: new Set<string>() })
  },

  setSearchQuery: (query) => {
    const { activeTagFilter } = get()
    const tagIds = activeTagFilter.length > 0 ? activeTagFilter : undefined
    get().fetchImages(1, tagIds, query)
  }
}))
