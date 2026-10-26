export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Healthcare', 'Travel', 'Others']
export const BUDGET_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment']
export const INCOME_SOURCES = ['Salary', 'Freelance', 'Allowance', 'Investment', 'Gift', 'Other']
export const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'NetBanking', 'Other']

// Distinct hues for the nine categories (used in every chart and badge)
export const CATEGORY_COLORS = {
  Food: '#D99A12', Transport: '#2E86AB', Shopping: '#B8405E', Education: '#5B4B8A', Entertainment: '#E07A3F',
  Bills: '#5B6B6F', Healthcare: '#3BA17C', Travel: '#1F7A6B', Others: '#9AA5A0',
}

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const monthLabel = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}
