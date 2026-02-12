import { useImageStore } from '@/stores/imageStore'
import { useTagStore } from '@/stores/tagStore'
import { imageApi } from '@/lib/api'
import { useState, useCallback } from 'react'
import { BatchTagModal } from './BatchTagModal'

export const ImageToolbar = () => {
  const { images, selectedIds, selectAll, clearSelection, removeImages, fetchImages } = useImageStore()
  const { fetchTags } = useTagStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [batchTagMode, setBatchTagMode] = useState<'add' | 'remove' | null>(null)

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const idsArray = Array.from(selectedIds)
      await imageApi.deleteBatch(idsArray)
      removeImages(idsArray)
      clearSelection()
      setShowConfirm(false)
    } catch (error) {
      alert(`Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds, removeImages, clearSelection])

  const selectedImage = selectedIds.size === 1
    ? images.find(img => selectedIds.has(img.id))
    : null
  const isSelectedGif = selectedImage?.mimeType === 'image/gif'

  const handleConvertToGif = useCallback(async () => {
    if (selectedIds.size !== 1) return

    setIsConverting(true)
    try {
      const id = Array.from(selectedIds)[0]
      const img = images.find(i => i.id === id)

      let blob: Blob
      if (img?.mimeType === 'image/gif') {
        // Already a GIF — download original directly
        const response = await fetch(imageApi.getFullUrl(id))
        blob = await response.blob()
      } else {
        blob = await imageApi.convertToGif(id)
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sticker-${id}.gif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsConverting(false)
    }
  }, [selectedIds, images])

  // Only show toolbar when there are selections
  if (selectedIds.size === 0) {
    return null
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap'
      }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>
          {selectedIds.size} selected
        </span>

        <button
          onClick={selectAll}
          style={{
            padding: '6px 12px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          Select All
        </button>

        <button
          onClick={clearSelection}
          style={{
            padding: '6px 12px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          Clear
        </button>

        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#d1d5db',
          margin: '0 4px'
        }} />

        <button
          onClick={() => setBatchTagMode('add')}
          style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'white'
          }}
        >
          Add Tags
        </button>

        <button
          onClick={() => setBatchTagMode('remove')}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f59e0b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'white'
          }}
        >
          Remove Tags
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '6px',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: 'white',
            opacity: isDeleting ? 0.6 : 1
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>

        <button
          onClick={handleConvertToGif}
          disabled={selectedIds.size !== 1 || isConverting}
          style={{
            padding: '6px 12px',
            backgroundColor: selectedIds.size === 1 ? '#3b82f6' : '#e5e7eb',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedIds.size === 1 && !isConverting ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            color: selectedIds.size === 1 ? 'white' : '#9ca3af',
            opacity: isConverting ? 0.6 : 1
          }}
        >
          {isConverting ? (isSelectedGif ? 'Downloading...' : 'Converting...') : (isSelectedGif ? 'Download GIF' : 'Convert to GIF')}
        </button>
      </div>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
              Confirm Delete
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280' }}>
              Delete {selectedIds.size} image(s)? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: 'white',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {batchTagMode && (
        <BatchTagModal
          mode={batchTagMode}
          imageIds={Array.from(selectedIds)}
          onClose={() => setBatchTagMode(null)}
          onComplete={async () => {
            setBatchTagMode(null)
            await fetchTags()
            await fetchImages()
          }}
        />
      )}
    </>
  )
}
