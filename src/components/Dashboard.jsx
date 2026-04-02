import { formatCR } from '../helpers';

function MetricCard({ label, value, sub, color = 'text-txt-primary' }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded p-4 flex flex-col gap-1">
      <span className="text-xs text-txt-secondary uppercase tracking-wider">
        {label}
      </span>
      <span className={`font-mono text-xl font-semibold ${color}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-txt-muted font-mono">{sub}</span>}
    </div>
  );
}

export default function Dashboard({ state }) {
  const activeEmployees = state.employees.filter(
    (e) => e.status === 'Active'
  );
  const weeklyBurn = activeEmployees.reduce(
    (sum, e) => sum + e.salary / 52,
    0
  );
  const runwayWeeks =
    weeklyBurn > 0 ? Math.floor(state.bank / weeklyBurn) : Infinity;
  const runwayMonths = Math.floor(runwayWeeks / 4);
  const runwayRemWeeks = runwayWeeks % 4;
  const runwayStr =
    runwayWeeks === Infinity
      ? '∞'
      : `${runwayMonths}mo ${runwayRemWeeks}wk`;

  return (
    <div className="flex flex-col gap-4 p-4">
      {state.gameOver && (
        <div className="bg-accent-red/20 border border-accent-red rounded p-4 text-center">
          <span className="text-accent-red font-bold text-lg font-mono">
            GAME OVER — Your startup ran out of money at Year {state.year},
            Week {state.week}
          </span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Bank Balance"
          value={formatCR(state.bank)}
          color={
            state.bank < 100000
              ? 'text-accent-red'
              : state.bank < 300000
                ? 'text-accent-yellow'
                : 'text-accent-green'
          }
        />
        <MetricCard
          label="Runway"
          value={runwayStr}
          color={
            runwayWeeks < 26
              ? 'text-accent-red'
              : runwayWeeks < 52
                ? 'text-accent-yellow'
                : 'text-txt-primary'
          }
        />
        <MetricCard
          label="Weekly Burn"
          value={formatCR(weeklyBurn)}
          sub={`${formatCR(weeklyBurn * 52)}/yr`}
          color="text-accent-red"
        />
        <MetricCard
          label="Headcount"
          value={activeEmployees.length}
          sub={`${formatCR(activeEmployees.reduce((s, e) => s + e.salary, 0))}/yr total comp`}
        />
      </div>

      <div className="bg-bg-card border border-bg-border rounded flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 border-b border-bg-border">
          <span className="text-xs text-txt-secondary uppercase tracking-wider">
            Activity Log
          </span>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[420px]">
          {state.log.map((entry, i) => (
            <div
              key={i}
              className={`px-4 py-1.5 text-sm font-mono flex gap-3 ${
                i % 2 === 0 ? 'bg-bg-cell' : ''
              } ${entry.message.includes('GAME OVER') ? 'text-accent-red font-bold' : ''}`}
            >
              <span className="text-txt-muted w-20 shrink-0">
                Y{entry.year} W{String(entry.week).padStart(2, '0')}
              </span>
              <span className="text-txt-secondary">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
