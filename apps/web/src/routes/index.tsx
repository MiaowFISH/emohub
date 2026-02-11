import { createFileRoute } from '@tanstack/react-router'

const HomePage = () => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280'
    }}>
      <p>Images will appear here</p>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
