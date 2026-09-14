import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { repository } from '../storage/repository'
import { PROFILE_KEY } from '../storage/localStorage'
import { currentTheme, setTheme } from '../lib/theme'

function readProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : { name: '' }
  } catch {
    return { name: '' }
  }
}

function writeProfileCache(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) } catch { /* private mode */ }
}

export default function Profile() {
  const { links, categories = [] } = useStore()
  const [profile, setProfile] = useState(readProfileCache)
  const [theme, setThemeState] = useState(currentTheme)

  function applyTheme(next) {
    setTheme(next)
    setThemeState(next)
  }

  function saveName(value) {
    const name = value.trim()
    setProfile({ name })
    writeProfileCache({ name })
    repository.saveProfile({ name }).catch(() => {})
  }

  return (
    <section className="profile-page" aria-label="Profile">
      <div className="page-head">
        <div>
          <p className="mono eyebrow">Account & settings</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      <div className="profile-layout">
        <section className="panel">
          <h2 className="panel-title">Account</h2>
          <div className="account-row">
            <span className="avatar-tile" aria-hidden="true">{(profile.name.trim() || 'C').charAt(0).toUpperCase()}</span>
            <div className="account-fields">
              <label className="mono" htmlFor="profile-name">Display name</label>
              <input
                id="profile-name"
                defaultValue={profile.name}
                placeholder="Your name"
                aria-label="Display name"
                onBlur={(e) => saveName(e.target.value)}
              />
            </div>
          </div>
          <div className="account-stats">
            <div className="stat">
              <strong>{links.length}</strong>
              <span>links</span>
            </div>
            <div className="stat">
              <strong>{categories.length}</strong>
              <span>collections</span>
            </div>
          </div>
          <p className="sheet-note" style={{ marginTop: 16 }}>
            Local profile — stored only in this browser.
          </p>
        </section>

        <section className="panel">
          <h2 className="panel-title">Settings</h2>
          <div className="setting-row">
            <div>
              <p className="setting-label">Theme</p>
              <p className="sheet-note">Color scheme for this site</p>
            </div>
            <div className="seg" role="group" aria-label="Theme">
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => applyTheme('light')}
              >
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => applyTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}