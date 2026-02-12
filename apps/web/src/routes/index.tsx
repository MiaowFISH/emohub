import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TagFilter } from '@/components/TagFilter'
import { TagManager } from '@/components/TagManager'
import { ImageUpload } from '@/components/ImageUpload'
import { SearchBar } from '@/components/SearchBar'
import { ImageToolbar } from '@/components/ImageToolbar'
import { ImageGrid } from '@/components/ImageGrid'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useImageStore } from '@/stores/imageStore'

const HomePage = () => {
  const { t } = useTranslation('images')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [showTagManager, setShowTagManager] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { images } = useImageStore()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="app-container">
      {/* Hamburger button - mobile only */}
      {isMobile && (
        <button
          className="hamburger-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={t('filter.toggle_menu')}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Backdrop overlay - mobile only */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-backdrop visible"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Left sidebar - Tag filter */}
      <TagFilter
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Right main content area */}
      <div className="main-content">
        {/* Top bar: search + manage tags */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <SearchBar />
          </div>
          <button
            onClick={() => setShowTagManager(true)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-accent)',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-accent)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'
            }}
          >
            {t('tag_manager.title')}
          </button>
        </div>

        {/* Upload area */}
        <ImageUpload />

        <ImageToolbar />
        <ImageGrid onImageClick={setLightboxIndex} />
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />

        <TagManager isOpen={showTagManager} onClose={() => setShowTagManager(false)} />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
