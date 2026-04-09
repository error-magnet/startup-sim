import { formatCR } from '../helpers';
import { weeksRemaining, getProductUserStats } from '../reducer';

function MetricCard({ label, value, sub, color = 'var(--txt-primary)' }) {
  return (
    <div className="t-bg-card t-border border p-3 flex flex-col gap-0.5 overflow-hidden">
      <span className="text-xs t-text-secondary">{label}</span>
      <span className="font-mono text-base sm:text-lg font-semibold truncate" style={{ color }}>{value}</span>
      {sub && <span className="text-xs t-text-muted font-mono break-words">{sub}</span>}
    </div>
  );
}

export default function Dashboard({ state }) {
  const fmt = (v) => formatCR(v, state.currency.symbol);
  const activeEmployees = state.employees.filter((e) => e.status !== 'Left');
  const monthlyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  let monthlyDevCost = 0;
  for (const proj of state.devProjects) {
    if (proj.status !== 'Active') continue;
    if (proj.epics.some((e) => e.status === 'In Progress')) {
      monthlyDevCost += proj.devCostPerMonth;
    }
  }

  let monthlyInfra = 0;
  let monthlyRevenue = 0;
  let totalPayingAll = 0;
  let totalActiveAll = 0;
  let mrr = 0;

  for (const p of state.products) {
    const stats = getProductUserStats(p);
    const cfg = p.config;
    monthlyInfra += cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
    monthlyRevenue += stats.payingUsers * p.monthlyPrice;
    totalPayingAll += stats.payingUsers;
    totalActiveAll += stats.totalActive;
    mrr += stats.payingUsers * p.monthlyPrice;
  }

  const monthlyLoanPayments = state.activeLoans.reduce((s, l) => s + l.monthlyPayment, 0);
  const monthlyBurn = monthlyPayroll + monthlyDevCost + monthlyInfra + monthlyLoanPayments;
  const netMonthly = monthlyRevenue - monthlyBurn;
  const effectiveBurn = Math.max(0, -netMonthly);

  const runwayMonths = effectiveBurn > 0 ? Math.floor(state.bank / effectiveBurn) : Infinity;
  const runwayStr = runwayMonths === Infinity ? '∞' : `${runwayMonths} months`;

  const green = '#00d26a', red = '#ff4757', yellow = '#ffc048', blue = '#3b82f6';

  // Appify status
  const appifyMvp = state.devProjects.find((p) => p.id === 'appify-mvp');
  const appifyLive = state.products.find((p) => p.id === 'appify');
  let appifyLabel, appifyPhase, appifyColor;

  if (appifyLive) {
    appifyLabel = 'Live';
    appifyPhase = 'Production';
    appifyColor = green;
  } else if (appifyMvp && appifyMvp.status === 'Active') {
    const maxWeeksLeft = Math.max(...appifyMvp.epics.map((e) => weeksRemaining(e)));
    appifyLabel = maxWeeksLeft === Infinity ? 'Not staffed' : `Est. ${maxWeeksLeft} wks`;
    appifyPhase = 'Development';
    appifyColor = maxWeeksLeft === Infinity ? yellow : blue;
  } else {
    appifyLabel = 'Complete';
    appifyPhase = 'Complete';
    appifyColor = green;
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {state.gameOver && (
        <div className="bg-accent-red/20 border border-accent-red p-3 text-center">
          <span className="text-accent-red font-bold font-mono">
            GAME OVER — Your startup ran out of money at Year {state.year}, Week {state.week}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: 'var(--bg-border)' }}>
        <MetricCard
          label="Bank Balance"
          value={fmt(state.bank)}
          color={state.bank < 100000 ? red : state.bank < 300000 ? yellow : green}
        />
        <MetricCard
          label="Runway"
          value={runwayStr}
          sub={netMonthly >= 0 ? 'Net positive' : `${fmt(effectiveBurn)}/mo net burn`}
          color={runwayMonths < 6 ? red : runwayMonths < 12 ? yellow : 'var(--txt-primary)'}
        />
        <MetricCard
          label="Monthly Burn"
          value={fmt(monthlyBurn)}
          sub={`Sal ${fmt(monthlyPayroll)}${monthlyDevCost ? ` + Proj ${fmt(monthlyDevCost)}` : ''}${monthlyInfra ? ` + Infra ${fmt(monthlyInfra)}` : ''}${monthlyLoanPayments ? ` + Loan ${fmt(monthlyLoanPayments)}` : ''}`}
          color={red}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: 'var(--bg-border)' }}>
        <MetricCard
          label="Headcount"
          value={activeEmployees.length}
          sub={`${fmt(activeEmployees.reduce((s, e) => s + e.salary, 0))}/mo total comp`}
        />
        <MetricCard
          label="MRR"
          value={fmt(mrr)}
          color={mrr > 0 ? green : 'var(--txt-muted)'}
        />
        <MetricCard
          label="Active Users"
          value={totalActiveAll}
          sub={totalPayingAll > 0 ? `${totalPayingAll} paying` : null}
          color={totalActiveAll > 0 ? blue : 'var(--txt-muted)'}
        />
      </div>
      <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--bg-border)' }}>
        <MetricCard
          label={`Appify: ${appifyPhase}`}
          value={appifyLabel}
          color={appifyColor}
        />
        <MetricCard
          label="Monthly Revenue"
          value={fmt(monthlyRevenue)}
          sub={monthlyRevenue > 0 ? `Net: ${fmt(netMonthly)}/mo` : null}
          color={monthlyRevenue > 0 ? green : 'var(--txt-muted)'}
        />
      </div>

      <div className="t-bg-card t-border border flex flex-col flex-1 min-h-0">
        <div className="px-3 py-1.5 t-border border-b">
          <span className="text-xs t-text-secondary">Activity Log</span>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[420px]">
          {state.log.map((entry, i) => (
            <div
              key={i}
              className={`px-3 py-1 text-sm flex gap-3 ${
                i % 2 === 0 ? 't-bg-cell' : ''
              } ${entry.message.includes('GAME OVER') ? 'text-accent-red font-bold' : ''}`}
            >
              <span className="t-text-muted w-16 shrink-0 font-mono text-xs">
                Y{entry.year} W{String(entry.week).padStart(2, '0')}
              </span>
              <span className="t-text-secondary">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
