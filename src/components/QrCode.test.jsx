import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import QrCode from './QrCode'
import QRCode from 'qrcode'

beforeEach(() => {
  vi.spyOn(QRCode, 'toDataURL').mockResolvedValue('data:image/png;base64,FAKE')
})

describe('QrCode', () => {
  it('renders an img fed by qrcode.toDataURL with ink-on-paper colors', async () => {
    render(<QrCode value="https://a.com" />)
    await screen.findByRole('img', { name: /qr code/i })
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://a.com',
      expect.objectContaining({
        margin: 2,
        color: { dark: '#141414ff', light: '#ffffffff' },
      }),
    )
  })

  it('regenerates when the value changes', async () => {
    const { rerender } = render(<QrCode value="https://a.com" />)
    rerender(<QrCode value="https://b.com" />)
    await screen.findByAltText(/qr code/i)
    expect(QRCode.toDataURL).toHaveBeenCalledTimes(2)
  })
})