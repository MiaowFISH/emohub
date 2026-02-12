import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTagStore } from '@/stores/tagStore'

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
}

export const TagManager = ({ isOpen, onClose }: TagManagerProps) => {
  const { t } = useTranslation('images')
  const { t: tCommon } = useTranslation('common')
  const { tags, createTag, renameTag, deleteTag } = useTagStore()
  const [newTagName, setNewTagName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      await createTag(newTagName.trim())
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return
    try {
      await renameTag(editingId, editingName.trim())
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      console.error('Failed to rename tag:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDeleteClick = (id: string, imageCount: number) => {
    if (imageCount > 0) {
      setDeleteConfirmId(id)
    } else {
      handleConfirmDelete(id)
    }
  }

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteTag(id)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const confirmingTag = tags.find(t => t.id === deleteConfirmId)

  return (
    <>
      {/* Modal overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={onClose}
      >
        {/* Modal content */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px var(--color-shadow)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{t('tag_manager.title')}</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          {/* Create tag row */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              gap: '8px'
            }}
          >
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag()
              }}
              placeholder={t('tag_manager.new_tag_placeholder')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
            <button
              onClick={handleCreateTag}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-info)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {tCommon('actions.add')}
            </button>
          </div>

          {/* Tag list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 0'
            }}
          >
            {tags.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)'
                }}
              >
                {t('tag_manager.no_tags')}
              </div>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  style={{
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid var(--color-bg-tertiary)'
                  }}
                >
                  {editingId === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid var(--color-accent)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {tCommon('actions.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-disabled-text)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {tCommon('actions.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{tag.name}</span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}
                        >
                          {t('tag_manager.image_count', { count: tag.imageCount })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(tag.id, tag.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-accent-bg)',
                          color: 'var(--color-accent)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {tCommon('actions.rename')}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tag.id, tag.imageCount)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-danger-bg)',
                          color: 'var(--color-danger)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {tCommon('actions.delete')}
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId && confirmingTag && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--color-overlay-heavy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px var(--color-shadow)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {t('tag_manager.delete_tag_title')}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {t('tag_manager.delete_tag_message', { count: confirmingTag.imageCount })}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {tCommon('actions.cancel')}
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {tCommon('actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
