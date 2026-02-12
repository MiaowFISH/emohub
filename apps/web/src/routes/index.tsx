import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { TagFilter } from '@/components/TagFilter'
import { ImageUpload } from '@/components/ImageUpload'
import { ImageToolbar } from '@/components/ImageToolbar'
import { ImageGrid } from '@/components/ImageGrid'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useImageStore } from '@/stores/imageStore'

const HomePage = () => {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [showTagManager, setShowTagManager] = useState(false)
  const { images } = useImageStore()

  return (
    <div style={{
      display: 'flex',
      height: '100vh'
    }}>
      {/* Left sidebar - Tag filter */}
      <TagFilter />

      {/* Right main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        overflowY: 'auto'
      }}>
        {/* Header with upload and manage tags button */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <ImageUpload />
          <button
            onClick={() => setShowTagManager(true)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#3b82f6',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            Manage Tags
          </button>
        </div>

        <ImageToolbar />
        <ImageGrid onImageClick={setLightboxIndex} />
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />

        {/* TagManager modal placeholder - will be replaced by Plan 02 */}
        {showTagManager && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setShowTagManager(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '600px',
                width: '90%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px 0' }}>Tag Manager</h2>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Tag management UI will be implemented in Plan 03-02
              </p>
              <button
                onClick={() => setShowTagManager(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
