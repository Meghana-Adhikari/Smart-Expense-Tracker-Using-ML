import { useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { CategoryBadge, PageHeader, Spinner, useToast } from '../components/ui'
import { BUDGET_CATEGORIES, inr } from '../utils'

export default function Budgets() {
  const toast = useToast()
  const [rec, setRec] = useState(null)
  const [values, setValues] = useState({})
  useEffect(() => {
    api.get('/ml/budgets/recommend').then((r) => { setRec(r.data); setValues(r.data.current_budgets || {}) }).catch((e) => toast(errorMessage(e), 'err'))
  }, [toast])

  const save = async () => {
    try { await api.put('/auth/profile', { budgets: values }); toast('Budgets saved') } catch (e) { toast(errorMessage(e), 'err') }
  }
  const useRecommended = () => setValues(Object.fromEntries(Object.entries(rec.budgets).map(([c, r]) => [c, r.recommended])))
  if (!rec) return <Spinner />

  return (
    <>
      <PageHeader title="Smart budgets" subtitle={rec.available ? `Recommended from ${rec.basis}.` : rec.message}
        action={rec.available && <button className="btn-ghost" onClick={useRecommended}>Use recommended</button>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead><tr><th className="th">Category</th><th className="th text-right">Your monthly average</th><th className="th text-right">Recommended</th><th className="th">Your budget (₹)</th></tr></thead>
          <tbody>{BUDGET_CATEGORIES.map((c) => {
            const r = rec.budgets?.[c]
            return (
              <tr key={c}>
                <td className="td"><CategoryBadge name={c} /></td>
                <td className="td text-right">{r?.current_average != null ? inr(r.current_average) : '–'}</td>
                <td className="td text-right font-semibold">{r ? inr(r.recommended) : '–'}{r?.change_pct != null && <span className={`ml-1 text-xs ${r.change_pct < 0 ? 'text-leaf' : 'text-rose'}`}>({r.change_pct > 0 ? '+' : ''}{r.change_pct}%)</span>}</td>
                <td className="td"><input className="input max-w-[140px]" type="number" min="0" value={values[c] ?? ''} onChange={(e) => setValues({ ...values, [c]: e.target.value })} aria-label={`${c} budget`} /></td>
              </tr>)
          })}</tbody>
        </table>
        <div className="flex items-center justify-between mt-4">
          {rec.available && <p className="text-sm text-slate2">Total recommended: <b className="text-ink">{inr(rec.total_recommended)}</b> a month</p>}
          <button className="btn-primary ml-auto" onClick={save}>Save budgets</button>
        </div>
      </div>
      <p className="text-sm text-slate2 mt-3">Your saved budgets are used by the financial health score and the savings insights.</p>
    </>
  )
}
