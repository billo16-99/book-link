import { useState } from 'react'
import { useStore, toast } from '../hooks/useStore'
import { normalizeUrl, isValidUrl } from '../lib/validate'

export default function QuickSaveBar() {
  const { addLink } = useStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidUrl(value)) {
      setError('Enter a valid URL, e.g. example.com/article')
      return
    }
    setSaving(true)
    setError('')
    const created = await addLink({ url: normalizeUrl(value), categoryId: null })
    setSaving(false)
    if (created) {
      toast('Link saved')
      setValue('')
    } else {
      setError('Could not save — check your connection or storage.')
    }
  }

  return (
    <form className="qs-bar" onSubmit={handleSubmit} aria-label="Quick save">
      <div className="qs-row">
        <label className="sr-only" htmlFor="qs-url">Quick save URL</label>
        <input
          id="qs-url"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
          placeholder="Paste a link to save…"
          inputMode="url"
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}