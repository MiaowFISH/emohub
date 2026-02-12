import { useState, useEffect } from 'react'
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
    if (newTag.value) {
      // Existing tag
      setSelectedTags([...selectedTags, newTag])
    } else {
      // New tag - create it first
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
          alert('Please select at least one tag')
          setIsLoading(false)
          return
        }
        await tagApi.batchAdd(imageIds, tagIds)
      } else {
        const tagIds = Array.from(checkedTagIds)
        if (tagIds.length === 0) {
          alert('Please select at least one tag to remove')
          setIsLoading(false)
          return
        }
        await tagApi.batchRemove(imageIds, tagIds)
      }
      onComplete()
    } catch (error) {
      alert(`Failed to ${mode} tags: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
          {mode === 'add' ? `Add Tags to ${imageIds.length} Images` : `Remove Tags from ${imageIds.length} Images`}
        </h3>

        {mode === 'add' ? (
          <div style={{ marginBottom: '20px' }}>
            {/* @ts-ignore react-tag-autocomplete types incompatible with React 19 */}
            <ReactTags
              selected={selectedTags}
              suggestions={suggestions}
              onAdd={handleAddTags}
              onDelete={handleDeleteTag}
              allowNew={true}
              placeholderText="Type to add tags..."
              noOptionsText="No matching tags"
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
              <p style={{ color: '#6b7280', fontSize: '14px' }}>No tags available</p>
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
                      backgroundColor: checkedTagIds.has(tag.id) ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedTagIds.has(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      {tag.name}
                      <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
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
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'add' ? '#10b981' : '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'white',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Processing...' : mode === 'add' ? 'Apply' : 'Remove'}
          </button>
        </div>

        <style>{`
          .react-tags {
            position: relative;
            padding: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            font-size: 14px;
          }
          .react-tags.is-active {
            border-color: #3b82f6;
          }
          .react-tags__list {
            display: inline;
            padding: 0;
            margin: 0;
          }
          .react-tags__list-item {
            display: inline-block;
            margin: 0 4px 4px 0;
          }
          .react-tags__tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            background: #e5e7eb;
            border-radius: 4px;
            font-size: 13px;
          }
          .react-tags__tag-name {
            margin-right: 6px;
          }
          .react-tags__tag button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            color: #6b7280;
            font-size: 16px;
            line-height: 1;
          }
          .react-tags__tag button:hover {
            color: #ef4444;
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
          }
          .react-tags__listbox {
            position: absolute;
            z-index: 1000;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-height: 200px;
            overflow-y: auto;
            margin-top: 4px;
            min-width: 200px;
          }
          .react-tags__listbox-option {
            padding: 8px 12px;
            cursor: pointer;
          }
          .react-tags__listbox-option.is-active {
            background: #eff6ff;
            color: #3b82f6;
          }
          .react-tags__listbox-option-highlight {
            font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  )
}
