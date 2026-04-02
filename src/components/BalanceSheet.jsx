import { formatCR } from '../helpers';

export default function BalanceSheet({ state }) {
  const years = Object.keys(state.yearlyExpenses)
    .map(Number)
    .sort();

  return (
    <div className="p-4">
      <div className="t-bg-card t-border border rounded overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="t-border border-b">
              <th className="px-4 py-2 text-left text-xs t-text-secondary uppercase tracking-wider w-48"></th>
              {years.map((y) => (
                <th
                  key={y}
                  className="px-4 py-2 text-right text-xs t-text-secondary uppercase tracking-wider w-44"
                >
                  Year {y} {y === state.year ? '(to date)' : ''}
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs t-text-secondary uppercase tracking-wider w-44 t-border border-l">
                Current Week
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <tr className="t-border border-b t-bg-cell">
              <td className="px-4 py-2 font-bold t-text">Revenue</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-2 text-right t-text-muted">
                  {formatCR(state.yearlyRevenue[y] || 0)}
                </td>
              ))}
              <td className="px-4 py-2 text-right t-text-muted t-border border-l">
                {formatCR(state.currentWeekRevenue)}
              </td>
            </tr>

            {/* Expenses header */}
            <tr className="t-border border-b">
              <td className="px-4 py-2 font-bold t-text">Expenses</td>
              {years.map((y) => (
                <td key={y}></td>
              ))}
              <td className="t-border border-l"></td>
            </tr>

            {/* Salaries */}
            <tr className="t-border border-b t-bg-cell">
              <td className="px-4 py-2 pl-8 t-text-secondary">Salaries</td>
              {years.map((y) => {
                const val = state.yearlyExpenses[y]?.salaries || 0;
                return (
                  <td key={y} className="px-4 py-2 text-right text-accent-red">
                    {formatCR(val)}
                  </td>
                );
              })}
              <td className="px-4 py-2 text-right text-accent-red t-border border-l">
                {formatCR(state.currentWeekExpenses.salaries)}
              </td>
            </tr>

            {/* Total Expenses */}
            <tr className="t-border border-b">
              <td className="px-4 py-2 pl-8 font-semibold t-text">
                Total Expenses
              </td>
              {years.map((y) => {
                const total = state.yearlyExpenses[y]?.salaries || 0;
                return (
                  <td
                    key={y}
                    className="px-4 py-2 text-right text-accent-red font-semibold"
                  >
                    {formatCR(total)}
                  </td>
                );
              })}
              <td className="px-4 py-2 text-right text-accent-red font-semibold t-border border-l">
                {formatCR(state.currentWeekExpenses.salaries)}
              </td>
            </tr>

            {/* Separator */}
            <tr className="h-2">
              <td colSpan={years.length + 2}></td>
            </tr>

            {/* Net */}
            <tr className="t-border border-b border-t-2 t-bg-cell">
              <td className="px-4 py-2 font-bold t-text">Net</td>
              {years.map((y) => {
                const rev = state.yearlyRevenue[y] || 0;
                const exp = state.yearlyExpenses[y]?.salaries || 0;
                const net = rev - exp;
                return (
                  <td
                    key={y}
                    className={`px-4 py-2 text-right font-bold ${
                      net < 0 ? 'text-accent-red' : 'text-accent-green'
                    }`}
                  >
                    {formatCR(net)}
                  </td>
                );
              })}
              <td
                className={`px-4 py-2 text-right font-bold t-border border-l ${
                  state.currentWeekRevenue - state.currentWeekExpenses.salaries <
                  0
                    ? 'text-accent-red'
                    : 'text-accent-green'
                }`}
              >
                {formatCR(
                  state.currentWeekRevenue - state.currentWeekExpenses.salaries
                )}
              </td>
            </tr>

            {/* Separator */}
            <tr className="h-4">
              <td colSpan={years.length + 2}></td>
            </tr>

            {/* Bank Balance */}
            <tr className="t-bg-cell">
              <td className="px-4 py-3 font-bold text-accent-cyan text-base">
                Bank Balance
              </td>
              <td
                colSpan={years.length}
                className={`px-4 py-3 text-right font-bold text-base ${
                  state.bank < 0 ? 'text-accent-red' : 'text-accent-green'
                }`}
              >
                {formatCR(state.bank)}
              </td>
              <td className="t-border border-l"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
