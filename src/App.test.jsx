import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('renders nav bar and dashboard placeholder route', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(window.location.hash === '#/' || window.location.hash === '').toBe(true)
  })

  it('renders unknown hash routes as not-found placeholder', () => {
    window.location.hash = '#/nowhere'
    render(<App />)
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
    window.location.hash = ''
  })
})
