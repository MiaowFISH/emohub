import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { registerServiceWorker } from './features/pwa/registerServiceWorker'
import './i18n/config'
import './styles/theme-variables.css'
import './styles/transitions.css'
import './styles/responsive.css'

const router = createRouter({ routeTree })

void registerServiceWorker()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
)
