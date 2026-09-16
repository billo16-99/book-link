import { describe, it, expect } from 'vitest'
import { favoriteOf, notesOf } from './linkDefaults'

describe('linkDefaults', () => {
  it('favoriteOf defaults to false', () => {
    expect(favoriteOf({})).toBe(false)
    expect(favoriteOf({ favorite: true })).toBe(true)
    expect(favoriteOf(null)).toBe(false)
  })

  it('notesOf defaults to empty string', () => {
    expect(notesOf({})).toBe('')
    expect(notesOf({ notes: 'hi' })).toBe('hi')
    expect(notesOf(null)).toBe('')
  })
})