import React, { useState } from 'react'
import type { Image } from '@emohub/shared'
import { tagBatchApi } from '@/lib/api'
import { useImageStore } from '@/stores/imageStore'

interface TagEditorProps {
  image: Image
}

export const TagEditor: React.FC<TagEditorProps> = ({ image }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const tags = image.tags || []

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

  const handleAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const parsedTag = parseStructuredTag(inputValue.trim())
      if (!parsedTag) {
        setErrorMessage('Use the format category:name')
        return
      }

      setIsSubmitting(true)
      setErrorMessage('')
      try {
        await tagBatchApi.mutate([image.id], [{ category: parsedTag.category, name: parsedTag.name }], [])
        const newTag = { id: parsedTag.normalizedKey, name: parsedTag.normalizedKey, category: parsedTag.category }
        
        useImageStore.setState(state => ({
          images: state.images.map(img => {
            if (img.id === image.id) {
              const currentTags = img.tags || []
              if (!currentTags.some(t => t.id === parsedTag.normalizedKey)) {
                return { ...img, tags: [...currentTags, newTag] }
              }
            }
            return img
          })
        }))
        setInputValue('')
      } catch (err) {
        setErrorMessage('Failed to update tags')
        console.error('Failed to add tag', err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRemove = async (normalizedKey: string) => {
    setIsSubmitting(true)
    try {
      await tagBatchApi.mutate([image.id], [], [normalizedKey])
      useImageStore.setState(state => ({
        images: state.images.map(img => {
          if (img.id === image.id) {
            const currentTags = img.tags || []
            return { ...img, tags: currentTags.filter(t => t.id !== normalizedKey) }
          }
          return img
        })
      }))
    } catch (err) {
      console.error('Failed to remove tag', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        placeholder="Add tag (e.g. category:name)..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAdd}
        disabled={isSubmitting}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text)',
          fontSize: '0.85rem',
          outline: 'none'
        }}
      />
      {errorMessage && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-danger, #d14343)' }}>
          {errorMessage}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {tags.map(tag => (
          <span key={tag.id} style={{ 
            backgroundColor: 'var(--color-bg-tertiary)', 
            border: '1px solid var(--color-border)',
            padding: '2px 6px 2px 8px', 
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {tag.name}
            <button 
              onClick={() => handleRemove(tag.id)}
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                fontSize: '10px'
              }}
              title="Remove tag"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
