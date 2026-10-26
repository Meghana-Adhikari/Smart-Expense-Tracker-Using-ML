import { useEffect, useState } from 'react'
import api from '../api/client'
import { ForecastChart } from '../components/charts'
import { Empty, PageHeader, Spinner } from '../components/ui'
import { inr, monthLabel } from '../utils'

const tone = { warning: 'border-saffron bg-saffron-tint', positive: 'border-leaf bg-leaf-tint', info: 'border-ink/15 bg-white' }

function ScoreRing({ score }) {
  const r = 52, c = 2 * Math.PI * r
  const color = score >= 80 ? '#1F7A6B' : score >= 65 ? '#2E86AB' : score >= 50 ? '#D99A12' : '#B8405E'
  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40" role="img" aria-label={`Financial health score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E4EAE6" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="62" textAnchor="middle" fontSize="30" fontWeight="700" fill="#12292E">{Math.round(score)}</text>
      <text x="60" y="80" textAnchor="middle" fontSize="10" fill="#5B6B6F">out of 100</text>
    </svg>
  )
}

export default function Insights() {
  const [s, setS] = useState(null)
  useEffect(() => {
    const get = (p) => api.get(p).then((r) => r.data).catch(() => ({ available: false, message: 'Could not load this section.' }))
    Promise.all([get('/ml/forecast'), get('/ml/anomalies'), get('/ml/health-score'), get('/ml/insights')]).then(([forecast, anomalies, health, insights]) => setS({ forecast, anomalies, health, insights }))
  }, [])
  if (!s) return <Spinner />
  const { forecast: f, anomalies: a, health: h, insights: i } = s

  return (
    <>
      <PageHeader title="AI insights" subtitle="Forecasts, unusual spending and your financial health, computed from your own history." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold mb-3">Financial health score</h3>
          {!h.available ? <Empty title="Not enough data" hint={h.message} /> : (
            <>
              <div className="flex items-center gap-4"><ScoreRing score={h.score} /><div><p className="text-xl font-bold">{h.grade}</p><p className="text-xs text-slate2">Based on {h.based_on_months.map(monthLabel).join(', ')}</p></div></div>
              <ul className="mt-4 space-y-2">
                {Object.entries(h.components).map(([k, c]) => (
                  <li key={k}><div className="flex justify-between text-sm"><span className="capitalize">{k.replaceAll('_', ' ')}</span><b>{c.score}/{c.max}</b></div>
                    <div className="h-1.5 bg-ink/10 rounded mt-1"><div className="h-full bg-leaf rounded" style={{ width: `${(c.score / c.max) * 100}%` }} /></div>
                    <p className="text-xs text-slate2 mt-0.5">{c.label}</p></li>))}
              </ul>
            </>
          )}
        </div>
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-1">Next month's expense forecast</h3>
          {!f.available ? <Empty title="Forecast not available yet" hint={f.message} /> : (
            <>
              <div className="flex flex-wrap items-end gap-x-8 gap-y-1 mb-3">
                <div><p className="text-3xl font-bold">{inr(f.predicted_expense)}</p><p className="text-xs text-slate2">Expected in {monthLabel(f.next_month)} · likely {inr(f.range_low)} to {inr(f.range_high)}</p></div>
                <p className="text-sm">6-month trend: <b className={f.trend.direction === 'increasing' ? 'text-rose' : f.trend.direction === 'decreasing' ? 'text-leaf' : ''}>{f.trend.direction}</b></p>
                <p className="text-sm">vs last 3-month average: <b>{f.trend.change_vs_last_3_months_pct > 0 ? '+' : ''}{f.trend.change_vs_last_3_months_pct}%</b></p>
              </div>
              <div className="h-56"><ForecastChart forecast={f} /></div>
              <p className="text-xs text-slate2 mt-2">Model: {f.method.replaceAll('_', ' ')}{f.backtest_error_pct != null && ` · error when predicting the last known month: ${f.backtest_error_pct}%`}</p>
              {f.by_category && <div className="flex flex-wrap gap-2 mt-3">{f.by_category.slice(0, 5).map((c) => <span key={c.category} className="text-xs rounded-full bg-paper px-3 py-1">{c.category} {inr(c.amount)}</span>)}</div>}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card">
          <h3 className="font-semibold mb-1">What changed</h3>
          {i.available && i.potential_savings > 0 && <p className="text-sm mb-3">Potential savings this month: <b className="text-leaf">{inr(i.potential_savings)}</b></p>}
          {!i.available ? <Empty title="Insights unlock soon" hint={i.message} /> : (
            <ul className="space-y-2">{i.insights.map((x, n) => <li key={n} className={`border-l-4 rounded-r-lg px-3 py-2 text-sm ${tone[x.severity] || tone.info}`}>{x.message}</li>)}</ul>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">Unusual spending</h3>
          {!a.available ? <Empty title="Not enough history" hint={a.message} /> : a.anomalies.length === 0 ? <Empty title="Nothing unusual" hint="Your spending has followed a steady pattern." /> : (
            <>
              <p className="text-xs text-slate2 mb-2">Typical day: {inr(a.typical_daily_spend)} · {a.total_flagged} unusual days found</p>
              <ul className="space-y-2 max-h-96 overflow-auto">{a.anomalies.map((x) => (
                <li key={x.date} className="border rounded-lg px-3 py-2 border-ink/10">
                  <div className="flex justify-between text-sm"><b>{x.date}</b><b className="text-rose">{inr(x.total)} <span className="font-normal text-slate2">({x.times_normal}× normal)</span></b></div>
                  <p className="text-xs text-slate2 mt-0.5">Largest: {x.top_expense.description} · {inr(x.top_expense.amount)} ({x.top_expense.category})</p></li>))}</ul>
            </>
          )}
        </div>
      </div>

      {h.available && (
        <div className="card mt-4"><h3 className="font-semibold mb-2">How to improve your score</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">{h.suggestions.map((t, n) => <li key={n}>{t}</li>)}</ul></div>
      )}
    </>
  )
}
