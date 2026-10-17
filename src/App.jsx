import { useEffect, useState } from 'react'
import RulerPicker from './components/RulerPicker'

const VARIANTS = [
  { id: 'classic', label: 'Classic' },
  { id: 'glass', label: 'Liquid Glass' },
]

function readVariant() {
  try {
    return localStorage.getItem('ruler-picker:variant') || 'classic'
  } catch {
    return 'classic'
  }
}

export default function App() {
  const [variant, setVariant] = useState(readVariant)

  useEffect(() => {
    try {
      localStorage.setItem('ruler-picker:variant', variant)
    } catch {
      /* storage unavailable — fine */
    }
  }, [variant])

  return (
    <main
      data-variant={variant}
      className="stage relative grid min-h-full grid-cols-[100%] place-items-center overflow-hidden px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] font-sans"
    >
      <div className="picker-scale">
        <RulerPicker key={variant} variant={variant} initialFuzzy={variant === 'glass' ? 1 : 0} />
      </div>

      <nav
        aria-label="Style"
        className="surface fixed bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 gap-1 rounded-full p-1"
      >
        <span className="spec" />
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={variant === v.id}
            onClick={() => setVariant(v.id)}
            className={`relative rounded-full px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--ink)] ${
              variant === v.id ? 'primary' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </main>
  )
}
