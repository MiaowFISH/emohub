import { useEffect } from 'react'
import { useTagStore } from '@/stores/tagStore'
import { useImageStore } from '@/stores/imageStore'

export const TagFilter = () => {
  const { tags, filterTagIds, toggleFilterTag, clearFilters, fetchTags } = useTagStore()
  const { fetchImages } = useImageStore()

  // Fetch tags on mount
  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Re-fetch images when filter changes
  useEffect(() => {
    if (filterTagIds.size > 0) {
      fetchImages(1, Array.from(filterTagIds))
    } else {
      fetchImages(1)
    }
  }, [filterTagIds, fetchImages])

  // Sort tags alphabetically
  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      borderRight: '1px solid #e5e7eb',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          margin: 0
        }}>
          Filter by Tags
        </h2>
        {filterTagIds.size > 0 && (
          <button
            onClick={clearFilters}
            style={{
              fontSize: '12px',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {filterTagIds.size > 0 && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          padding: '8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px'
        }}>
          Showing images with {filterTagIds.size} tag(s)
        </div>
      )}

      {/* Tag list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {sortedTags.length === 0 ? (
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            textAlign: 'center',
            padding: '16px'
          }}>
            No tags yet
          </div>
        ) : (
          sortedTags.map(tag => (
            <label
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                backgroundColor: filterTagIds.has(tag.id) ? '#eff6ff' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!filterTagIds.has(tag.id)) {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }
              }}
              onMouseLeave={(e) => {
                if (!filterTagIds.has(tag.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <input
                type="checkbox"
                checked={filterTagIds.has(tag.id)}
                onChange={() => toggleFilterTag(tag.id)}
                style={{
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px'
                }}
              />
              <span style={{
                fontSize: '14px',
                flex: 1
              }}>
                {tag.name}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginLeft: 'auto'
              }}>
                {tag.imageCount}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
