import { formatCR } from '../helpers';

function Row({ label, years, yearlyData, weekData, indent, bold, color, sym }) {
  const txtCls = bold ? 't-text font-semibold' : 't-text-secondary';
  const valColor = color || '';
  const fmt = (v) => formatCR(v, sym);

  return (
    <tr>
      <td className={`${txtCls} ${indent ? 'pl-6' : ''}`}>{label}</td>
      {years.map((y) => (
        <td key={y} className={`text-right font-mono ${valColor}`}>
          {fmt(yearlyData(y))}
        </td>
      ))}
      <td className={`text-right font-mono t-border border-l ${valColor}`}>
        {fmt(weekData)}
      </td>
    </tr>
  );
}

export default function BalanceSheet({ state }) {
  const sym = state.currency.symbol;
  const fmt = (v) => formatCR(v, sym);

  const years = [...new Set([
    ...Object.keys(state.yearlyExpenses).map(Number),
    ...Object.keys(state.yearlyRevenue).map(Number),
  ])].sort();

  // Collect all project/product IDs across all years + current week
  const devProjectIds = new Set();
  const productIds = new Set();
  for (const y of years) {
    const exp = state.yearlyExpenses[y] || {};
    for (const id of Object.keys(exp.devProjects || {})) devProjectIds.add(id);
    for (const id of Object.keys(exp.productInfra || {})) productIds.add(id);
    const rev = state.yearlyRevenue[y] || {};
    for (const id of Object.keys(rev.products || {})) productIds.add(id);
  }
  for (const id of Object.keys(state.currentMonthExpenses.devProjects || {})) devProjectIds.add(id);
  for (const id of Object.keys(state.currentMonthExpenses.productInfra || {})) productIds.add(id);
  for (const id of Object.keys(state.currentMonthRevenue.products || {})) productIds.add(id);

  // Name lookups
  const devProjectNames = {};
  for (const proj of state.devProjects) devProjectNames[proj.id] = proj.name;
  const productNames = {};
  for (const prod of state.products) productNames[prod.id] = prod.name;

  const getExp = (y) => state.yearlyExpenses[y] || { salaries: 0, devProjects: {}, productInfra: {} };
  const getRev = (y) => state.yearlyRevenue[y] || { products: {} };

  const totalExpForYear = (y) => {
    const exp = getExp(y);
    let total = exp.salaries || 0;
    for (const v of Object.values(exp.devProjects || {})) total += v;
    for (const v of Object.values(exp.productInfra || {})) total += v;
    return total;
  };
  const totalRevForYear = (y) => {
    const rev = getRev(y);
    let total = 0;
    for (const v of Object.values(rev.products || {})) total += v;
    return total;
  };

  const wkExp = state.currentMonthExpenses;
  const wkRev = state.currentMonthRevenue;
  const wkTotalExp = (wkExp.salaries || 0)
    + Object.values(wkExp.devProjects || {}).reduce((s, v) => s + v, 0)
    + Object.values(wkExp.productInfra || {}).reduce((s, v) => s + v, 0);
  const wkTotalRev = Object.values(wkRev.products || {}).reduce((s, v) => s + v, 0);

  return (
    <div className="p-3 overflow-hidden">
      <div className="t-bg-card t-border border overflow-x-auto">
        <div className="px-3 py-1.5 t-border border-b">
          <span className="text-xs t-text-secondary font-semibold">Balance Sheet</span>
        </div>
        <table className="sheet text-sm w-max sm:w-full" style={{ minWidth: '480px' }}>
          <thead>
            <tr>
              <th className="w-48 text-left"></th>
              {years.map((y) => (
                <th key={y} className="text-right w-36">
                  Year {y} {y === state.year ? '(to date)' : ''}
                </th>
              ))}
              <th className="text-right w-36 t-border border-l">Current Month</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <tr>
              <td className="font-bold t-text">Revenue</td>
              {years.map((y) => <td key={y}></td>)}
              <td className="t-border border-l"></td>
            </tr>
            {[...productIds].map((id) => (
              <Row
                key={`rev-${id}`}
                label={`${productNames[id] || id} Subscriptions`}
                years={years}
                yearlyData={(y) => (getRev(y).products || {})[id] || 0}
                weekData={(wkRev.products || {})[id] || 0}
                indent
                color="text-accent-green"
                sym={sym}
              />
            ))}
            <Row
              label="Total Revenue"
              years={years}
              yearlyData={totalRevForYear}
              weekData={wkTotalRev}
              bold
              color="text-accent-green"
              sym={sym}
            />

            {/* Expenses */}
            <tr>
              <td className="font-bold t-text">Expenses</td>
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
              sym={sym}
            />
            {[...devProjectIds].map((id) => (
              <Row
                key={`dev-${id}`}
                label={`Dev: ${devProjectNames[id] || id}`}
                years={years}
                yearlyData={(y) => (getExp(y).devProjects || {})[id] || 0}
                weekData={(wkExp.devProjects || {})[id] || 0}
                indent
                color="text-accent-red"
                sym={sym}
              />
            ))}
            {[...productIds].map((id) => (
              <Row
                key={`infra-${id}`}
                label={`Infra: ${productNames[id] || id}`}
                years={years}
                yearlyData={(y) => (getExp(y).productInfra || {})[id] || 0}
                weekData={(wkExp.productInfra || {})[id] || 0}
                indent
                color="text-accent-red"
                sym={sym}
              />
            ))}
            <Row
              label="Total Expenses"
              years={years}
              yearlyData={totalExpForYear}
              weekData={wkTotalExp}
              bold
              color="text-accent-red"
              sym={sym}
            />

            <tr className="h-1"><td colSpan={years.length + 2}></td></tr>

            {/* Net */}
            <tr style={{ borderTop: '2px solid var(--bg-border)' }}>
              <td className="font-bold t-text">Net</td>
              {years.map((y) => {
                const net = totalRevForYear(y) - totalExpForYear(y);
                return (
                  <td key={y} className={`text-right font-bold font-mono ${net < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                    {fmt(net)}
                  </td>
                );
              })}
              <td className={`text-right font-bold font-mono t-border border-l ${(wkTotalRev - wkTotalExp) < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                {fmt(wkTotalRev - wkTotalExp)}
              </td>
            </tr>

            <tr className="h-2"><td colSpan={years.length + 2}></td></tr>

            {/* Bank Balance */}
            <tr className="t-bg-cell">
              <td className="font-bold text-accent-cyan">Bank Balance</td>
              <td colSpan={years.length} className={`text-right font-bold font-mono ${state.bank < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                {fmt(state.bank)}
              </td>
              <td className="t-border border-l"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
