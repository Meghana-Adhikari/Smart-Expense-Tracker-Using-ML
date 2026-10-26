import { useState } from 'react'
import api, { errorMessage } from '../api/client'
import ExpenseModal from '../components/ExpenseModal'
import { PageHeader, Spinner, useToast } from '../components/ui'
import { inr } from '../utils'

export default function Scanner() {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [saving, setSaving] = useState(false)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setRes(null); setPreview(URL.createObjectURL(f))
  }
  const scan = async () => {
    const body = new FormData(); body.append('file', file)
    setBusy(true)
    try { setRes((await api.post('/ocr/scan', body)).data) } catch (e) { toast(errorMessage(e), 'err') } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Scan a receipt" subtitle="Upload a photo. We read the merchant, total and date, then suggest a category." />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <label className="block border-2 border-dashed border-ink/20 rounded-xl p-6 text-center cursor-pointer hover:border-leaf">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="sr-only" onChange={pick} />
            {preview ? <img src={preview} alt="Receipt preview" className="max-h-80 mx-auto rounded" /> : <span className="text-slate2 text-sm">Choose a receipt image (JPG, PNG, up to 8 MB)</span>}
          </label>
          <button className="btn-primary w-full mt-3" disabled={!file || busy} onClick={scan}>{busy ? 'Reading receipt…' : 'Scan receipt'}</button>
          <p className="text-xs text-slate2 mt-2">Tip: flat, well-lit photos with the whole receipt in frame read best.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">Extracted details</h3>
          {busy ? <Spinner /> : !res ? <p className="text-sm text-slate2">Results will appear here.</p> : (
            <>
              {res.needs_review && <p className="text-sm bg-saffron-tint rounded-lg px-3 py-2 mb-3">Some fields could not be read. Please check them before saving.</p>}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate2">Merchant</dt><dd className="font-semibold">{res.merchant || 'Not found'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate2">Amount</dt><dd className="font-semibold">{res.amount ? inr(res.amount) : 'Not found'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate2">Date</dt><dd className="font-semibold">{res.date || 'Not found'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate2">Suggested category</dt><dd className="font-semibold">{res.suggested_category}</dd></div>
              </dl>
              <button className="btn-primary w-full mt-4" onClick={() => setSaving(true)}>Review and save as expense</button>
              <details className="mt-3"><summary className="text-sm text-slate2 cursor-pointer">Show raw text</summary><pre className="text-xs whitespace-pre-wrap bg-paper rounded p-2 mt-2 max-h-48 overflow-auto">{res.raw_text}</pre></details>
            </>
          )}
        </div>
      </div>
      {saving && res && (
        <ExpenseModal initial={{ description: res.merchant || '', amount: res.amount || '', ...(res.date && { date: res.date }), category: res.suggested_category, source: 'ocr' }}
          onClose={() => setSaving(false)} onSaved={() => { setSaving(false); setRes(null); setFile(null); setPreview('') }} />
      )}
    </>
  )
}
