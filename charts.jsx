import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { CATEGORY_COLORS, inr, monthLabel } from '../utils'

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)
ChartJS.defaults.font.family = '"Schibsted Grotesk", system-ui, sans-serif'
ChartJS.defaults.color = '#5B6B6F'

const money = { callbacks: { label: (c) => ` ${c.dataset.label ? c.dataset.label + ': ' : ''}${inr(c.parsed.y ?? c.parsed)}` } }
const axes = { x: { grid: { display: false } }, y: { ticks: { callback: (v) => inr(v) }, grid: { color: 'rgba(18,41,46,.07)' } } }

// Pie chart (rendered as a doughnut) of spending by category
export function CategoryPie({ data }) {
  const labels = Object.keys(data || {})
  return (
    <Doughnut
      data={{ labels, datasets: [{ data: labels.map((l) => data[l]), backgroundColor: labels.map((l) => CATEGORY_COLORS[l]), borderWidth: 2, borderColor: '#fff' }] }}
      options={{ cutout: '58%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${inr(c.parsed)}` } } } }}
    />
  )
}

// Line chart: monthly expenses (and income) over time
export function MonthlyLine({ rows }) {
  return (
    <Line
      data={{
        labels: rows.map((r) => monthLabel(r.month)),
        datasets: [
          { label: 'Expenses', data: rows.map((r) => r.expenses), borderColor: '#B8405E', backgroundColor: 'rgba(184,64,94,.08)', fill: true, tension: 0.3 },
          { label: 'Income', data: rows.map((r) => r.income), borderColor: '#1F7A6B', tension: 0.3, borderDash: [5, 4] },
        ],
      }}
      options={{ plugins: { tooltip: money, legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }, scales: axes }}
    />
  )
}

// Grouped bars: this month vs last month for each category
export function CompareBar({ data }) {
  return (
    <Bar
      data={{
        labels: data.categories,
        datasets: [
          { label: 'Last month', data: data.last_month, backgroundColor: '#C9D3CF', borderRadius: 4 },
          { label: 'This month', data: data.this_month, backgroundColor: '#1F7A6B', borderRadius: 4 },
        ],
      }}
      options={{ plugins: { tooltip: money, legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }, scales: axes }}
    />
  )
}

// Savings growth: monthly savings as bars, running balance as a line
export function SavingsGrowth({ rows }) {
  return (
    <Bar
      data={{
        labels: rows.map((r) => monthLabel(r.month)),
        datasets: [
          { type: 'line', label: 'Total saved', data: rows.map((r) => r.cumulative), borderColor: '#D99A12', backgroundColor: '#D99A12', tension: 0.3, yAxisID: 'y' },
          { type: 'bar', label: 'Saved that month', data: rows.map((r) => r.savings), backgroundColor: rows.map((r) => (r.savings >= 0 ? '#1F7A6B' : '#B8405E')), borderRadius: 4 },
        ],
      }}
      options={{ plugins: { tooltip: money, legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }, scales: axes }}
    />
  )
}

// Forecast: past months + the predicted next month with its uncertainty range
export function ForecastChart({ forecast }) {
  const hist = forecast.history
  const labels = [...hist.map((h) => monthLabel(h.month)), monthLabel(forecast.next_month)]
  const pad = Array(hist.length - 1).fill(null)
  const last = hist[hist.length - 1].amount
  return (
    <Line
      data={{
        labels,
        datasets: [
          { label: 'Actual', data: [...hist.map((h) => h.amount), null], borderColor: '#12292E', tension: 0.3 },
          { label: 'Forecast', data: [...pad, last, forecast.predicted_expense], borderColor: '#D99A12', borderDash: [6, 4], pointRadius: 4, tension: 0 },
          { label: 'Likely range (high)', data: [...pad, last, forecast.range_high], borderColor: 'transparent', backgroundColor: 'rgba(217,154,18,.15)', fill: '+1', pointRadius: 0 },
          { label: 'Likely range (low)', data: [...pad, last, forecast.range_low], borderColor: 'transparent', pointRadius: 0 },
        ],
      }}
      options={{ plugins: { tooltip: money, legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, filter: (i) => !i.text.includes('range (') } } }, scales: axes }}
    />
  )
}
