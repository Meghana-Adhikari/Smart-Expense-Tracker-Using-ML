import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import ExpenseModal from '../components/ExpenseModal'
import { CategoryBadge, Empty, PageHeader, Pager, Spinner, useToast } from '../components/ui'
import { CATEGORIES, inr } from '../utils'

const blank = { q: '', category: '', start: '', end: '', min_amount: '', max_amount: '', sort: 'date', order: 'desc' }

export default function Expenses() {
  const toast = useToast()
  const [filters, setFilters] = useState(blank)
  const [applied, setApplied] = useState(blank)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)      // null | {} (new) | expense (edit)

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries({ ...applied, page, per_page: 15 }).filter(([, v]) => v !== ''))
    api.get('/expenses', { params }).then((r) => setData(r.data)).catch((e) => toast(errorMessage(e), 'err'))
  }, [applied, page, toast])
  useEffect(load, [load])

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })
  const apply = (e) => { e.preventDefault(); setPage(1); setApplied(filters) }
  const reset = () => { setFilters(blank); setApplied(blank); setPage(1) }
  const remove = async (x) => {
    if (!confirm(`Delete "${x.description}" (${inr(x.amount)})?`)) return
    try { await api.delete(`/expenses/${x.id}`); toast('Expense deleted'); load() } catch (e) { toast(errorMessage(e), 'err') }
  }

  return (
    <>
      <PageHeader title="Expenses" subtitle="Search, filter and manage your spending history." action={<button className="btn-primary" onClick={() => setModal({})}>Add expense</button>} />
      <form onSubmit={apply} className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <input className="input lg:col-span-2" placeholder="Search description (e.g. pizza)" value={filters.q} onChange={set('q')} aria-label="Search" />
        <select className="input" value={filters.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input" value={`${filters.sort}:${filters.order}`} onChange={(e) => { const [sort, order] = e.target.value.split(':'); setFilters({ ...filters, sort, order }) }} aria-label="Sort">
          <option value="date:desc">Newest first</option><option value="date:asc">Oldest first</option><option value="amount:desc">Highest amount</option><option value="amount:asc">Lowest amount</option>
        </select>
        <input className="input" type="date" value={filters.start} onChange={set('start')} aria-label="From date" />
        <input className="input" type="date" value={filters.end} onChange={set('end')} aria-label="To date" />
        <input className="input" type="number" placeholder="Min ₹" value={filters.min_amount} onChange={set('min_amount')} />
        <input className="input" type="number" placeholder="Max ₹" value={filters.max_amount} onChange={set('max_amount')} />
        <div className="flex gap-2 lg:col-span-4"><button className="btn-primary">Apply filters</button><button type="button" className="btn-ghost" onClick={reset}>Clear</button>
          {data && <p className="ml-auto self-center text-sm text-slate2">{data.total} results · <b className="text-ink">{inr(data.total_amount)}</b></p>}</div>
      </form>

      <div className="card overflow-x-auto">
        {!data ? <Spinner /> : data.items.length === 0 ? <Empty title="No expenses found" hint="Try clearing the filters or add a new expense." /> : (
          <table className="w-full min-w-[640px]">
            <thead><tr><th className="th">Date</th><th className="th">Description</th><th className="th">Category</th><th className="th text-right">Amount</th><th className="th" /></tr></thead>
            <tbody>{data.items.map((x) => (
              <tr key={x.id}>
                <td className="td whitespace-nowrap">{x.date}</td>
                <td className="td">{x.description}{x.auto_categorized && <span className="ml-2 text-[11px] text-leaf bg-leaf-tint rounded px-1.5 py-0.5">AI</span>}</td>
                <td className="td"><CategoryBadge name={x.category} /></td>
                <td className="td text-right font-medium">{inr(x.amount)}</td>
                <td className="td text-right whitespace-nowrap"><button className="text-leaf font-medium mr-3" onClick={() => setModal(x)}>Edit</button><button className="text-rose font-medium" onClick={() => remove(x)}>Delete</button></td>
              </tr>))}</tbody>
          </table>
        )}
        {data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}
      </div>
      {modal && <ExpenseModal expense={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </>
  )
}
