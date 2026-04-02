import { formatCR } from '../helpers';

export default function BalanceSheet({ state }) {
  const years = Object.keys(state.yearlyExpenses)
    .map(Number)
    .sort();

  return (
    <div className="p-4">
      <div className="bg-bg-card border border-bg-border rounded overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-bg-border">
              <th className="px-4 py-2 text-left text-xs text-txt-secondary uppercase tracking-wider w-48"></th>
              {years.map((y) => (
                <th
                  key={y}
                  className="px-4 py-2 text-right text-xs text-txt-secondary uppercase tracking-wider w-44"
                >
                  Year {y} {y === state.year ? '(to date)' : ''}
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs text-txt-secondary uppercase tracking-wider w-44 border-l border-bg-border">
                Current Week
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <tr className="border-b border-bg-border/50 bg-bg-cell">
              <td className="px-4 py-2 font-bold text-txt-primary">Revenue</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-2 text-right text-txt-muted">
                  {formatCR(state.yearlyRevenue[y] || 0)}
                </td>
              ))}
              <td className="px-4 py-2 text-right text-txt-muted border-l border-bg-border">
                {formatCR(state.currentWeekRevenue)}
              </td>
            </tr>

            {/* Expenses header */}
            <tr className="border-b border-bg-border/50">
              <td className="px-4 py-2 font-bold text-txt-primary">
                Expenses
              </td>
              {years.map((y) => (
                <td key={y}></td>
              ))}
              <td className="border-l border-bg-border"></td>
            </tr>

            {/* Salaries */}
            <tr className="border-b border-bg-border/50 bg-bg-cell">
              <td className="px-4 py-2 pl-8 text-txt-secondary">Salaries</td>
              {years.map((y) => {
                const val = state.yearlyExpenses[y]?.salaries || 0;
                return (
                  <td key={y} className="px-4 py-2 text-right text-accent-red">
                    {formatCR(val)}
                  </td>
                );
              })}
              <td className="px-4 py-2 text-right text-accent-red border-l border-bg-border">
                {formatCR(state.currentWeekExpenses.salaries)}
              </td>
            </tr>

            {/* Total Expenses */}
            <tr className="border-b border-bg-border/50">
              <td className="px-4 py-2 pl-8 font-semibold text-txt-primary">
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
              <td className="px-4 py-2 text-right text-accent-red font-semibold border-l border-bg-border">
                {formatCR(state.currentWeekExpenses.salaries)}
              </td>
            </tr>

            {/* Separator */}
            <tr className="h-2">
              <td colSpan={years.length + 2}></td>
            </tr>

            {/* Net */}
            <tr className="border-b border-bg-border/50 border-t-2 border-bg-border bg-bg-cell">
              <td className="px-4 py-2 font-bold text-txt-primary">Net</td>
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
                className={`px-4 py-2 text-right font-bold border-l border-bg-border ${
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
            <tr className="bg-bg-cell">
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
              <td className="border-l border-bg-border"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
