import type { Image, ApiResponse, PaginatedResponse } from '@emohub/shared'

const baseUrl = ''

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export const imageApi = {
  async list(page = 1, limit = 50): Promise<PaginatedResponse<Image>> {
    const response = await fetch(`${baseUrl}/api/images?page=${page}&limit=${limit}`)
    return handleResponse<PaginatedResponse<Image>>(response)
  },

  async upload(files: File[]): Promise<ApiResponse<Array<{ filename: string; duplicate: boolean; id: string; image: Image }>>> {
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
