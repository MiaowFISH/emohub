import React from 'react'
import './AppShell.css'

export interface AppShellProps {
  leftPane: React.ReactNode
  centerPane: React.ReactNode
  rightPane: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ leftPane, centerPane, rightPane }) => {
  return (
    <div
      className="app-shell"
      data-testid="app-shell"
    >
      <aside className="app-shell-left">
        {leftPane}
      </aside>
      
      <main className="app-shell-center">
        {centerPane}
      </main>

      <aside className="app-shell-right">
        {rightPane}
      </aside>
    </div>
  )
}

