export default function Table({ rows, cols, emptyMessage = 'Nenhum registro encontrado.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{cols.map((col) => <th key={col[0]}>{col[0]}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {cols.map((col) => (
                <td key={col[0]}>{typeof col[1] === 'function' ? col[1](row) : row[col[1]]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">{emptyMessage}</p>}
    </div>
  )
}
