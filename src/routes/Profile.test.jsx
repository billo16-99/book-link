import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from './Profile'
import { useStore } from '../hooks/useStore'

vi.mock('../hooks/useStore')
vi.mock('../components/QrCode', () => ({
  default: ({ value }) => <img data-testid="qr" src="data:image/png;base64,F" alt="QR code" />,
}))

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(async () => {}) },
    writable: true,
    configurable: true,
  })
  vi.mocked(useStore).mockReturnValue({
    links: [
      { id: '1', url: 'https://a.com/1', title: 'Link 1', categoryId: null, status: 'saved', createdAt: 1 },
      { id: '2', url: 'https://b.com/2', title: 'Link 2', categoryId: null, status: 'saved', createdAt: 2 },
    ],
  })
})

describe('Profile', () => {
  it('renders QR code', () => {
    render(<Profile />)
    expect(screen.getByTestId('qr')).toBeInTheDocument()
  })

  it('copies share URL to clipboard', async () => {
    render(<Profile />)
    await userEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('falls back to clipboard when navigator.share is absent', async () => {
    render(<Profile />)
    await userEvent.click(screen.getByRole('button', { name: /^share$/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('toggles dark mode via kebab menu', async () => {
    render(<Profile />)
    await userEvent.click(screen.getByRole('button', { name: /more options/i }))
    await userEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
