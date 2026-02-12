import type { Image, ImageUploadResult, ApiResponse, PaginatedResponse, Tag, TagWithCount } from '@emohub/shared'

const baseUrl = ''

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export const imageApi = {
  async list(page = 1, limit = 50, tagIds?: string[]): Promise<PaginatedResponse<Image>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (tagIds && tagIds.length > 0) {
      params.append('tagIds', tagIds.join(','))
    }
    const response = await fetch(`${baseUrl}/api/images?${params}`)
    return handleResponse<PaginatedResponse<Image>>(response)
  },

  async upload(files: File[]): Promise<ApiResponse<ImageUploadResult | ImageUploadResult[]>> {
    const formData = new FormData()
    files.forEach(file => formData.append('file', file))

    const response = await fetch(`${baseUrl}/api/images/upload`, {
      method: 'POST',
      body: formData
    })
    return handleResponse(response)
  },

  getThumbnailUrl(id: string): string {
    return `${baseUrl}/api/images/${id}/thumbnail`
  },

  getFullUrl(id: string): string {
    return `${baseUrl}/api/images/${id}/full`
  },

  async delete(id: string): Promise<ApiResponse<Image>> {
    const response = await fetch(`${baseUrl}/api/images/${id}`, {
      method: 'DELETE'
    })
    return handleResponse(response)
  },

  async deleteBatch(ids: string[]): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${baseUrl}/api/images/batch`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    return handleResponse(response)
  },

  async convertToGif(id: string): Promise<Blob> {
    const response = await fetch(`${baseUrl}/api/images/${id}/convert-gif`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`Failed to convert image: ${response.statusText}`)
    }
    return response.blob()
  }
}

export const tagApi = {
  async list(search?: string): Promise<ApiResponse<TagWithCount[]>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await fetch(`${baseUrl}/api/tags${params}`)
    return handleResponse<ApiResponse<TagWithCount[]>>(response)
  },

  async create(name: string, category?: string): Promise<ApiResponse<Tag>> {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    })
    return handleResponse<ApiResponse<Tag>>(response)
  },

  async rename(id: string, name: string): Promise<ApiResponse<Tag>> {
    const response = await fetch(`${baseUrl}/api/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    return handleResponse<ApiResponse<Tag>>(response)
  },

  async delete(id: string): Promise<ApiResponse<Tag>> {
    const response = await fetch(`${baseUrl}/api/tags/${id}`, {
      method: 'DELETE'
    })
    return handleResponse<ApiResponse<Tag>>(response)
  },

  async batchAdd(imageIds: string[], tagIds: string[]): Promise<ApiResponse<void>> {
    const response = await fetch(`${baseUrl}/api/tags/batch/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageIds, tagIds })
    })
    return handleResponse<ApiResponse<void>>(response)
  },

  async batchRemove(imageIds: string[], tagIds: string[]): Promise<ApiResponse<void>> {
    const response = await fetch(`${baseUrl}/api/tags/batch/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageIds, tagIds })
    })
    return handleResponse<ApiResponse<void>>(response)
  },

  async getImageTags(imageId: string): Promise<ApiResponse<Tag[]>> {
    const response = await fetch(`${baseUrl}/api/tags/image/${imageId}`)
    return handleResponse<ApiResponse<Tag[]>>(response)
  }
}
