import { useTranslation } from 'react-i18next'
import { useImageStore } from '@/stores/imageStore'
import { useTagStore } from '@/stores/tagStore'
import { imageApi } from '@/lib/api'
import { useState, useCallback } from 'react'
import { BatchTagModal } from './BatchTagModal'
import '@/styles/buttons.css'

export const ImageToolbar = () => {
  const { t } = useTranslation('images')
  const { t: tCommon } = useTranslation('common')
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
      alert(t('toolbar.delete_failed', { error: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds, removeImages, clearSelection, t])

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
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap'
      }}>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {t('toolbar.selected_count', { count: selectedIds.size })}
        </span>

        <button
          onClick={selectAll}
          className="btn-secondary"
        >
          {t('toolbar.select_all')}
        </button>

        <button
          onClick={clearSelection}
          className="btn-secondary"
        >
          {tCommon('actions.clear')}
        </button>

        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: 'var(--color-border-light)',
          margin: '0 4px'
        }} />

        <button
          onClick={() => setBatchTagMode('add')}
          className="btn-success"
        >
          {t('toolbar.add_tags')}
        </button>

        <button
          onClick={() => setBatchTagMode('remove')}
          className="btn-warning"
        >
          {t('toolbar.remove_tags')}
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          className="btn-danger"
        >
          {isDeleting ? tCommon('status.deleting') : tCommon('actions.delete')}
        </button>

        <button
          onClick={handleConvertToGif}
          disabled={selectedIds.size !== 1 || isConverting}
          className="btn-primary"
        >
          {isConverting ? (isSelectedGif ? t('toolbar.downloading') : t('toolbar.converting')) : (isSelectedGif ? t('toolbar.download_gif') : t('toolbar.convert_to_gif'))}
        </button>
      </div>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {t('toolbar.confirm_delete_title')}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)' }}>
              {t('toolbar.confirm_delete_message', { count: selectedIds.size })}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                {tCommon('actions.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? tCommon('status.deleting') : tCommon('actions.delete')}
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
