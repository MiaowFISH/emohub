import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

const RootLayout = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      <Outlet />
      <Toaster position="bottom-center" richColors theme="system" />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout
})
