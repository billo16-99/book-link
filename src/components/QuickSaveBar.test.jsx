import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickSaveBar from './QuickSaveBar'

const { addLinkMock } = vi.hoisted(() => ({ addLinkMock: vi.fn() }))

vi.mock('../hooks/useStore', () => ({
  useStore: () => ({ addLink: addLinkMock }),
  toast: vi.fn(),
}))

beforeEach(() => {
  addLinkMock.mockReset().mockResolvedValue({ id: 'new' })
})

describe('QuickSaveBar', () => {
  it('shows an inline error for an invalid URL and does not save', async () => {
    render(<QuickSaveBar />)
    await userEvent.type(screen.getByRole('textbox'), 'not a url{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a valid url/i)
    expect(addLinkMock).not.toHaveBeenCalled()
  })

  it('normalizes a scheme-less URL and saves', async () => {
    render(<QuickSaveBar />)
    await userEvent.type(screen.getByRole('textbox'), 'example.com/article')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(addLinkMock).toHaveBeenCalledWith({
        url: 'https://example.com/article',
        categoryId: null,
      }),
    )
  })

  it('clears the field after a successful save', async () => {
    render(<QuickSaveBar />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''))
  })
})