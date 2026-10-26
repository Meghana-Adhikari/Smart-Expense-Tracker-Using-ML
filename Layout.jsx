import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  ['/', 'Dashboard'], ['/expenses', 'Expenses'], ['/income', 'Income'], ['/insights', 'AI Insights'],
  ['/goals', 'Savings goals'], ['/budgets', 'Budgets'], ['/scan', 'Scan receipt'], ['/profile', 'Profile'],
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-leaf text-white' : 'text-white/75 hover:bg-ink-soft hover:text-white'}`

  return (
    <div className="min-h-screen md:flex">
      <header className="md:hidden flex items-center justify-between bg-ink text-white px-4 py-3">
        <span className="font-bold">Paisa AI</span>
        <button className="text-sm border border-white/30 rounded px-3 py-1" onClick={() => setOpen(!open)} aria-expanded={open}>Menu</button>
      </header>
      <aside className={`${open ? 'block' : 'hidden'} md:flex md:flex-col md:w-60 md:sticky md:top-0 md:h-screen bg-ink text-white p-4 shrink-0`}>
        <p className="hidden md:block text-xl font-bold px-3 py-2">Paisa AI</p>
        <p className="hidden md:block text-xs text-white/50 px-3 -mt-1 mb-4">Personal finance assistant</p>
        <nav className="space-y-1 flex-1" onClick={() => setOpen(false)}>
          {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>)}
        </nav>
        <div className="border-t border-ink-line pt-3 mt-3">
          <p className="text-sm px-3 truncate">{user?.name}</p>
          <p className="text-xs text-white/50 px-3 truncate mb-2">{user?.email}</p>
          <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-ink-soft" onClick={async () => { await logout(); navigate('/login') }}>Log out</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl"><Outlet /></main>
    </div>
  )
}
