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
      if (newTag.value) {
        // Existing tag selected from autocomplete
        const tagId = String(newTag.value)
        await tagApi.batchAdd([imageId], [tagId])
        const addedTag = tags.find(t => t.id === tagId)
        if (addedTag) {
          const updatedTags = [...currentTags, addedTag]
          onTagsChange(updatedTags)
        }
      } else {
        // New tag created inline
        const response = await tagApi.create(newTag.label)
        if (response.data) {
          await tagApi.batchAdd([imageId], [response.data.id])
          const updatedTags = [...currentTags, response.data]
          onTagsChange(updatedTags)
          // Refresh tag store to include new tag
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
  )
}
