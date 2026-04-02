import { useState, useRef, useEffect } from 'react';
import { effectiveWork, weeksRemaining, calcConversionRate, getProductUserStats } from '../reducer';
import { formatCR } from '../helpers';

function EpicRow({ epic, employees }) {
  const assigned = employees.filter((e) => epic.assignedEmployeeIds.includes(e.id));
  const eff = effectiveWork(assigned.length);
  const wksLeft = weeksRemaining(epic);
  const pct = epic.totalWork > 0 ? (epic.workCompleted / epic.totalWork) * 100 : 0;

  return (
    <tr className="t-border border-b">
      <td className="px-3 py-2 t-text font-medium">{epic.name}</td>
      <td className="px-3 py-2 text-center t-text-secondary">{assigned.length}</td>
      <td className="px-3 py-2 text-center t-text-secondary">{eff.toFixed(1)}/wk</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded t-bg-hover overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${pct}%`,
                background: epic.status === 'Complete' ? '#00d26a' : '#3b82f6',
              }}
            />
          </div>
          <span className="text-xs t-text-muted font-mono w-16 text-right">
            {epic.workCompleted.toFixed(1)}/{epic.totalWork}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-center font-mono t-text-secondary">
        {epic.status === 'Complete' ? '--' : wksLeft === Infinity ? '--' : `${wksLeft} wks`}
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`text-xs px-2 py-0.5 rounded ${
          epic.status === 'Complete'
            ? 'bg-accent-green/20 text-accent-green'
            : epic.status === 'In Progress'
              ? 'bg-accent-blue/20 text-accent-blue'
              : 'bg-accent-yellow/20 text-accent-yellow'
        }`}>
          {epic.status}
        </span>
      </td>
    </tr>
  );
}

function EpicAssignment({ epic, allEmployees, dispatch }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const assigned = allEmployees.filter((e) => epic.assignedEmployeeIds.includes(e.id));
  const unassigned = allEmployees.filter((e) => !e.assignedEpicId && e.status === 'Active');

  if (epic.status === 'Complete') {
    return (
      <div className="t-bg-card t-border border rounded p-3">
        <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">
          {epic.name} — Complete
        </div>
        <div className="text-xs t-text-muted">All work finished.</div>
      </div>
    );
  }

  return (
    <div className="t-bg-card t-border border rounded p-3">
      <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">{epic.name}</div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {assigned.length === 0 && (
          <span className="text-xs t-text-muted italic">No one assigned</span>
        )}
        {assigned.map((emp) => (
          <button
            key={emp.id}
            onClick={() => dispatch({ type: 'UNASSIGN_EMPLOYEE', employeeId: emp.id })}
            className="text-xs px-2 py-1 rounded bg-accent-blue/20 text-accent-blue hover:bg-accent-red/20 hover:text-accent-red transition-colors cursor-pointer"
            title={`Remove ${emp.name}`}
          >
            {emp.name} ×
          </button>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs px-2 py-1 rounded t-border border t-text-secondary hover:t-text transition-colors"
          disabled={unassigned.length === 0}
        >
          + Assign employee
        </button>
        {showDropdown && unassigned.length > 0 && (
          <div className="absolute top-full left-0 mt-1 t-bg-card t-border border rounded shadow-lg z-10 max-h-48 overflow-y-auto min-w-[180px]">
            {unassigned.map((emp) => (
              <button
                key={emp.id}
                onClick={() => {
                  dispatch({ type: 'ASSIGN_EMPLOYEE', employeeId: emp.id, epicId: epic.id });
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-sm t-text-secondary hover:t-bg-hover transition-colors"
              >
                {emp.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PriceInput({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) onChange(Math.round(n * 100) / 100);
    else setDraft(String(value));
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      className="w-16 bg-transparent t-border border px-2 py-0.5 text-right font-mono text-sm t-text outline-none focus:border-accent-blue"
    />
  );
}

function LiveProductView({ product, state, dispatch }) {
  const cfg = product.revenueConfig;
  const stats = getProductUserStats(product);
  const conversionRate = calcConversionRate(cfg);
  const weeklyRevenue = (stats.payingUsers * cfg.monthlyPrice) / 4;
  const weeklyInfra = cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
  const weeklyProfit = weeklyRevenue - weeklyInfra;

  // Find last month's churn from log
  const launchYear = Math.ceil(product.launchedWeek / 52);
  const launchWeekInYear = ((product.launchedWeek - 1) % 52) + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Pricing */}
        <div className="t-bg-card t-border border rounded p-4">
          <div className="text-xs t-text-secondary uppercase tracking-wider mb-3">Pricing</div>
          <table className="text-sm font-mono w-full">
            <tbody>
              <tr>
                <td className="py-1 t-text-secondary">Monthly Price</td>
                <td className="py-1 text-right">
                  <span className="t-text-muted mr-1">CR</span>
                  <PriceInput
                    value={cfg.monthlyPrice}
                    onChange={(p) => dispatch({ type: 'SET_PRICE', productId: product.id, price: p })}
                  />
                </td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Conversion Rate</td>
                <td className="py-1 text-right t-text">{(conversionRate * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Free Trial</td>
                <td className="py-1 text-right t-text">{cfg.freeTrialWeeks} weeks</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Monthly Churn</td>
                <td className="py-1 text-right t-text">{(cfg.monthlyChurnRate * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Operations */}
        <div className="t-bg-card t-border border rounded p-4">
          <div className="text-xs t-text-secondary uppercase tracking-wider mb-3">Operations</div>
          <table className="text-sm font-mono w-full">
            <tbody>
              <tr>
                <td className="py-1 t-text-secondary">Infra Cost</td>
                <td className="py-1 text-right text-accent-red">{formatCR(weeklyInfra)}/wk</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Weekly Revenue</td>
                <td className="py-1 text-right text-accent-green">{formatCR(weeklyRevenue)}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Weekly Profit</td>
                <td className={`py-1 text-right font-semibold ${weeklyProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatCR(weeklyProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* User Metrics */}
        <div className="t-bg-card t-border border rounded p-4">
          <div className="text-xs t-text-secondary uppercase tracking-wider mb-3">User Metrics</div>
          <table className="text-sm font-mono w-full">
            <tbody>
              <tr>
                <td className="py-1 t-text-secondary">New Signups</td>
                <td className="py-1 text-right t-text">{cfg.signupsPerMonth}/mo</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">On Free Trial</td>
                <td className="py-1 text-right t-text">{stats.trialUsers}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Paying Users</td>
                <td className="py-1 text-right text-accent-green">{stats.payingUsers}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Total Active</td>
                <td className="py-1 text-right t-text font-semibold">{stats.totalActive}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financials */}
        <div className="t-bg-card t-border border rounded p-4">
          <div className="text-xs t-text-secondary uppercase tracking-wider mb-3">Financials (cumulative)</div>
          <table className="text-sm font-mono w-full">
            <tbody>
              <tr>
                <td className="py-1 t-text-secondary">Total Revenue</td>
                <td className="py-1 text-right text-accent-green">{formatCR(product.financials.totalRevenue)}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Total Dev Cost</td>
                <td className="py-1 text-right text-accent-red">{formatCR(product.financials.totalDevCost)}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Total Infra</td>
                <td className="py-1 text-right text-accent-red">{formatCR(product.financials.totalInfraCost)}</td>
              </tr>
              <tr>
                <td className="py-1 t-text-secondary">Net from {product.name}</td>
                <td className={`py-1 text-right font-semibold ${
                  product.financials.totalRevenue - product.financials.totalDevCost - product.financials.totalInfraCost >= 0
                    ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  {formatCR(
                    product.financials.totalRevenue - product.financials.totalDevCost - product.financials.totalInfraCost
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const EPIC_HEADERS = [
  { label: 'Epic', align: 'text-left' },
  { label: 'Assigned', align: 'text-center' },
  { label: 'Effective Rate', align: 'text-center' },
  { label: 'Progress', align: 'text-left' },
  { label: 'Est. Weeks Left', align: 'text-center' },
  { label: 'Status', align: 'text-center' },
];

export default function Projects({ state, dispatch }) {
  const appify = state.products.find((p) => p.id === 'appify');
  const epics = state.epics.filter((e) => e.productId === 'appify');
  const unassigned = state.employees.filter((e) => !e.assignedEpicId && e.status === 'Active');
  const isLive = appify.status === 'Live';
  const allEpicsComplete = epics.every((e) => e.status === 'Complete');

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Product header */}
      <div className="t-bg-card t-border border rounded px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold t-text text-base font-mono">{appify.name}</span>
          <span className="text-xs t-text-muted">({appify.type})</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-sm">
          {appify.status === 'In Development' && (
            <>
              <span className="t-text-secondary">
                Dev Cost: <span className="text-accent-red">{formatCR(appify.devCostPerWeek)}/wk</span>
              </span>
              <span className="t-text-secondary">
                Total Dev Spend: <span className="text-accent-red">{formatCR(appify.financials.totalDevCost)}</span>
              </span>
            </>
          )}
          {isLive && appify.launchedWeek && (
            <span className="t-text-muted">
              Launched: Y{Math.ceil(appify.launchedWeek / 52)} W{((appify.launchedWeek - 1) % 52) + 1}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            isLive ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'
          }`}>
            {appify.status}
          </span>
        </div>
      </div>

      {/* Epics table — collapsed if all complete */}
      {allEpicsComplete ? (
        <div className="t-bg-card t-border border rounded px-4 py-2 text-sm font-mono t-text-muted">
          All epics completed.
        </div>
      ) : (
        <>
          <div className="t-bg-card t-border border rounded overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="t-border border-b">
                  {EPIC_HEADERS.map((h) => (
                    <th key={h.label} className={`px-3 py-2 text-xs t-text-secondary uppercase tracking-wider ${h.align}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {epics.map((epic) => (
                  <EpicRow key={epic.id} epic={epic} employees={state.employees} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Assignment panels */}
          <div className="grid grid-cols-2 gap-3">
            {epics.map((epic) => (
              <EpicAssignment key={epic.id} epic={epic} allEmployees={state.employees} dispatch={dispatch} />
            ))}
          </div>

          {/* Unassigned pool */}
          <div className="t-bg-card t-border border rounded p-3">
            <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">
              Unassigned Employees ({unassigned.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unassigned.length === 0 && (
                <span className="text-xs t-text-muted italic">All employees are assigned</span>
              )}
              {unassigned.map((emp) => (
                <span key={emp.id} className="text-xs px-2 py-1 rounded t-text-secondary" style={{ background: 'var(--bg-cell)' }}>
                  {emp.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Live product operations view */}
      {isLive && <LiveProductView product={appify} state={state} dispatch={dispatch} />}
    </div>
  );
}
