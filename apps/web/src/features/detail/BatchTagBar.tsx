import React, { useState } from 'react'
import { tagBatchApi } from '@/lib/api'
import { useImageStore } from '@/stores/imageStore'

interface BatchTagBarProps {
  count: number
}

export const BatchTagBar: React.FC<BatchTagBarProps> = ({ count }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { selectedIds } = useImageStore()
  const selectedImageIds = Array.from(selectedIds)

  const parseStructuredTag = (rawInput: string) => {
    const separatorIndex = rawInput.indexOf(':')
    if (separatorIndex <= 0 || separatorIndex === rawInput.length - 1) {
      return null
    }

    const category = rawInput.slice(0, separatorIndex).trim()
    const name = rawInput.slice(separatorIndex + 1).trim()
    if (!category || !name || category.includes(':') || name.includes(':')) {
      return null
    }

    return { category, name, normalizedKey: `${category}:${name}` }
  }

  const handleAction = async (action: 'add' | 'remove') => {
    if (!inputValue.trim()) return

    const parsedTag = parseStructuredTag(inputValue.trim())
    if (!parsedTag) {
      setErrorMessage('Use the format category:name')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      if (action === 'add') {
        await tagBatchApi.mutate(selectedImageIds, [{ category: parsedTag.category, name: parsedTag.name }], [])
        
        const newTag = { id: parsedTag.normalizedKey, name: parsedTag.normalizedKey, category: parsedTag.category }
        useImageStore.setState(state => ({
          images: state.images.map(img => {
            if (state.selectedIds.has(img.id)) {
              const currentTags = img.tags || []
              if (!currentTags.some(t => t.id === parsedTag.normalizedKey)) {
                return { ...img, tags: [...currentTags, newTag] }
              }
            }
            return img
          })
        }))
      } else {
        await tagBatchApi.mutate(selectedImageIds, [], [parsedTag.normalizedKey])
        
        useImageStore.setState(state => ({
          images: state.images.map(img => {
            if (state.selectedIds.has(img.id)) {
              const currentTags = img.tags || []
              return { ...img, tags: currentTags.filter(t => t.id !== parsedTag.normalizedKey) }
            }
            return img
          })
        }))
      }
      setInputValue('')
    } catch (err) {
      setErrorMessage('Failed to update tags')
      console.error(`Failed to ${action} tag in batch`, err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      marginTop: '16px',
      backgroundColor: 'var(--color-bg-tertiary)',
      border: '1px dashed var(--color-border)',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px'
    }}>
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
          {count} images selected
        </div>
        <div style={{ fontSize: '0.9rem' }}>
          Batch Tagging
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          placeholder="Tag (e.g. category:name)..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSubmitting}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        {errorMessage && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-danger, #d14343)' }}>
            {errorMessage}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleAction('add')}
            disabled={isSubmitting || !inputValue.trim()}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text)',
              cursor: isSubmitting || !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !inputValue.trim() ? 0.5 : 1
            }}
          >
            Add to All
          </button>
          <button
            onClick={() => handleAction('remove')}
            disabled={isSubmitting || !inputValue.trim()}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-muted)',
              cursor: isSubmitting || !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !inputValue.trim() ? 0.5 : 1
            }}
          >
            Remove from All
          </button>
        </div>
      </div>
    </div>
  )
}
