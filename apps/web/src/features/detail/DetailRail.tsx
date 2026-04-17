import React from 'react'
import { useImageStore } from '@/stores/imageStore'
import type { Image } from '@emohub/shared'
import { TagEditor } from './TagEditor'
import { BatchTagBar } from './BatchTagBar'
import { DuplicateReviewPanel } from './DuplicateReviewPanel'

const EmptyState: React.FC = () => (
  <div style={{
    marginTop: '16px',
    height: '200px',
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px dashed var(--color-border)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    padding: '16px'
  }}>
    No image selected
  </div>
)

const MissingSelectionState: React.FC = () => (
  <div style={{
    marginTop: '16px',
    minHeight: '200px',
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px dashed var(--color-border)',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    padding: '16px'
  }}>
    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
      Selected image is not available in the current results
    </div>
    <div style={{ fontSize: '0.9rem' }}>
      Refresh or clear the current selection to continue.
    </div>
  </div>
)

const DetailState: React.FC<{ image: Image }> = ({ image }) => {
  const tagCount = image.tags?.length ?? 0
  const hasPreview = Boolean(image.thumbnailPath && (image.thumbnailPath.startsWith('/') || image.thumbnailPath.startsWith('http://') || image.thumbnailPath.startsWith('https://')))
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        aspectRatio: '1', 
        backgroundColor: 'var(--color-bg-tertiary)', 
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)'
      }}>
        {hasPreview ? (
          <img 
            src={image.thumbnailPath ?? undefined}
            alt={image.originalName || 'Image preview'} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem'
          }}>
            Preview unavailable
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Metadata
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Name</span>
            <span style={{ wordBreak: 'break-all' }}>{image.originalName}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
            <span>{image.mimeType || 'Unknown file metadata'}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Preview</span>
            <span>{hasPreview ? 'Available' : 'Unavailable'}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Tags</span>
            <span>{tagCount}</span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Tag Editor
          </div>
          <TagEditor image={image} />
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Duplicate Context
          </div>
          <DuplicateReviewPanel image={image} />
        </div>

      </div>
    </div>
  )
}

export const DetailRail: React.FC = () => {
  const { selectedIds, images } = useImageStore()
  
  const selectedCount = selectedIds.size

  const selectedImage = selectedCount === 1
    ? images.find(img => selectedIds.has(img.id))
    : null

  return (
    <div style={{ 
      padding: '20px 16px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflowY: 'auto'
    }} data-testid="detail-rail">
      
      {selectedCount > 0 && (
        <h2 style={{ 
          fontSize: '1.1rem', 
          margin: '0 0 16px 0', 
          fontWeight: 600, 
          color: 'var(--color-text)' 
        }}>
          Details
        </h2>
      )}
      
      {selectedCount === 0 && <EmptyState />}
      {selectedCount === 1 && selectedImage && <DetailState image={selectedImage} />}
      {selectedCount === 1 && !selectedImage && <MissingSelectionState />}
      {selectedCount > 1 && <BatchTagBar count={selectedCount} />}
      
    </div>
  )
}
