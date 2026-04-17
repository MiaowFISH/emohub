import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceLayout } from '@/features/layout/WorkspaceLayout'

export const Route = createFileRoute('/')({
  component: WorkspaceLayout
})