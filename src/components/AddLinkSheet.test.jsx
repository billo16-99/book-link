import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AddLinkSheet from './AddLinkSheet'

const { addLinkMock, addCategoryMock } = vi.hoisted(() => ({
  addLinkMock: vi.fn(),
  addCategoryMock: vi.fn(),
}))

vi.mock('../hooks/useStore', () => ({
  useStore: () => ({
    addLink: addLinkMock,
    addCategory: addCategoryMock,
    categories: [{ id: 'tools', name: 'Tools' }],
  }),
}))

function setup(open = true) {
  return render(
    <MemoryRouter>
      <AddLinkSheet open={open} onClose={() => {}} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  addLinkMock.mockReset().mockResolvedValue({ id: 'new' })
  addCategoryMock.mockReset().mockImplementation(async (name) => ({ id: 'c9', name }))
})

describe('AddLinkSheet', () => {
  it('does not render when closed', () => {
    setup(false)
    expect(screen.queryByLabelText(/destination url/i)).not.toBeInTheDocument()
  })

  it('shows an inline error for an invalid URL', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'not a url{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a valid url/i)
    expect(addLinkMock).not.toHaveBeenCalled()
  })

  it('normalizes scheme-less URLs and submits with existing category', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'example.com/article')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/article',
        categoryId: null,
      }),
    )
  })

  it('creates a free-text category before saving', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/destination url/i), 'https://example.com')
    await userEvent.selectOptions(screen.getByLabelText(/category/i), '__new__')
    await userEvent.type(screen.getByLabelText(/new category name/i), 'Recipes')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(addCategoryMock).toHaveBeenCalledWith('Recipes'))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/',
        categoryId: 'c9',
      }),
    )
  })
})
