import { formatCR } from '../helpers';
import { weeksRemaining, getProductUserStats } from '../reducer';

function MetricCard({ label, value, sub, color = 'var(--txt-primary)' }) {
  return (
    <div className="t-bg-card t-border border rounded p-4 flex flex-col gap-1">
      <span className="text-xs t-text-secondary uppercase tracking-wider">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold" style={{ color }}>
        {value}
      </span>
      {sub && <span className="text-xs t-text-muted font-mono">{sub}</span>}
    </div>
  );
}

export default function Dashboard({ state }) {
  const activeEmployees = state.employees.filter((e) => e.status === 'Active');
  const weeklyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary / 52, 0);

  // Total weekly burn including dev + infra
  let weeklyDevCost = 0;
  let weeklyInfra = 0;
  let totalPayingAll = 0;
  let totalActiveAll = 0;

  for (const p of state.products) {
    if (p.status === 'In Development') {
      const anyInProgress = state.epics
        .filter((e) => e.productId === p.id)
        .some((e) => e.status === 'In Progress');
      if (anyInProgress) weeklyDevCost += p.devCostPerWeek;
    }
    if (p.status === 'Live') {
      const stats = getProductUserStats(p);
      const cfg = p.revenueConfig;
      weeklyInfra += cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
      totalPayingAll += stats.payingUsers;
      totalActiveAll += stats.totalActive;
    }
  }

  const weeklyBurn = weeklyPayroll + weeklyDevCost + weeklyInfra;
  const weeklyRevenue = totalPayingAll > 0
    ? state.products.reduce((s, p) => {
        if (p.status !== 'Live') return s;
        const stats = getProductUserStats(p);
        return s + (stats.payingUsers * p.revenueConfig.monthlyPrice) / 4;
      }, 0)
    : 0;
  const netWeekly = weeklyRevenue - weeklyBurn;
  const effectiveBurn = Math.max(0, -netWeekly);

  const runwayWeeks = effectiveBurn > 0 ? Math.floor(state.bank / effectiveBurn) : Infinity;
  const runwayMonths = Math.floor(runwayWeeks / 4);
  const runwayRemWeeks = runwayWeeks % 4;
  const runwayStr = runwayWeeks === Infinity ? '∞' : `${runwayMonths}mo ${runwayRemWeeks}wk`;

  const green = '#00d26a', red = '#ff4757', yellow = '#ffc048', blue = '#3b82f6';

  const appify = state.products.find((p) => p.id === 'appify');
  const appifyEpics = state.epics.filter((e) => e.productId === 'appify');
  const mvpWeeksLeft =
    appify?.status === 'Live'
      ? 0
      : Math.max(...appifyEpics.map((e) => weeksRemaining(e)));
  const mvpLabel =
    appify?.status === 'Live'
      ? 'Shipped'
      : mvpWeeksLeft === Infinity
        ? 'Not staffed'
        : `Est. ${mvpWeeksLeft} wks`;

  const mrr = totalPayingAll > 0
    ? state.products.reduce((s, p) => {
        if (p.status !== 'Live') return s;
        return s + getProductUserStats(p).payingUsers * p.revenueConfig.monthlyPrice;
      }, 0)
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {state.gameOver && (
        <div className="bg-accent-red/20 border border-accent-red rounded p-4 text-center">
          <span className="text-accent-red font-bold text-lg font-mono">
            GAME OVER — Your startup ran out of money at Year {state.year}, Week {state.week}
          </span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Bank Balance"
          value={formatCR(state.bank)}
          color={state.bank < 100000 ? red : state.bank < 300000 ? yellow : green}
        />
        <MetricCard
          label="Runway"
          value={runwayStr}
          sub={netWeekly >= 0 ? 'Net positive' : `${formatCR(effectiveBurn)}/wk net burn`}
          color={runwayWeeks < 26 ? red : runwayWeeks < 52 ? yellow : 'var(--txt-primary)'}
        />
        <MetricCard
          label="Weekly Burn"
          value={formatCR(weeklyBurn)}
          sub={`Salaries ${formatCR(weeklyPayroll)}${weeklyDevCost ? ` + Dev ${formatCR(weeklyDevCost)}` : ''}${weeklyInfra ? ` + Infra ${formatCR(weeklyInfra)}` : ''}`}
          color={red}
        />
        <MetricCard
          label="Headcount"
          value={activeEmployees.length}
          sub={`${formatCR(activeEmployees.reduce((s, e) => s + e.salary, 0))}/yr total comp`}
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label={`Appify: ${appify?.status}`}
          value={mvpLabel}
          color={appify?.status === 'Live' ? green : mvpWeeksLeft === Infinity ? yellow : blue}
        />
        <MetricCard
          label="MRR"
          value={formatCR(mrr)}
          sub={mrr > 0 ? `${formatCR(mrr / 4)}/wk` : null}
          color={mrr > 0 ? green : 'var(--txt-muted)'}
        />
        <MetricCard
          label="Active Users"
          value={totalActiveAll}
          sub={totalPayingAll > 0 ? `${totalPayingAll} paying` : null}
          color={totalActiveAll > 0 ? blue : 'var(--txt-muted)'}
        />
        <MetricCard
          label="Weekly Revenue"
          value={formatCR(weeklyRevenue)}
          sub={weeklyRevenue > 0 ? `Net: ${formatCR(netWeekly)}/wk` : null}
          color={weeklyRevenue > 0 ? green : 'var(--txt-muted)'}
        />
      </div>

      <div className="t-bg-card t-border border rounded flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 t-border border-b">
          <span className="text-xs t-text-secondary uppercase tracking-wider">
            Activity Log
          </span>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[420px]">
          {state.log.map((entry, i) => (
            <div
              key={i}
              className={`px-4 py-1.5 text-sm font-mono flex gap-3 ${
                i % 2 === 0 ? 't-bg-cell' : ''
              } ${entry.message.includes('GAME OVER') ? 'text-accent-red font-bold' : ''}`}
            >
              <span className="t-text-muted w-20 shrink-0">
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
