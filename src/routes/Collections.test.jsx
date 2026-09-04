import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import Collections from './Collections'

const state = {
  loading: false,
  categories: [
    { id: 'read-later', name: 'Read Later' },
    { id: 'tools', name: 'Tools' },
    { id: 'inspiration', name: 'Inspiration' },
    { id: 'shopping', name: 'Shopping' },
  ],
  links: [
    { id: '1', categoryId: 'tools', url: 'https://a.com', createdAt: 1 },
    { id: '2', categoryId: 'tools', url: 'https://b.com', createdAt: 2 },
    { id: '3', categoryId: null, url: 'https://c.com', createdAt: 3 },
    { id: '4', categoryId: 'inspiration', url: 'https://d.com', createdAt: 4 },
  ],
}

vi.mock('../hooks/useStore', () => ({ useStore: () => state }))

describe('Collections', () => {
  it('renders the massive uppercase header', () => {
    render(<MemoryRouter><Collections /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/collections/i)
  })

  it('renders one card per category with counts', () => {
    render(<MemoryRouter><Collections /></MemoryRouter>)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText(/2 links/i)).toBeInTheDocument()
    expect(screen.getByText(/1 link\b/i)).toBeInTheDocument()
  })

  it('navigates to filtered dashboard on click', async () => {
    render(
      <MemoryRouter initialEntries={['/collections']}>
        <Routes>
          <Route path="/collections" element={<Collections />} />
          <Route path="/" element={<div>dashboard-here</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /tools/i }))
    expect(await screen.findByText('dashboard-here')).toBeInTheDocument()
  })

  it('renders skeleton cards when loading', () => {
    state.loading = true
    const { container } = render(<MemoryRouter><Collections /></MemoryRouter>)
    expect(container.querySelectorAll('.card-preview')).toHaveLength(4)
    state.loading = false
  })
})