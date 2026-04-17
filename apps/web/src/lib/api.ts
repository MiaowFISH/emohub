import type { Image, ImageUploadResult, ApiResponse, PaginatedResponse, Tag, TagWithCount } from '@emohub/shared'

const baseUrl = ''

interface BackendGalleryItem {
  id: string
  original_name: string
  thumbnail_url: string
  processing_state: string
  embedding_state: string
  tags: string[]
}

interface BackendGalleryResponse {
  items: BackendGalleryItem[]
}

interface BackendSearchResponse extends BackendGalleryResponse {
  mode: 'hybrid' | 'text_tag_fallback'
}

const PLACEHOLDER_DATE = new Date(0)

function toTagShape(normalizedKey: string): NonNullable<Image['tags']>[number] {
  const separatorIndex = normalizedKey.indexOf(':')
  return {
    id: normalizedKey,
    name: normalizedKey,
    category: separatorIndex > 0 ? normalizedKey.slice(0, separatorIndex) : null
  }
}

function toImageShape(item: BackendGalleryItem): Image {
  return {
    id: item.id,
    filename: item.original_name,
    originalName: item.original_name,
    mimeType: '',
    size: 0,
    width: 0,
    height: 0,
    hash: '',
    storagePath: '',
    thumbnailPath: item.thumbnail_url ? `/media/thumbs/${item.thumbnail_url}` : null,
    createdAt: PLACEHOLDER_DATE,
    updatedAt: PLACEHOLDER_DATE,
    tags: item.tags.map(toTagShape)
  }
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export const uploadApi = {
  async precheck(hashes: string[]): Promise<{ existing: { hash: string, image_id: string }[], missing: string[] }> {
    const response = await fetch(`${baseUrl}/api/uploads/precheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes })
    })
    return handleResponse(response)
  },
  
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{ duplicate: boolean, image: { id: string, sha256: string, processing_state: string, thumbnail_url: string } }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${baseUrl}/api/uploads/files`)
      
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText))
          } catch (e) {
            reject(new Error('Invalid JSON response'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error'))
      
      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
    })
  }
}

export const imageApi = {
  async list(page = 1, limit = 50, tagIds?: string[], search?: string): Promise<PaginatedResponse<Image>> {
    const cleanedSearch = search?.trim()
    const params = new URLSearchParams()
    if (cleanedSearch) {
      params.append('q', cleanedSearch)
    }
    if (tagIds && tagIds.length > 0) {
      tagIds.forEach((tagId) => {
        params.append('tag', tagId)
      })
    }

    const path = cleanedSearch ? '/api/search' : '/api/gallery'
    const response = await fetch(withQuery(`${baseUrl}${path}`, params))
    const payload = await handleResponse<BackendGalleryResponse | BackendSearchResponse>(response)
    const data = payload.items.map(toImageShape)

    return {
      success: true,
      data,
      meta: {
        total: data.length,
        page,
        limit
      }
    }
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
    const response = await fetch(`${baseUrl}/api/gallery/batch`, {
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
    const response = await fetch(`${baseUrl}/api/tags/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_ids: imageIds,
        add: tagIds,
        remove: []
      })
    })
    return handleResponse<ApiResponse<void>>(response)
  },

  async batchRemove(imageIds: string[], tagIds: string[]): Promise<ApiResponse<void>> {
    const response = await fetch(`${baseUrl}/api/tags/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_ids: imageIds,
        add: [],
        remove: tagIds
      })
    })
    return handleResponse<ApiResponse<void>>(response)
  },

  async getImageTags(imageId: string): Promise<ApiResponse<Tag[]>> {
    const response = await fetch(`${baseUrl}/api/tags/image/${imageId}`)
    return handleResponse<ApiResponse<Tag[]>>(response)
  }
}

export const tagBatchApi = {
  async mutate(imageIds: string[], add: {category: string, name: string}[], remove: string[]): Promise<{updated: number}> {
    const response = await fetch(`${baseUrl}/api/tags/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_ids: imageIds,
        add,
        remove
      })
    })
    return handleResponse<{updated: number}>(response)
  }
}

export const duplicatesApi = {
  async list(): Promise<{items: {id: string, image_a_id: string, image_b_id: string, score: number, status: string}[]}> {
    const response = await fetch(`${baseUrl}/api/duplicates`)
    return handleResponse<{items: {id: string, image_a_id: string, image_b_id: string, score: number, status: string}[]}>(response)
  }
}
