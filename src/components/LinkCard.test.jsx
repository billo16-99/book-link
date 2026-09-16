import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LinkCard from './LinkCard'

const mocks = vi.hoisted(() => ({
  updateLink: vi.fn(),
}))

vi.mock('../hooks/useStore', () => ({
  useStore: () => ({ updateLink: mocks.updateLink }),
  toast: vi.fn(),
}))

beforeEach(() => {
  mocks.updateLink.mockReset()
})

const link = {
  id: 'l1',
  url: 'https://www.example.com/post',
  title: 'A Great Post',
  image: '',
  favorite: false,
  createdAt: 1,
}

function setup(over = {}) {
  return render(
    <MemoryRouter>
      <LinkCard link={{ ...link, ...over }} index={0} />
    </MemoryRouter>,
  )
}

describe('LinkCard', () => {
  it('shows title and bare domain pills', () => {
    setup()
    expect(screen.getByText('A Great Post')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('falls back to a letter tile when there is no image', () => {
    setup()
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('renders the preview image when present', () => {
    const { container } = setup({ image: 'https://img.example.com/x.png' })
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://img.example.com/x.png')
  })

  it('links to the detail route', () => {
    setup()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/link/l1')
  })

  it('opens a QR sheet from the card badge', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /qr code for/i }))
    expect(screen.getByRole('dialog', { name: /qr code/i })).toBeInTheDocument()
  })

  it('shows an unpressed star by default and toggles a favorite', async () => {
    setup()
    const star = screen.getByRole('button', { name: /favorite/i })
    expect(star).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(star)
    expect(mocks.updateLink).toHaveBeenCalledWith('l1', { favorite: true })
  })

  it('shows a pressed star when the link is already a favorite', () => {
    setup({ favorite: true })
    expect(screen.getByRole('button', { name: /favorite/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('unfavorites a starred link', async () => {
    setup({ favorite: true })
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }))
    expect(mocks.updateLink).toHaveBeenCalledWith('l1', { favorite: false })
  })
})
