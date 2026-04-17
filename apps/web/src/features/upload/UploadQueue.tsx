import React, { useRef } from 'react'
import { useUploadQueue, UploadStatus } from './useUploadQueue'

const STATUS_COLORS: Record<UploadStatus, { bg: string, text: string }> = {
  pending: { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' },
  hashing: { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)' },
  prechecking: { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)' },
  uploading: { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)' },
  uploaded: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  duplicate: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  error: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger)' },
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  pending: 'Pending',
  hashing: 'Hashing',
  prechecking: 'Checking',
  uploading: 'Uploading',
  uploaded: 'Done',
  duplicate: 'Exists',
  error: 'Error',
}

export const UploadQueue: React.FC = () => {
  const { items, addFiles, clearCompleted } = useUploadQueue()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const activeCount = items.filter(i => 
    i.status !== 'uploaded' && i.status !== 'duplicate' && i.status !== 'error'
  ).length

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Upload
        </h2>
        {items.length > 0 && activeCount === 0 && (
          <button 
            onClick={clearCompleted}
            className="btn-icon"
            style={{ fontSize: '0.75rem', padding: '2px 6px' }}
          >
            Clear
          </button>
        )}
      </div>

      <div 
        style={{
          border: '1px dashed var(--color-border-light)',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg-secondary)',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          if (e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files))
          }
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Drop files or click to select
        </span>
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          accept="image/*"
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>

      {items.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          maxHeight: '200px',
          overflowY: 'auto',
          paddingRight: '4px',
          scrollbarWidth: 'thin'
        }}>
          {items.map(item => (
            <div 
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {item.status === 'uploading' && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${item.progress}%`,
                  backgroundColor: 'var(--color-accent-bg)',
                  zIndex: 0,
                  transition: 'width 0.2s ease'
                }} />
              )}
              
              <div style={{ 
                zIndex: 1, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                maxWidth: '60%',
                color: 'var(--color-text-primary)'
              }} title={item.file.name}>
                {item.file.name}
              </div>

              <div style={{ 
                zIndex: 1,
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '12px',
                fontWeight: 600,
                backgroundColor: STATUS_COLORS[item.status].bg,
                color: STATUS_COLORS[item.status].text,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {STATUS_LABELS[item.status]}
                {item.status === 'uploading' && <span>{item.progress}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}