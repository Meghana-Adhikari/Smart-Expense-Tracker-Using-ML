import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { Empty, Field, Modal, PageHeader, Spinner, useToast } from '../components/ui'
import { inr } from '../utils'

const statusTone = { on_track: 'text-leaf', achieved: 'text-leaf', behind: 'text-rose', no_savings: 'text-rose', estimated: 'text-ink' }

function GoalModal({ goal, onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', target_amount: '', saved_amount: '', deadline: '', ...(goal || {}) })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const body = { name: f.name, target_amount: Number(f.target_amount), saved_amount: Number(f.saved_amount || 0), deadline: f.deadline || null }
    try { goal ? await api.put(`/goals/${goal.id}`, body) : await api.post('/goals', body); toast('Goal saved'); onSaved() } catch (err) { setError(errorMessage(err)) }
  }
  return (
    <Modal title={goal ? 'Edit goal' : 'New savings goal'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Goal name"><input className="input" required value={f.name} onChange={set('name')} placeholder="Laptop, Goa trip, emergency fund…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target amount (₹)"><input className="input" type="number" min="1" required value={f.target_amount} onChange={set('target_amount')} /></Field>
          <Field label="Already saved (₹)"><input className="input" type="number" min="0" value={f.saved_amount} onChange={set('saved_amount')} /></Field>
        </div>
        <Field label="Target date (optional)" hint="Add a date to see the monthly amount you need."><input className="input" type="date" value={f.deadline?.slice(0, 10) || ''} onChange={set('deadline')} /></Field>
        {error && <p className="text-sm text-rose" role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">Save goal</button></div>
      </form>
    </Modal>
  )
}

export default function Goals() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)
  const load = useCallback(() => { api.get('/goals').then((r) => setData(r.data)).catch((e) => toast(errorMessage(e), 'err')) }, [toast])
  useEffect(load, [load])
  const remove = async (g) => { if (confirm(`Delete goal "${g.name}"?`)) { await api.delete(`/goals/${g.id}`); load() } }

  return (
    <>
      <PageHeader title="Savings goals" subtitle={data ? `At your current pace you save about ${inr(data.estimated_monthly_savings)} a month.` : ''} action={<button className="btn-primary" onClick={() => setModal({})}>New goal</button>} />
      {!data ? <Spinner /> : data.goals.length === 0 ? <div className="card"><Empty title="No goals yet" hint="Set a target and see how long it will take and how much to save each month." /></div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.goals.map((g) => (
            <div key={g.id} className="card">
              <div className="flex justify-between items-start"><h3 className="font-bold text-lg">{g.name}</h3>
                <div className="text-sm whitespace-nowrap"><button className="text-leaf font-medium mr-3" onClick={() => setModal(g)}>Edit</button><button className="text-rose font-medium" onClick={() => remove(g)}>Delete</button></div></div>
              <p className="text-sm text-slate2 mt-1">{inr(g.saved_amount)} of {inr(g.target_amount)}{g.deadline ? ` · by ${g.deadline}` : ''}</p>
              <div className="h-2 bg-ink/10 rounded mt-3"><div className="h-full bg-leaf rounded" style={{ width: `${g.plan.progress_pct}%` }} /></div>
              <p className="text-xs text-slate2 mt-1">{g.plan.progress_pct}% complete</p>
              <p className={`text-sm mt-3 font-medium ${statusTone[g.plan.status] || ''}`}>{g.plan.message}</p>
              {g.plan.required_monthly_savings != null && g.plan.status !== 'achieved' && <p className="text-xs text-slate2 mt-1">Needed per month: {inr(g.plan.required_monthly_savings)}</p>}
            </div>
          ))}
        </div>
      )}
      {modal && <GoalModal goal={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </>
  )
}
