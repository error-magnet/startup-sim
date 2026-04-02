import { formatCR } from '../helpers';

function Row({ label, years, yearlyData, weekData, indent, bold, color }) {
  const cls = [
    'px-4 py-2',
    indent ? 'pl-8' : '',
    bold ? 'font-semibold' : '',
  ].join(' ');
  const txtCls = bold ? 't-text' : 't-text-secondary';
  const valColor = color || '';

  return (
    <tr className="t-border border-b t-bg-cell">
      <td className={`${cls} ${txtCls}`}>{label}</td>
      {years.map((y) => (
        <td key={y} className={`px-4 py-2 text-right ${valColor}`}>
          {formatCR(yearlyData(y))}
        </td>
      ))}
      <td className={`px-4 py-2 text-right t-border border-l ${valColor}`}>
        {formatCR(weekData)}
      </td>
    </tr>
  );
}

export default function BalanceSheet({ state }) {
  const years = [
    ...new Set([
      ...Object.keys(state.yearlyExpenses).map(Number),
      ...Object.keys(state.yearlyRevenue).map(Number),
    ]),
  ].sort();

  const getExp = (y) => state.yearlyExpenses[y] || { salaries: 0, devCosts: 0, infraCosts: 0 };
  const getRev = (y) => state.yearlyRevenue[y] || { subscriptions: 0 };
  const totalExp = (y) => {
    const e = getExp(y);
    return (e.salaries || 0) + (e.devCosts || 0) + (e.infraCosts || 0);
  };
  const totalRev = (y) => {
    const r = getRev(y);
    return r.subscriptions || 0;
  };
  const wkExp = state.currentWeekExpenses;
  const wkRev = state.currentWeekRevenue;
  const wkTotalExp = (wkExp.salaries || 0) + (wkExp.devCosts || 0) + (wkExp.infraCosts || 0);
  const wkTotalRev = wkRev.subscriptions || 0;

  return (
    <div className="p-4">
      <div className="t-bg-card t-border border rounded overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="t-border border-b">
              <th className="px-4 py-2 text-left text-xs t-text-secondary uppercase tracking-wider w-48"></th>
              {years.map((y) => (
                <th key={y} className="px-4 py-2 text-right text-xs t-text-secondary uppercase tracking-wider w-44">
                  Year {y} {y === state.year ? '(to date)' : ''}
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs t-text-secondary uppercase tracking-wider w-44 t-border border-l">
                Current Week
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue section */}
            <tr className="t-border border-b">
              <td className="px-4 py-2 font-bold t-text">Revenue</td>
              {years.map((y) => <td key={y}></td>)}
              <td className="t-border border-l"></td>
            </tr>
            <Row
              label="Appify Subscriptions"
              years={years}
              yearlyData={(y) => getRev(y).subscriptions || 0}
              weekData={wkRev.subscriptions || 0}
              indent
              color="text-accent-green"
            />
            <Row
              label="Total Revenue"
              years={years}
              yearlyData={totalRev}
              weekData={wkTotalRev}
              bold
              color="text-accent-green"
            />

            {/* Expenses section */}
            <tr className="t-border border-b">
              <td className="px-4 py-2 font-bold t-text">Expenses</td>
              {years.map((y) => <td key={y}></td>)}
              <td className="t-border border-l"></td>
            </tr>
            <Row
              label="Salaries"
              years={years}
              yearlyData={(y) => getExp(y).salaries || 0}
              weekData={wkExp.salaries || 0}
              indent
              color="text-accent-red"
            />
            <Row
              label="Development Costs"
              years={years}
              yearlyData={(y) => getExp(y).devCosts || 0}
              weekData={wkExp.devCosts || 0}
              indent
              color="text-accent-red"
            />
            <Row
              label="Infrastructure (Appify)"
              years={years}
              yearlyData={(y) => getExp(y).infraCosts || 0}
              weekData={wkExp.infraCosts || 0}
              indent
              color="text-accent-red"
            />
            <Row
              label="Total Expenses"
              years={years}
              yearlyData={totalExp}
              weekData={wkTotalExp}
              bold
              color="text-accent-red"
            />

            <tr className="h-2"><td colSpan={years.length + 2}></td></tr>

            {/* Net */}
            <tr className="t-border border-b border-t-2 t-bg-cell">
              <td className="px-4 py-2 font-bold t-text">Net</td>
              {years.map((y) => {
                const net = totalRev(y) - totalExp(y);
                return (
                  <td key={y} className={`px-4 py-2 text-right font-bold ${net < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                    {formatCR(net)}
                  </td>
                );
              })}
              <td className={`px-4 py-2 text-right font-bold t-border border-l ${(wkTotalRev - wkTotalExp) < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                {formatCR(wkTotalRev - wkTotalExp)}
              </td>
            </tr>

            <tr className="h-4"><td colSpan={years.length + 2}></td></tr>

            {/* Bank Balance */}
            <tr className="t-bg-cell">
              <td className="px-4 py-3 font-bold text-accent-cyan text-base">Bank Balance</td>
              <td colSpan={years.length} className={`px-4 py-3 text-right font-bold text-base ${state.bank < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
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
