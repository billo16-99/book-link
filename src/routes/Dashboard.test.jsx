import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SearchProvider } from '../lib/search'
import Dashboard from './Dashboard'
import NavBar from '../components/NavBar'

const mkLink = (i, over = {}) => ({
  id: `l${i}`, url: `https://ex${i}.com/a`, title: `Title ${i}`,
  image: '', categoryId: null, status: 'saved', createdAt: i,
  favorite: false, notes: '', ...over,
})

const state = { links: [], loading: false }

vi.mock('../hooks/useStore', () => ({
  useStore: () => state,
}))

function setup(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchProvider>
        <Dashboard />
      </SearchProvider>
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  it('shows skeleton cards while loading', () => {
    state.loading = true
    setup()
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    state.loading = false
  })

  it('renders one card per link plus the add button', () => {
    state.links = [mkLink(1), mkLink(2)]
    setup()
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /add link/i })).toBeInTheDocument()
  })

  it('shows an empty state when nothing is saved', () => {
    state.links = []
    setup()
    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument()
  })

  it('filters cards by the search query', async () => {
    state.links = [mkLink(1), mkLink(2, { title: 'Zebra guide' })]
    render(
      <MemoryRouter initialEntries={['/']}>
        <SearchProvider>
          <NavBar />
          <Dashboard />
        </SearchProvider>
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'zebra')
    await waitFor(() => {
      expect(screen.queryByText('Title 1')).not.toBeInTheDocument()
      expect(screen.getByText('Zebra guide')).toBeInTheDocument()
    })
  })

  it('filters by ?cat= query param', () => {
    state.links = [mkLink(1), mkLink(2, { categoryId: 'tools' })]
    setup('/?cat=tools')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('filters to favorites via ?tab=stars', () => {
    state.links = [mkLink(1), mkLink(2, { favorite: true })]
    setup('/?tab=stars')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByText('Title 1')).not.toBeInTheDocument()
    expect(screen.getByText('Title 2')).toBeInTheDocument()
  })

  it('sorts newest first on ?tab=recent', () => {
    state.links = [mkLink(1), mkLink(2, { createdAt: 10 })]
    const { container } = setup('/?tab=recent')
    const titles = container.querySelectorAll('.pill-title')
    expect(titles[0].textContent).toBe('Title 2')
    expect(titles[1].textContent).toBe('Title 1')
  })

  it('shows a favorites empty state when no link is starred', () => {
    state.links = [mkLink(1)]
    setup('/?tab=stars')
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
  })
})