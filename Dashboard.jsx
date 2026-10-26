import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { CategoryBadge, Empty, PageHeader, Spinner, Stat } from '../components/ui'
import { CategoryPie, CompareBar, MonthlyLine, SavingsGrowth } from '../components/charts'
import { inr, monthLabel } from '../utils'

const ChartCard = ({ title, children }) => (
  <div className="card"><h3 className="font-semibold mb-3">{title}</h3><div className="h-64">{children}</div></div>
)

export default function Dashboard() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api.get('/dashboard/summary').then((r) => setD(r.data)).catch((e) => setErr(errorMessage(e))) }, [])

  if (err) return <p className="text-rose">{err}</p>
  if (!d) return <Spinner />
  const empty = d.totals.income === 0 && d.totals.expenses === 0
  const { charts } = d

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`This month so far: ${monthLabel(d.this_month.month)}`} />
      {empty && (
        <div className="card mb-6"><Empty title="Nothing here yet" hint="Add your first income and expense to see charts, forecasts and insights.">
          <div className="flex gap-2 justify-center"><Link className="btn-primary" to="/income">Add income</Link><Link className="btn-ghost" to="/expenses">Add expense</Link></div>
        </Empty></div>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Total income" value={d.totals.income} />
        <Stat label="Total expenses" value={d.totals.expenses} />
        <Stat label="Total savings" value={d.totals.savings} tone={d.totals.savings >= 0 ? 'good' : 'bad'} />
      </div>
      <div className="card mt-4 flex flex-wrap gap-x-10 gap-y-2 items-center">
        <p className="font-semibold">This month</p>
        <p className="text-sm">Income <b>{inr(d.this_month.income)}</b></p>
        <p className="text-sm">Spent <b>{inr(d.this_month.expenses)}</b></p>
        <p className="text-sm">Saved <b className={d.this_month.savings >= 0 ? 'text-leaf' : 'text-rose'}>{inr(d.this_month.savings)}</b></p>
        <p className="text-sm text-slate2">Last month spent {inr(d.last_month.expenses)}</p>
      </div>

      {!empty && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <ChartCard title={`Spending by category (${monthLabel(charts.category_pie.month)})`}>
            {Object.keys(charts.category_pie.data).length ? <CategoryPie data={charts.category_pie.data} /> : <Empty title="No spending this month" />}
          </ChartCard>
          <ChartCard title="Monthly spending vs income"><MonthlyLine rows={charts.monthly_line} /></ChartCard>
          <ChartCard title="Category comparison: this month vs last"><CompareBar data={charts.category_compare} /></ChartCard>
          <ChartCard title="Savings growth"><SavingsGrowth rows={charts.savings_growth} /></ChartCard>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Recent transactions</h3>
          {d.recent_transactions.length === 0 ? <Empty title="No transactions yet" /> : (
            <ul>
              {d.recent_transactions.map((t, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{t.label}</p><p className="text-xs text-slate2">{t.date} · {t.category}</p></div>
                  <b className={`text-sm ${t.type === 'income' ? 'text-leaf' : ''}`}>{t.type === 'income' ? '+' : '-'}{inr(t.amount)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-2">Monthly summary</h3>
          <table className="w-full"><thead><tr><th className="th">Month</th><th className="th text-right">Income</th><th className="th text-right">Expenses</th><th className="th text-right">Savings</th></tr></thead>
            <tbody>{d.monthly_summary.map((m) => (
              <tr key={m.month}><td className="td">{monthLabel(m.month)}</td><td className="td text-right">{inr(m.income)}</td><td className="td text-right">{inr(m.expenses)}</td>
                <td className={`td text-right font-medium ${m.savings >= 0 ? 'text-leaf' : 'text-rose'}`}>{inr(m.savings)}</td></tr>))}</tbody></table>
        </div>
      </div>
    </>
  )
}
