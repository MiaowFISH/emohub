import { useDropzone } from 'react-dropzone'
import { useImageStore } from '@/stores/imageStore'
import { imageApi } from '@/lib/api'
import { useState, useCallback, useEffect } from 'react'

interface UploadResult {
  filename: string
  duplicate: boolean
  error?: string
}

export const ImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const { addImages } = useImageStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    setResults([])

    try {
      const response = await imageApi.upload(acceptedFiles)

      if (response.success && response.data) {
        // Normalize response.data to array
        const dataArray = Array.isArray(response.data) ? response.data : [response.data]

        const uploadResults: UploadResult[] = dataArray.map((item, index) => ({
          filename: item.originalName || acceptedFiles[index]?.name || 'Unknown',
          duplicate: !!item.duplicate,
          error: undefined
        }))

        // Only add non-duplicate images to the store
        const newImages = dataArray.filter(item => !item.duplicate)

        if (newImages.length > 0) {
          addImages(newImages)
        }

        setResults(uploadResults)
      } else {
        setResults([{
          filename: 'Upload',
          duplicate: false,
          error: response.error || 'Upload failed'
        }])
      }
    } catch (error) {
      setResults([{
        filename: 'Upload',
        duplicate: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }])
    } finally {
      setIsUploading(false)
    }
  }, [addImages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    maxSize: 10 * 1024 * 1024
  })

  useEffect(() => {
    if (results.length > 0) {
      const timer = setTimeout(() => {
        setResults([])
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [results])

  return (
    <div style={{ width: '100%' }}>
      <div
        {...getRootProps()}
        style={{
          border: isDragActive ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border-light)',
          backgroundColor: isDragActive ? 'var(--color-accent-bg)' : 'transparent',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '3px solid var(--color-border)',
                borderTop: '3px solid var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Uploading...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div>
            <svg
              style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: 'var(--color-text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500 }}>
              {isDragActive ? 'Drop images here' : 'Drag and drop images here, or click to select'}
            </p>
            <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Supports JPG, PNG, WebP, GIF (max 10MB)
            </p>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: result.error ? '#fef2f2' : result.duplicate ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${result.error ? '#fecaca' : result.duplicate ? '#fde68a' : '#bbf7d0'}`
              }}
            >
              {result.error ? (
                <svg style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : result.duplicate ? (
                <svg style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg style={{ width: '20px', height: '20px', color: '#22c55e', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', flex: 1 }}>
                {result.filename}
                {result.duplicate && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>(duplicate)</span>}
                {result.error && <span style={{ color: '#ef4444', marginLeft: '8px' }}>- {result.error}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
