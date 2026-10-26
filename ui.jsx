import { createContext, useCallback, useContext, useState } from 'react'
import { CATEGORY_COLORS, inr } from '../utils'

// ---- Toasts -------------------------------------------------------------------------------
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, kind = 'ok') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'warn' ? 7000 : 3500)
  }, [])
  const tone = { ok: 'bg-ink text-white', err: 'bg-rose text-white', warn: 'bg-saffron text-ink' }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm shadow-lg ${tone[t.kind]}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ---- Primitives ---------------------------------------------------------------------------
export const Spinner = () => (
  <div className="flex justify-center py-12" role="status" aria-label="Loading">
    <div className="h-7 w-7 rounded-full border-2 border-leaf border-t-transparent animate-spin" />
  </div>
)

export const Empty = ({ title, hint, children }) => (
  <div className="text-center py-10 px-4">
    <p className="font-semibold">{title}</p>
    {hint && <p className="text-sm text-slate2 mt-1 max-w-sm mx-auto">{hint}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
)

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate2 text-sm mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
)

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="text-xs text-slate2 mt-1 block">{hint}</span>}
  </label>
)

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-ink/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate2 hover:text-ink text-xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export const CategoryBadge = ({ name }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[name] || '#9AA5A0' }} />
    {name}
  </span>
)

export const Stat = ({ label, value, tone = 'ink', note }) => {
  const color = { ink: 'text-ink', good: 'text-leaf', bad: 'text-rose' }[tone]
  return (
    <div className="card">
      <p className="text-sm text-slate2">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{typeof value === 'number' ? inr(value) : value}</p>
      {note && <p className="text-xs text-slate2 mt-1">{note}</p>}
    </div>
  )
}

export const Pager = ({ page, pages, onChange }) =>
  pages > 1 && (
    <div className="flex items-center justify-between mt-4 text-sm">
      <button className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="text-slate2">Page {page} of {pages}</span>
      <button className="btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  )
