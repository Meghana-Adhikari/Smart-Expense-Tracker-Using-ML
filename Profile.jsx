import { useState } from 'react'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Field, PageHeader, useToast } from '../components/ui'

export default function Profile() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user.name)
  const [target, setTarget] = useState(user.monthly_income_target || '')
  const [pw, setPw] = useState({ current_password: '', new_password: '' })

  const saveProfile = async (e) => {
    e.preventDefault()
    try { const { data } = await api.put('/auth/profile', { name, monthly_income_target: target ? Number(target) : null }); setUser(data.user); toast('Profile updated') } catch (err) { toast(errorMessage(err), 'err') }
  }
  const changePw = async (e) => {
    e.preventDefault()
    try { await api.post('/auth/change-password', pw); setPw({ current_password: '', new_password: '' }); toast('Password changed') } catch (err) { toast(errorMessage(err), 'err') }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle={user.email} />
      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={saveProfile} className="card space-y-4">
          <h3 className="font-semibold">Your details</h3>
          <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></Field>
          <Field label="Expected monthly income (₹)" hint="Optional. Used as a reference for goals."><input className="input" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
          <button className="btn-primary">Save changes</button>
        </form>
        <form onSubmit={changePw} className="card space-y-4">
          <h3 className="font-semibold">Change password</h3>
          <Field label="Current password"><input className="input" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required autoComplete="current-password" /></Field>
          <Field label="New password" hint="At least 8 characters"><input className="input" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required minLength={8} autoComplete="new-password" /></Field>
          <button className="btn-primary">Update password</button>
        </form>
      </div>
    </>
  )
}
