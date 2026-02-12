import { useRef, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { imageApi } from '@/lib/api'
import { useImageStore } from '@/stores/imageStore'
import { TagInput } from '@/components/TagInput'
import type { Image } from '@emohub/shared'

type ImageTag = { id: string; name: string; category: string | null }

interface ImageLightboxProps {
  images: Image[]
  index: number
  onClose: () => void
}

export const ImageLightbox = ({ images, index, onClose }: ImageLightboxProps) => {
  const viewIndexRef = useRef(index)
  const { images: storeImages } = useImageStore()

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

  if (!isOpen) return null

  return (
    <>
      <Lightbox
        open
        close={onClose}
        index={index}
        slides={slides}
        animation={{
          fade: 250,
          swipe: 250,
          navigation: 250,
        }}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        on={{ view: handleView }}
      />
      {currentImage && (
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
      )}
    </>
  )
}
