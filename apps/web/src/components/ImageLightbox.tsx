import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { imageApi } from '@/lib/api'
import type { Image } from '@emohub/shared'

interface ImageLightboxProps {
  images: Image[]
  index: number
  onClose: () => void
}

export const ImageLightbox = ({ images, index, onClose }: ImageLightboxProps) => {
  const slides = images.map(img => ({
    src: imageApi.getFullUrl(img.id),
    alt: img.originalName,
    width: img.width,
    height: img.height
  }))

  return (
    <Lightbox
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      carousel={{ finite: false }}
      controller={{ closeOnBackdropClick: true }}
    />
  )
}
