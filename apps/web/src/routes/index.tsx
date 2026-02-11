import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ImageUpload } from '@/components/ImageUpload'
import { ImageGrid } from '@/components/ImageGrid'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useImageStore } from '@/stores/imageStore'

const HomePage = () => {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const { images } = useImageStore()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      gap: '16px',
      padding: '16px'
    }}>
      <ImageUpload />
      <ImageGrid onImageClick={setLightboxIndex} />
      <ImageLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
