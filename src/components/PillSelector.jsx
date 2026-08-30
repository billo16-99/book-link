export default function PillSelector({ label, value, options = [], onChange }) {
  return (
    <label className="pill pill-selector">
      <span>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={label}
      >
        <option value="">None</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}
