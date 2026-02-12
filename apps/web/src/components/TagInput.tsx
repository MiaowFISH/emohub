import { useEffect, useState } from 'react'
import { ReactTags, Tag as ReactTag } from 'react-tag-autocomplete'
import { useTagStore } from '@/stores/tagStore'
import { tagApi } from '@/lib/api'

type ImageTag = { id: string; name: string; category: string | null }

interface TagInputProps {
  imageId: string
  currentTags: ImageTag[]
  onTagsChange: (tags: ImageTag[]) => void
}

export const TagInput = ({ imageId, currentTags, onTagsChange }: TagInputProps) => {
  const { tags, fetchTags } = useTagStore()
  const [selected, setSelected] = useState<ReactTag[]>([])

  // Fetch tags on mount if not loaded
  useEffect(() => {
    if (tags.length === 0) {
      fetchTags()
    }
  }, [tags.length, fetchTags])

  // Sync currentTags to selected format
  useEffect(() => {
    setSelected(currentTags.map(tag => ({ value: tag.id, label: tag.name })))
  }, [currentTags])

  // Build suggestions: all tags except already selected ones
  const suggestions = tags
    .filter(tag => !currentTags.some(ct => ct.id === tag.id))
    .map(tag => ({ value: tag.id, label: tag.name }))

  const handleAdd = async (newTag: ReactTag) => {
    try {
      // Check if this is an existing tag by looking it up in the store
      const existingTag = tags.find(t => t.id === String(newTag.value))
      if (existingTag) {
        // Existing tag selected from autocomplete
        await tagApi.batchAdd([imageId], [existingTag.id])
        const updatedTags = [...currentTags, existingTag]
        onTagsChange(updatedTags)
      } else {
        // New tag created inline (allowNew gives it a generated value, so check store instead)
        const response = await tagApi.create(newTag.label)
        if (response.data) {
          await tagApi.batchAdd([imageId], [response.data.id])
          const updatedTags = [...currentTags, response.data]
          onTagsChange(updatedTags)
          await fetchTags()
        }
      }
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleDelete = async (index: number) => {
    try {
      const removedTag = currentTags[index]
      await tagApi.batchRemove([imageId], [removedTag.id])
      const updatedTags = currentTags.filter((_, i) => i !== index)
      onTagsChange(updatedTags)
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* @ts-ignore react-tag-autocomplete types incompatible with React 19 */}
      <ReactTags
        selected={selected}
        suggestions={suggestions}
        onAdd={handleAdd}
        onDelete={handleDelete}
        allowNew={true}
        placeholderText="Add tags..."
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  )
}
