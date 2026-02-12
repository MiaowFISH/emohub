import { useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks'
import { useImageStore } from '@/stores/imageStore'

export const SearchBar = () => {
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebounce(inputValue, 400)
  const setSearchQuery = useImageStore(state => state.setSearchQuery)

  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  return (
    <input
      type="search"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Search by filename or tag..."
      aria-label="Search images"
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#d1d5db'
      }}
    />
  )
}
