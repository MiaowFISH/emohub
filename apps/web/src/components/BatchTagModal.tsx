import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactTags, Tag as ReactTag } from 'react-tag-autocomplete'
import { useTagStore } from '@/stores/tagStore'
import { tagApi } from '@/lib/api'

interface BatchTagModalProps {
  mode: 'add' | 'remove'
  imageIds: string[]
  onClose: () => void
  onComplete: () => void
}

export const BatchTagModal = ({ mode, imageIds, onClose, onComplete }: BatchTagModalProps) => {
  const { t } = useTranslation('images')
  const { t: tCommon } = useTranslation('common')
  const { tags, fetchTags } = useTagStore()
  const [selectedTags, setSelectedTags] = useState<ReactTag[]>([])
  const [checkedTagIds, setCheckedTagIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags()
    }
  }, [tags.length, fetchTags])

  const suggestions = tags.map(tag => ({ value: tag.id, label: tag.name }))

  const handleAddTags = async (newTag: ReactTag) => {
    // Check if this is an existing tag by looking it up in the store
    const existingTag = tags.find(t => t.id === String(newTag.value))
    if (existingTag) {
      setSelectedTags([...selectedTags, { value: existingTag.id, label: existingTag.name }])
    } else {
      // New tag — create it first, then add to selection
      try {
        const response = await tagApi.create(newTag.label)
        if (response.data) {
          setSelectedTags([...selectedTags, { value: response.data.id, label: response.data.name }])
          await fetchTags()
        }
      } catch (error) {
        alert(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleDeleteTag = (index: number) => {
    setSelectedTags(selectedTags.filter((_, i) => i !== index))
  }

  const handleToggleTag = (tagId: string) => {
    const newChecked = new Set(checkedTagIds)
    if (newChecked.has(tagId)) {
      newChecked.delete(tagId)
    } else {
      newChecked.add(tagId)
    }
    setCheckedTagIds(newChecked)
  }

  const handleApply = async () => {
    setIsLoading(true)
    try {
      if (mode === 'add') {
        const tagIds = selectedTags.map(t => String(t.value))
        if (tagIds.length === 0) {
          alert(t('batch_tag.select_one_tag'))
          setIsLoading(false)
          return
        }
        await tagApi.batchAdd(imageIds, tagIds)
      } else {
        const tagIds = Array.from(checkedTagIds)
        if (tagIds.length === 0) {
          alert(t('batch_tag.select_one_tag_remove'))
          setIsLoading(false)
          return
        }
        await tagApi.batchRemove(imageIds, tagIds)
      }
      onComplete()
    } catch (error) {
      alert(t('batch_tag.operation_failed', { mode, error: error instanceof Error ? error.message : 'Unknown error' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-primary)',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '640px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {mode === 'add' ? t('batch_tag.add_title', { count: imageIds.length }) : t('batch_tag.remove_title', { count: imageIds.length })}
        </h3>

        {mode === 'add' ? (
          <div style={{ marginBottom: '20px', minHeight: '280px' }}>
            {/* @ts-ignore react-tag-autocomplete types incompatible with React 19 */}
            <ReactTags
              selected={selectedTags}
              suggestions={suggestions}
              onAdd={handleAddTags}
              onDelete={handleDeleteTag}
              allowNew={true}
              placeholderText={t('batch_tag.add_placeholder')}
              noOptionsText={t('tag_input.no_options')}
              classNames={{
                root: 'react-tags',
                rootIsActive: 'is-active',
                rootIsDisabled: 'is-disabled',
                rootIsInvalid: 'is-invalid',
                label: 'react-tags__label',
                tagList: 'react-tags__list',
                tagListItem: 'react-tags__list-item',
                tag: 'react-tags__tag',
                tagName: 'react-tags__tag-name',
                comboBox: 'react-tags__combobox',
                input: 'react-tags__combobox-input',
                listBox: 'react-tags__listbox',
                option: 'react-tags__listbox-option',
                optionIsActive: 'is-active',
                highlight: 'react-tags__listbox-option-highlight'
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            {tags.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{t('batch_tag.no_tags_available')}</p>
            ) : (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      backgroundColor: checkedTagIds.has(tag.id) ? 'var(--color-accent-bg)' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedTagIds.has(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {tag.name}
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                        ({tag.imageCount})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'var(--color-text-primary)'
            }}
          >
            {tCommon('actions.cancel')}
          </button>
          <button
            onClick={handleApply}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'add' ? 'var(--color-success)' : 'var(--color-warning)',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'white',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? tCommon('status.processing') : mode === 'add' ? tCommon('actions.apply') : tCommon('actions.remove')}
          </button>
        </div>

        <style>{`
          .react-tags {
            position: relative;
            padding: 8px;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg-primary);
            font-size: 14px;
            color: var(--color-text-primary);
          }
          .react-tags.is-active {
            border-color: var(--color-accent);
          }
          .react-tags__label {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0,0,0,0);
          }
          .react-tags__list {
            display: inline;
            padding: 0;
            margin: 0;
            list-style: none;
          }
          .react-tags__list-item {
            display: inline-block;
            margin: 0 4px 4px 0;
          }
          .react-tags__tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            background: var(--color-bg-tertiary);
            border: none;
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
            cursor: default;
            color: var(--color-text-primary);
            line-height: 1.4;
            gap: 4px;
          }
          .react-tags__tag:hover {
            background: var(--color-border);
          }
          .react-tags__tag-name {
            margin-right: 2px;
          }
          .react-tags__tag button,
          .react-tags__tag > button,
          .react-tags__list-item button {
            all: unset;
            cursor: pointer;
            color: var(--color-text-secondary);
            font-size: 14px;
            line-height: 1;
            padding: 0 2px;
            display: inline-flex;
            align-items: center;
          }
          .react-tags__tag button:hover,
          .react-tags__tag > button:hover,
          .react-tags__list-item button:hover {
            color: var(--color-danger);
          }
          .react-tags__combobox {
            display: inline-block;
          }
          .react-tags__combobox-input {
            border: none;
            outline: none;
            padding: 4px;
            font-size: 14px;
            min-width: 150px;
            font-family: inherit;
            background: transparent;
            color: var(--color-text-primary);
          }
          .react-tags__listbox {
            position: absolute;
            z-index: 1000;
            background: var(--color-bg-primary);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px var(--color-shadow);
            max-height: 200px;
            overflow-y: auto;
            margin-top: 4px;
            min-width: 200px;
            list-style: none;
            padding: 0;
            color: var(--color-text-primary);
          }
          .react-tags__listbox-option {
            padding: 8px 12px;
            cursor: pointer;
          }
          .react-tags__listbox-option.is-active {
            background: var(--color-accent-bg);
            color: var(--color-accent);
          }
          .react-tags__listbox-option-highlight {
            font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  )
}
