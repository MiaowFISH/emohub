import React from 'react'
import { useImageStore } from '@/stores/imageStore'
import type { Image } from '@emohub/shared'

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

const SummaryState: React.FC<{ count: number }> = ({ count }) => (
  <div style={{
    marginTop: '16px',
    height: '200px',
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
      {count} images selected
    </div>
    <div style={{ fontSize: '0.9rem' }}>
      Bulk actions will be available here.
    </div>
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
  const tags = image.tags || []
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        aspectRatio: '1', 
        backgroundColor: 'var(--color-bg-tertiary)', 
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)'
      }}>
        <img 
          src={`/api/images/${image.id}/file`} 
          alt={image.originalName || 'Image preview'} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Metadata
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Name</span>
            <span style={{ wordBreak: 'break-all' }}>{image.originalName}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Dimensions</span>
            <span>{image.width} × {image.height}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Size</span>
            <span>{formatBytes(image.size)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Type</span>
            <span>{image.mimeType}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>Added</span>
            <span>{formatDate(image.createdAt)}</span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Tags</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map(tag => (
              <span key={tag.id} style={{ 
                backgroundColor: 'var(--color-bg-tertiary)', 
                border: '1px solid var(--color-border)',
                padding: '2px 8px', 
                borderRadius: '12px',
                fontSize: '0.8rem',
                color: 'var(--color-text)'
              }}>
                {tag.name}
              </span>
            ))}
            {tags.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No tags</span>}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Tag Editor
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'var(--color-text-muted)', 
            padding: '12px', 
            backgroundColor: 'var(--color-bg-tertiary)', 
            borderRadius: '4px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)'
          }}>
            Interactive tag editing placeholder
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Duplicate Context
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'var(--color-text-muted)', 
            padding: '12px', 
            backgroundColor: 'var(--color-bg-tertiary)', 
            borderRadius: '4px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)'
          }}>
            Duplicate resolution placeholder
          </div>
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
      {selectedCount > 1 && <SummaryState count={selectedCount} />}
      
    </div>
  )
}
