import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders a three-pane desktop layout', () => {
    render(
      <AppShell
        leftPane={<div data-testid="left-pane">Left Pane</div>}
        centerPane={<div data-testid="center-pane">Center Pane</div>}
        rightPane={<div data-testid="right-pane">Right Pane</div>}
      />
    )

    expect(screen.getByTestId('left-pane')).toBeInTheDocument()
    expect(screen.getByTestId('center-pane')).toBeInTheDocument()
    expect(screen.getByTestId('right-pane')).toBeInTheDocument()
  })
})