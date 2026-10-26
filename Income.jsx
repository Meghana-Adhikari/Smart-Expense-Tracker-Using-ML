import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { Empty, Field, Modal, PageHeader, Pager, Spinner, Stat, useToast } from '../components/ui'
import { SavingsGrowth } from '../components/charts'
import { INCOME_SOURCES, inr, monthLabel, todayISO } from '../utils'

function IncomeModal({ item, onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ amount: '', date: todayISO(), source: 'Salary', description: '', ...(item || {}) })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const body = { amount: Number(f.amount), date: f.date, source: f.source, description: f.description || '' }
    try { item ? await api.put(`/income/${item.id}`, body) : await api.post('/income', body); toast('Income saved'); onSaved() } catch (err) { setError(errorMessage(err)) }
  }
  return (
    <Modal title={item ? 'Edit income' : 'Add income'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)"><input className="input" type="number" min="1" step="0.01" required value={f.amount} onChange={set('amount')} /></Field>
          <Field label="Date"><input className="input" type="date" required value={f.date?.slice(0, 10)} onChange={set('date')} /></Field>
        </div>
        <Field label="Source"><select className="input" value={f.source} onChange={set('source')}>{INCOME_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Description (optional)"><input className="input" value={f.description} onChange={set('description')} maxLength={200} /></Field>
        {error && <p className="text-sm text-rose" role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">Save income</button></div>
      </form>
    </Modal>
  )
}

export default function Income() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [list, setList] = useState(null)
  const [report, setReport] = useState(null)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    api.get('/income', { params: { page, per_page: 10 } }).then((r) => setList(r.data)).catch((e) => toast(errorMessage(e), 'err'))
    api.get('/income/report').then((r) => setReport(r.data)).catch(() => {})
  }, [page, toast])
  useEffect(load, [load])

  const remove = async (x) => {
    if (!confirm(`Delete ${inr(x.amount)} from ${x.source}?`)) return
    try { await api.delete(`/income/${x.id}`); toast('Income deleted'); load() } catch (e) { toast(errorMessage(e), 'err') }
  }
  const months = report?.months || []
  const last12 = months.slice(-12)

  return (
    <>
      <PageHeader title="Income & savings" subtitle="Track what comes in and how much you keep." action={<button className="btn-primary" onClick={() => setModal({})}>Add income</button>} />
      {report && <div className="grid sm:grid-cols-2 gap-4 mb-4"><Stat label="Total income recorded" value={report.total_income} /><Stat label="Total savings" value={report.total_savings} tone={report.total_savings >= 0 ? 'good' : 'bad'} /></div>}
      {last12.length > 0 && <div className="card mb-4"><h3 className="font-semibold mb-3">Savings growth</h3><div className="h-64"><SavingsGrowth rows={last12.map((m) => ({ month: m.month, savings: m.savings, cumulative: m.cumulative_savings }))} /></div></div>}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-2">Monthly income report</h3>
          {months.length === 0 ? <Empty title="No data yet" /> : (
            <table className="w-full"><thead><tr><th className="th">Month</th><th className="th text-right">Income</th><th className="th text-right">Spent</th><th className="th text-right">Saved</th><th className="th text-right">Rate</th></tr></thead>
              <tbody>{[...months].reverse().slice(0, 12).map((m) => (
                <tr key={m.month}><td className="td">{monthLabel(m.month)}</td><td className="td text-right">{inr(m.income)}</td><td className="td text-right">{inr(m.expenses)}</td>
                  <td className={`td text-right font-medium ${m.savings >= 0 ? 'text-leaf' : 'text-rose'}`}>{inr(m.savings)}</td><td className="td text-right">{m.savings_rate == null ? '–' : `${m.savings_rate}%`}</td></tr>))}</tbody></table>
          )}
        </div>
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-2">Income entries</h3>
          {!list ? <Spinner /> : list.items.length === 0 ? <Empty title="No income added" hint="Add your salary or allowance to start tracking savings." /> : (
            <table className="w-full"><tbody>{list.items.map((x) => (
              <tr key={x.id}><td className="td whitespace-nowrap">{x.date}</td><td className="td">{x.source}{x.description ? <span className="text-slate2"> · {x.description}</span> : null}</td><td className="td text-right font-medium text-leaf">{inr(x.amount)}</td>
                <td className="td text-right whitespace-nowrap"><button className="text-leaf font-medium mr-3" onClick={() => setModal(x)}>Edit</button><button className="text-rose font-medium" onClick={() => remove(x)}>Delete</button></td></tr>))}</tbody></table>
          )}
          {list && <Pager page={list.page} pages={list.pages} onChange={setPage} />}
        </div>
      </div>
      {modal && <IncomeModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </>
  )
}
