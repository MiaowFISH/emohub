import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

const RootLayout = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--color-border, #e5e7eb)',
        backgroundColor: 'var(--color-bg-secondary, #f9fafb)'
      }}>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              EmoHub
            </Link>
          </h1>
          <Link
            to="/settings"
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              textDecoration: 'none'
            }}
            aria-label="Settings"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2-5.2l-4.2 4.2m0 6l4.2 4.2" />
            </svg>
            <span className="sr-only">Settings</span>
          </Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout
})
