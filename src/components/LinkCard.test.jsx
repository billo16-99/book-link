import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LinkCard from './LinkCard'

const link = {
  id: 'l1',
  url: 'https://www.example.com/post',
  title: 'A Great Post',
  image: '',
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
})
