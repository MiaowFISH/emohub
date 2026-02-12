import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/lib/hooks'
import { useImageStore } from '@/stores/imageStore'

export const SearchBar = () => {
  const { t } = useTranslation('images')
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
      placeholder={t('search.placeholder')}
      aria-label={t('search.aria_label')}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--color-border-light)',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-light)'
      }}
    />
  )
}
