import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionCircle from './ActionCircle'

describe('ActionCircle', () => {
  it('fires onPress with an accessible label', async () => {
    const onPress = vi.fn()
    render(<ActionCircle label="Copy link" onPress={onPress}><span>i</span></ActionCircle>)
    await userEvent.click(screen.getByRole('button', { name: /copy link/i }))
    expect(onPress).toHaveBeenCalledOnce()
  })
})