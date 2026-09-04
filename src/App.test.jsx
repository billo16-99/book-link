import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreProvider } from './hooks/useStore'
import App from './App'

afterEach(() => {
  window.location.hash = ''
})

describe('App shell', () => {
  it('renders nav bar and dashboard placeholder route', () => {
    window.location.hash = '#/'
    render(
      <StoreProvider>
        <App />
      </StoreProvider>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')
  })

  it('renders unknown hash routes as not-found placeholder', () => {
    window.location.hash = '#/nowhere'
    render(
      <StoreProvider>
        <App />
      </StoreProvider>,
    )
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })
})
