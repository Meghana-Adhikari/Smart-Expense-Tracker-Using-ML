import { useState } from 'react'
import api, { errorMessage } from '../api/client'
import { CATEGORIES, PAYMENT_METHODS, todayISO } from '../utils'
import { Field, Modal, useToast } from './ui'

/** Add / edit an expense. "Quick entry" lets users type "Dominos Pizza ₹450" and have the ML model fill the form. */
export default function ExpenseModal({ expense, initial, onClose, onSaved }) {
  const toast = useToast()
  const editing = !!expense
  const [f, setF] = useState({ description: '', amount: '', date: todayISO(), category: '', payment_method: '', notes: '', ...(initial || {}), ...(expense || {}) })
  const [quick, setQuick] = useState('')
  const [pred, setPred] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const runQuick = async () => {
    if (!quick.trim()) return
    try {
      const { data } = await api.post('/ml/categorize', { text: quick })
      setF((p) => ({ ...p, description: data.description || p.description, amount: data.amount ?? p.amount, category: data.category }))
      setPred(data)
    } catch (e) { setError(errorMessage(e)) }
  }

  const suggestCategory = async () => {           // when the user leaves the description field with no category chosen
    if (f.category || !f.description.trim()) return
    try { const { data } = await api.post('/ml/categorize', { text: f.description }); setPred(data); setF((p) => ({ ...p, category: data.category })) } catch { /* optional */ }
  }

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    const body = { description: f.description, amount: Number(f.amount), date: f.date, notes: f.notes, ...(f.category && { category: f.category }), ...(f.payment_method && { payment_method: f.payment_method }) }
    if (initial?.source) body.source = initial.source
    try {
      const { data } = editing ? await api.put(`/expenses/${expense.id}`, body) : await api.post('/expenses', body)
      if (data.alert) toast(data.alert.message, 'warn')
      else toast(editing ? 'Expense updated' : 'Expense added')
      onSaved()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!editing && (
          <div className="rounded-lg bg-leaf-tint p-3">
            <Field label="Quick entry" hint="Type it the way you'd say it, then press Fill form.">
              <div className="flex gap-2">
                <input className="input" placeholder="Dominos Pizza ₹450" value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runQuick())} />
                <button type="button" className="btn-primary shrink-0" onClick={runQuick}>Fill form</button>
              </div>
            </Field>
          </div>
        )}
        <Field label="Description"><input className="input" required value={f.description} onChange={set('description')} onBlur={suggestCategory} maxLength={200} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)"><input className="input" type="number" min="1" step="0.01" required value={f.amount} onChange={set('amount')} /></Field>
          <Field label="Date"><input className="input" type="date" required value={f.date?.slice(0, 10)} max={todayISO()} onChange={set('date')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" hint={pred && f.category === pred.category ? `Suggested by AI (${Math.round(pred.confidence * 100)}% sure)` : 'Leave blank to auto-detect'}>
            <select className="input" value={f.category} onChange={set('category')}><option value="">Auto-detect</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Paid with"><select className="input" value={f.payment_method} onChange={set('payment_method')}><option value="">Not set</option>{PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Notes (optional)"><input className="input" value={f.notes} onChange={set('notes')} maxLength={500} /></Field>
        {error && <p className="text-sm text-rose" role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button></div>
      </form>
    </Modal>
  )
}
