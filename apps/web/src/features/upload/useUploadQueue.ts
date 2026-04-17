import { useState, useCallback } from 'react'
import { uploadApi } from '../../lib/api'
import { hashFile } from '../../lib/hash'
import { useImageStore } from '../../stores/imageStore'

export type UploadStatus = 'pending' | 'hashing' | 'prechecking' | 'uploading' | 'uploaded' | 'duplicate' | 'error'

export interface UploadQueueItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  hash?: string
  error?: string
  image?: { id: string, sha256: string, processing_state: string, thumbnail_url: string }
}

export function useUploadQueue() {
  const [items, setItems] = useState<UploadQueueItem[]>([])

  const updateItem = useCallback((id: string, updates: Partial<UploadQueueItem>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...updates } : item))
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const newItems: UploadQueueItem[] = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: 'pending',
      progress: 0
    }))
    
    setItems(current => [...newItems, ...current])

    const hashedItems = await Promise.all(
      newItems.map(async item => {
        updateItem(item.id, { status: 'hashing' })
        try {
          const hash = await hashFile(item.file)
          updateItem(item.id, { hash, status: 'prechecking' })
          return { ...item, hash }
        } catch (error) {
          updateItem(item.id, { status: 'error', error: 'Hashing failed' })
          return null
        }
      })
    )

    const validHashedItems = hashedItems.filter((i): i is UploadQueueItem & { hash: string } => i !== null)
    if (validHashedItems.length === 0) return

    const hashes = validHashedItems.map(i => i.hash)
    
    try {
      const { existing } = await uploadApi.precheck(hashes)
      const existingHashes = new Set(existing.map(e => e.hash))
      
      const missingItems = validHashedItems.filter(item => {
        if (existingHashes.has(item.hash)) {
          updateItem(item.id, { status: 'duplicate', progress: 100 })
          return false
        }
        return true
      })

      let uploadedCount = 0
      for (const item of missingItems) {
        updateItem(item.id, { status: 'uploading' })
        try {
          const response = await uploadApi.uploadFile(item.file, (progress) => {
            updateItem(item.id, { progress })
          })
          updateItem(item.id, { 
            status: response.duplicate ? 'duplicate' : 'uploaded', 
            progress: 100,
            image: response.image
          })
          if (!response.duplicate) {
            uploadedCount++
          }
        } catch (error) {
          updateItem(item.id, { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
      }

      if (uploadedCount > 0) {
        const storeState = useImageStore.getState()
        await storeState.fetchImages(1, storeState.activeTagFilter, storeState.searchQuery)
      }
    } catch (error) {
      validHashedItems.forEach(item => {
        updateItem(item.id, { status: 'error', error: 'Precheck failed' })
      })
    }
  }, [updateItem])

  const clearCompleted = useCallback(() => {
    setItems(current => current.filter(item => 
      item.status !== 'uploaded' && item.status !== 'duplicate'
    ))
  }, [])

  return { items, addFiles, clearCompleted }
}
