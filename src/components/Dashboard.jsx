import { formatCR } from '../helpers';
import { weeksRemaining, getProductUserStats } from '../reducer';

function MetricCard({ label, value, sub, color = 'var(--txt-primary)' }) {
  return (
    <div className="t-bg-card t-border border p-3 flex flex-col gap-0.5">
      <span className="text-xs t-text-secondary">{label}</span>
      <span className="font-mono text-lg font-semibold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs t-text-muted font-mono">{sub}</span>}
    </div>
  );
}

export default function Dashboard({ state }) {
  const activeEmployees = state.employees.filter((e) => e.status !== 'Left');
  const weeklyPayroll = activeEmployees.reduce((sum, e) => sum + e.salary / 52, 0);

  let weeklyDevCost = 0;
  for (const proj of state.devProjects) {
    if (proj.status !== 'Active') continue;
    if (proj.epics.some((e) => e.status === 'In Progress')) {
      weeklyDevCost += proj.devCostPerWeek;
    }
  }

  let weeklyInfra = 0;
  let weeklyRevenue = 0;
  let totalPayingAll = 0;
  let totalActiveAll = 0;
  let mrr = 0;

  for (const p of state.products) {
    const stats = getProductUserStats(p);
    const cfg = p.config;
    weeklyInfra += cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
    weeklyRevenue += (stats.payingUsers * p.monthlyPrice) / 4;
    totalPayingAll += stats.payingUsers;
    totalActiveAll += stats.totalActive;
    mrr += stats.payingUsers * p.monthlyPrice;
  }

  const weeklyBurn = weeklyPayroll + weeklyDevCost + weeklyInfra;
  const netWeekly = weeklyRevenue - weeklyBurn;
  const effectiveBurn = Math.max(0, -netWeekly);

  const runwayWeeks = effectiveBurn > 0 ? Math.floor(state.bank / effectiveBurn) : Infinity;
  const runwayMonths = Math.floor(runwayWeeks / 4);
  const runwayRemWeeks = runwayWeeks % 4;
  const runwayStr = runwayWeeks === Infinity ? '∞' : `${runwayMonths}mo ${runwayRemWeeks}wk`;

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
          sub={`Sal ${formatCR(weeklyPayroll)}${weeklyDevCost ? ` + Dev ${formatCR(weeklyDevCost)}` : ''}${weeklyInfra ? ` + Infra ${formatCR(weeklyInfra)}` : ''}`}
          color={red}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: 'var(--bg-border)' }}>
        <MetricCard
          label="Headcount"
          value={activeEmployees.length}
          sub={`${formatCR(activeEmployees.reduce((s, e) => s + e.salary, 0))}/yr total comp`}
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
      </div>
      <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--bg-border)' }}>
        <MetricCard
          label={`Appify: ${appifyPhase}`}
          value={appifyLabel}
          color={appifyColor}
        />
        <MetricCard
          label="Weekly Revenue"
          value={formatCR(weeklyRevenue)}
          sub={weeklyRevenue > 0 ? `Net: ${formatCR(netWeekly)}/wk` : null}
          color={weeklyRevenue > 0 ? green : 'var(--txt-muted)'}
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
