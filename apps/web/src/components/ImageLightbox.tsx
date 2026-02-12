import { useRef, useState, useCallback, useMemo } from 'react'
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
  const prevIndexRef = useRef(index)
  const [, forceUpdate] = useState(0)
  const { images: storeImages } = useImageStore()

  const isOpen = index >= 0

  // Only sync ref when parent passes a genuinely new index (clicking a different image)
  if (index !== prevIndexRef.current) {
    prevIndexRef.current = index
    viewIndexRef.current = index
  }

  const imageIds = images.map(img => img.id).join(',')
  const slides = useMemo(() => images.map(img => ({
    src: imageApi.getFullUrl(img.id),
    alt: img.originalName,
    width: img.width,
    height: img.height
  })), [imageIds])

  const handleView = useCallback(({ index: newIndex }: { index: number }) => {
    viewIndexRef.current = newIndex
    forceUpdate(n => n + 1)
  }, [])

  const activeIndex = viewIndexRef.current
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
      render={{
        controls: currentImage ? () => (
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '600px',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TagInput
              imageId={currentImage.id}
              currentTags={currentImage.tags || []}
              onTagsChange={handleTagsChange}
            />
          </div>
        ) : undefined,
      }}
    />
  )
}
