import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LinkDetail from './LinkDetail'

const link = {
  id: 'l1', url: 'https://example.com/post', title: 'Cached Title',
  description: 'Some description.', image: 'https://img/x.png',
  categoryId: 'tools', status: 'saved', favorite: false, notes: '',
  createdAt: 1700000000000,
}

const state = {
  links: [link], loading: false, updateLink: vi.fn(), deleteLink: vi.fn(),
  retryMetadata: vi.fn(), addCategory: vi.fn(),
  categories: [
    { id: 'read-later', name: 'Read Later' },
    { id: 'tools', name: 'Tools' },
    { id: 'inspiration', name: 'Inspiration' },
    { id: 'shopping', name: 'Shopping' },
  ],
}

vi.mock('../hooks/useStore', () => ({ useStore: () => state }))

function setup() {
  return render(
    <MemoryRouter initialEntries={['/link/l1']}>
      <Routes>
        <Route path="/link/:id" element={<LinkDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  state.updateLink.mockReset().mockResolvedValue({ ...link })
  state.retryMetadata.mockReset().mockResolvedValue(null)
  state.deleteLink.mockReset()
})

describe('LinkDetail', () => {
  it('renders cached metadata without any network call', () => {
    setup()
    expect(screen.getByDisplayValue('Cached Title')).toBeInTheDocument()
    expect(screen.getByText('Some description.')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('toggles status via the dot control', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /status: saved/i }))
    expect(state.updateLink).toHaveBeenCalledWith('l1', { status: 'draft' })
  })

  it('edits the title for drafts and saves', async () => {
    state.links = [{ ...link, status: 'draft' }]
    setup()
    const input = screen.getByDisplayValue('Cached Title')
    await userEvent.clear(input)
    await userEvent.type(input, 'Fixed')
    await userEvent.tab()
    expect(state.updateLink).toHaveBeenCalledWith('l1', { title: 'Fixed' })
    state.links = [link]
  })

  it('offers retry preview only for drafts', async () => {
    state.links = [{ ...link, status: 'draft' }]
    setup()
    const btn = screen.getByRole('button', { name: /retry preview/i })
    await userEvent.click(btn)
    expect(state.retryMetadata).toHaveBeenCalledWith('l1')
    state.links = [link]
  })

  it('shows composed not-found state for bad ids', () => {
    render(
      <MemoryRouter initialEntries={['/link/nope']}>
        <Routes>
          <Route path="/link/:id" element={<LinkDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(/this link isn't here/i)).toBeInTheDocument()
  })

  it('marks a link as a favorite from the star toggle', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }))
    expect(state.updateLink).toHaveBeenCalledWith('l1', { favorite: true })
  })

  it('shows a filled star for an already-favorited link', () => {
    state.links = [{ ...link, favorite: true }]
    setup()
    expect(screen.getByRole('button', { name: /favorite/i })).toHaveAttribute('aria-pressed', 'true')
    state.links = [link]
  })

  it('edits the notes field and saves on blur', async () => {
    setup()
    const note = screen.getByRole('textbox', { name: /note/i })
    expect(note).toHaveValue('')
    await userEvent.type(note, 'Coming back to this')
    await userEvent.tab()
    expect(state.updateLink).toHaveBeenCalledWith('l1', { notes: 'Coming back to this' })
  })
})