import React from 'react'
import { AppShell } from '@/app/AppShell'
import { SearchRail } from '@/features/search/SearchRail'
import { GalleryGrid } from '@/features/gallery/GalleryGrid'
import { DetailRail } from '@/features/detail/DetailRail'
import '@/styles/buttons.css'

export const WorkspaceLayout: React.FC = () => {
  return (
    <AppShell
      leftPane={<SearchRail />}
      centerPane={<GalleryGrid />}
      rightPane={<DetailRail />}
    />
  )
}
