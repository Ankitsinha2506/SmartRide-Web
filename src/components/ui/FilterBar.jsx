export function FilterBar({ options, tabs, value, active, onChange }) {
  // Support both {options, value} and {tabs, active} prop shapes
  const items = options || tabs || []
  const current = value !== undefined ? value : active

  return (
    <div className="filter-bar">
      {items.map(opt => {
        const key = opt.value !== undefined ? opt.value : opt.key
        const label = opt.label
        const count = opt.count
        return (
          <button
            key={key}
            className={`filter-bar__btn${current === key ? ' filter-bar__btn--active' : ''}`}
            onClick={() => onChange(key)}
          >
            {label}
            {count !== undefined && <small className="filter-count">{count}</small>}
          </button>
        )
      })}
    </div>
  )
}
