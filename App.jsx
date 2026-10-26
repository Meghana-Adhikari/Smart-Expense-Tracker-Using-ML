import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import Insights from './pages/Insights'
import Goals from './pages/Goals'
import Budgets from './pages/Budgets'
import Scanner from './pages/Scanner'
import Profile from './pages/Profile'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="income" element={<Income />} />
        <Route path="insights" element={<Insights />} />
        <Route path="goals" element={<Goals />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="scan" element={<Scanner />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
