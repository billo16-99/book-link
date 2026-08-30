import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PillSelector from './PillSelector'
import StatusDot from './StatusDot'

describe('PillSelector', () => {
  const options = [
    { value: 'tools', label: 'Tools' },
    { value: 'later', label: 'Read Later' },
  ]

  it('renders label and current selection', () => {
    render(<PillSelector label="Category" value="tools" options={options} onChange={() => {}} />)
    expect(screen.getByLabelText(/category/i)).toHaveValue('tools')
  })

  it('emits selected value (null when cleared)', async () => {
    const onChange = vi.fn()
    render(<PillSelector label="Category" value="tools" options={options} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText(/category/i), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})

describe('StatusDot', () => {
  it('announces current status and toggles on click', async () => {
    const onToggle = vi.fn()
    render(<StatusDot status="draft" onToggle={onToggle} />)
    expect(screen.getByRole('button', { name: /status: draft/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
