import { useRef, useCallback, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { imageApi } from '@/lib/api'
import { useImageStore } from '@/stores/imageStore'
import { TagInput } from '@/components/TagInput'
import { copyImageToClipboard } from '@/lib/clipboard'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { Image } from '@emohub/shared'

type ImageTag = { id: string; name: string; category: string | null }

interface ImageLightboxProps {
  images: Image[]
  index: number
  onClose: () => void
}

export const ImageLightbox = ({ images, index, onClose }: ImageLightboxProps) => {
  const { t } = useTranslation('images')
  const viewIndexRef = useRef(index)
  const { images: storeImages } = useImageStore()
  const [copyFormat, setCopyFormat] = useState<'original' | 'gif'>('original')

  const isOpen = index >= 0

  const slides = images.map(img => ({
    src: imageApi.getFullUrl(img.id),
    alt: img.originalName,
    width: img.width,
    height: img.height
  }))

  // Track which slide the user navigated to inside the lightbox
  const handleView = useCallback(({ index: newIndex }: { index: number }) => {
    viewIndexRef.current = newIndex
  }, [])

  // When opening, reset the ref to the clicked index
  if (isOpen) {
    viewIndexRef.current = index
  }

  const activeIndex = isOpen ? viewIndexRef.current : 0
  const currentImage = images[activeIndex]

  const handleTagsChange = (newTags: ImageTag[]) => {
    if (!currentImage) return
    const imageIndex = storeImages.findIndex(img => img.id === currentImage.id)
    if (imageIndex !== -1) {
      const updatedImages = [...storeImages]
      updatedImages[imageIndex] = { ...updatedImages[imageIndex], tags: newTags }
      useImageStore.setState({ images: updatedImages })
    }
  }

  const handleCopy = useCallback(async () => {
    if (!currentImage) return

    const url = imageApi.getFullUrl(currentImage.id)
    const toastId = toast.loading(t('clipboard.copying'))

    try {
      const result = await copyImageToClipboard(
        url,
        copyFormat,
        copyFormat === 'gif' ? async () => imageApi.convertToGif(currentImage.id) : undefined
      )

      if (result.success) {
        toast.success(t('clipboard.copy_success'), { id: toastId, duration: 2000 })
      } else {
        toast.error(result.error || t('clipboard.copy_failed'), { id: toastId })
      }
    } catch (error) {
      toast.error(t('clipboard.copy_failed'), { id: toastId })
    }
  }, [currentImage, copyFormat, t])

  if (!isOpen) return null

  return (
    <>
      <Lightbox
        open
        close={onClose}
        index={index}
        slides={slides}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        on={{ view: handleView }}
      />
      {currentImage && (
        <>
          <div
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              zIndex: 2000,
              pointerEvents: 'auto'
            }}
          >
            <select
              value={copyFormat}
              onChange={(e) => setCopyFormat(e.target.value as 'original' | 'gif')}
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="original">{t('clipboard.copy_original')}</option>
              <option value="gif">{t('clipboard.copy_as_gif')}</option>
            </select>
            <button
              onClick={handleCopy}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {t('clipboard.copy')}
            </button>
          </div>
          <div
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '600px',
              zIndex: 2000,
              pointerEvents: 'auto'
            }}
          >
            <TagInput
              imageId={currentImage.id}
              currentTags={currentImage.tags || []}
              onTagsChange={handleTagsChange}
            />
          </div>
        </>
      )}
    </>
  )
}
