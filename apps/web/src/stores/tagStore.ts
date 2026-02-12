import { create } from 'zustand'
import type { TagWithCount, Tag } from '@emohub/shared'
import { tagApi } from '@/lib/api'

interface TagState {
  tags: TagWithCount[]
  isLoading: boolean
  filterTagIds: Set<string>
  fetchTags: (search?: string) => Promise<void>
  createTag: (name: string, category?: string) => Promise<Tag>
  renameTag: (id: string, name: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  toggleFilterTag: (tagId: string) => void
  clearFilters: () => void
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  filterTagIds: new Set<string>(),

  fetchTags: async (search?: string) => {
    set({ isLoading: true })
    try {
      const response = await tagApi.list(search)
      const data = response.data || []
      set({
        tags: data,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      set({ isLoading: false })
    }
  },

  createTag: async (name: string, category?: string) => {
    try {
      const response = await tagApi.create(name, category)
      if (!response.data) {
        throw new Error('Failed to create tag')
      }
      const newTag = { ...response.data, imageCount: 0 }
      set(state => ({
        tags: [newTag, ...state.tags]
      }))
      return response.data
    } catch (error) {
      console.error('Failed to create tag:', error)
      throw error
    }
  },

  renameTag: async (id: string, name: string) => {
    try {
      const response = await tagApi.rename(id, name)
      if (!response.data) {
        throw new Error('Failed to rename tag')
      }
      set(state => ({
        tags: state.tags.map(tag =>
          tag.id === id
            ? { ...tag, name: response.data!.name }
            : tag
        )
      }))
    } catch (error) {
      console.error('Failed to rename tag:', error)
      throw error
    }
  },

  deleteTag: async (id: string) => {
    try {
      await tagApi.delete(id)
      set(state => {
        const newFilterTagIds = new Set(state.filterTagIds)
        newFilterTagIds.delete(id)
        return {
          tags: state.tags.filter(tag => tag.id !== id),
          filterTagIds: newFilterTagIds
        }
      })
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  },

  toggleFilterTag: (tagId: string) => {
    set(state => {
      const newFilterTagIds = new Set(state.filterTagIds)
      if (newFilterTagIds.has(tagId)) {
        newFilterTagIds.delete(tagId)
      } else {
        newFilterTagIds.add(tagId)
      }
      return { filterTagIds: newFilterTagIds }
    })
  },

  clearFilters: () => {
    set({ filterTagIds: new Set<string>() })
  }
}))
