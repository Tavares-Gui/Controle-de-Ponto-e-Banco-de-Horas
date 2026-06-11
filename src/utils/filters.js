export function filterRows(rows, { name = '', date = '' }, { getName, getDate }) {
  return rows.filter((row) => {
    const matchesName = !name || (getName?.(row) || '').toLowerCase().includes(name.toLowerCase())
    const matchesDate = !date || (getDate?.(row) || '') === date
    return matchesName && matchesDate
  })
}
