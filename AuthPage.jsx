import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Field } from '../components/ui'

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await (isLogin ? login({ email: form.email, password: form.password }) : register(form))
      navigate('/')
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-ink text-white p-8 md:p-14 flex flex-col justify-end">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-md">Know where your money went, and where it is going.</h1>
        <p className="text-white/70 mt-4 max-w-md">Log an expense in one line, get it categorised automatically, and see next month's spending before it happens.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold">{isLogin ? 'Log in' : 'Create your account'}</h2>
          {!isLogin && <Field label="Name"><input className="input" value={form.name} onChange={set('name')} required minLength={2} autoComplete="name" /></Field>}
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></Field>
          <Field label="Password" hint={isLogin ? undefined : 'At least 8 characters'}>
            <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} />
          </Field>
          {error && <p className="text-sm text-rose" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
          <p className="text-sm text-slate2">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <Link className="text-leaf font-semibold" to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
