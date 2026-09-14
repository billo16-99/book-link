import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from './Profile'
import { useStore } from '../hooks/useStore'

vi.mock('../hooks/useStore')

beforeEach(() => {
  vi.mocked(useStore).mockReturnValue({
    links: [
      { id: '1', url: 'https://a.com/1', title: 'Link 1', categoryId: null, status: 'saved', createdAt: 1 },
      { id: '2', url: 'https://b.com/2', title: 'Link 2', categoryId: null, status: 'saved', createdAt: 2 },
    ],
    categories: [
      { id: 'read-later', name: 'Read Later' },
    ],
  })
})

describe('Profile', () => {
  it('shows account and settings panels', () => {
    render(<Profile />)
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows account stats', () => {
    render(<Profile />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('switches the theme via the settings control', async () => {
    render(<Profile />)
    await userEvent.click(screen.getByRole('button', { name: /^dark$/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /^light$/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('saves the display name on blur', async () => {
    render(<Profile />)
    const name = screen.getByLabelText(/display name/i)
    await userEvent.clear(name)
    await userEvent.type(name, 'Ada')
    await userEvent.tab()
    expect(localStorage.getItem('booklink.profile.v1')).toContain('Ada')
  })
})