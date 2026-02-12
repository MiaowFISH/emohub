import { useState } from 'react'
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
  const [currentIndex, setCurrentIndex] = useState(index)
  const { images: storeImages } = useImageStore()

  const slides = images.map(img => ({
    src: imageApi.getFullUrl(img.id),
    alt: img.originalName,
    width: img.width,
    height: img.height
  }))

  const currentImage = images[currentIndex]

  const handleTagsChange = (newTags: ImageTag[]) => {
    // Update the image in the store
    const imageIndex = storeImages.findIndex(img => img.id === currentImage.id)
    if (imageIndex !== -1) {
      const updatedImages = [...storeImages]
      updatedImages[imageIndex] = { ...updatedImages[imageIndex], tags: newTags }
      useImageStore.setState({ images: updatedImages })
    }
    // Also update local images array
    images[currentIndex] = { ...currentImage, tags: newTags }
  }

  return (
    <>
      <Lightbox
        open={index >= 0}
        close={onClose}
        index={currentIndex}
        slides={slides}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        on={{
          view: ({ index: newIndex }) => setCurrentIndex(newIndex)
        }}
      />
      {/* Tag input overlay */}
      {index >= 0 && currentImage && (
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
