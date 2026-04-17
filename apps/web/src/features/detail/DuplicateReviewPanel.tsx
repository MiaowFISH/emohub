import React, { useEffect, useState } from 'react'
import type { Image } from '@emohub/shared'
import { duplicatesApi } from '@/lib/api'

interface DuplicateReviewPanelProps {
  image: Image
}

interface DuplicateCandidate {
  id: string
  image_a_id: string
  image_b_id: string
  score: number
  status: string
}

export const DuplicateReviewPanel: React.FC<DuplicateReviewPanelProps> = ({ image }) => {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchDuplicates = async () => {
      setIsLoading(true)
      try {
        const { items } = await duplicatesApi.list()
        if (mounted) {
          const filtered = items.filter(
            item => item.image_a_id === image.id || item.image_b_id === image.id
          )
          setCandidates(filtered)
        }
      } catch (err) {
        console.error('Failed to load duplicates', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    
    fetchDuplicates()
    return () => {
      mounted = false
    }
  }, [image.id])

  if (isLoading) {
    return <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '8px' }}>Loading...</div>
  }

  if (candidates.length === 0) {
    return (
      <div style={{ 
        fontSize: '0.85rem', 
        color: 'var(--color-text-muted)', 
        padding: '12px', 
        backgroundColor: 'var(--color-bg-tertiary)', 
        borderRadius: '4px',
        textAlign: 'center',
        border: '1px dashed var(--color-border)'
      }}>
        No pending duplicates
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {candidates.map(candidate => {
        const otherId = candidate.image_a_id === image.id ? candidate.image_b_id : candidate.image_a_id
        return (
          <div key={candidate.id} style={{
            fontSize: '0.85rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '8px'
          }}>
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Potential Duplicate
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-text)' }}>
                {otherId.substring(0, 8)}...
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                backgroundColor: 'var(--color-bg-primary)', 
                padding: '2px 6px', 
                borderRadius: '10px',
                color: 'var(--color-text-secondary)'
              }}>
                {(candidate.score * 100).toFixed(1)}% match
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
