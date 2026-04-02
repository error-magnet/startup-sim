import { useState } from 'react';
import { effectiveWork, weeksRemaining, isInfraOperational } from '../reducer';
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
              style={{ width: `${pct}%`, background: epic.status === 'Complete' ? '#00d26a' : '#3b82f6' }}
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
          epic.status === 'Complete' ? 'bg-accent-green/20 text-accent-green'
            : epic.status === 'In Progress' ? 'bg-accent-blue/20 text-accent-blue'
              : 'bg-accent-yellow/20 text-accent-yellow'
        }`}>{epic.status}</span>
      </td>
    </tr>
  );
}

function AssignmentPanel({ title, assignedEmployees, unassigned, onAssign, onUnassign, complete }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (complete) {
    return (
      <div className="t-bg-card t-border border rounded p-3">
        <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">{title} — Complete</div>
        <div className="text-xs t-text-muted">All work finished.</div>
      </div>
    );
  }

  return (
    <div className="t-bg-card t-border border rounded p-3">
      <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {assignedEmployees.length === 0 && (
          <span className="text-xs t-text-muted italic">No one assigned</span>
        )}
        {assignedEmployees.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onUnassign(emp.id)}
            className="text-xs px-2 py-1 rounded bg-accent-blue/20 text-accent-blue hover:bg-accent-red/20 hover:text-accent-red transition-colors cursor-pointer"
            title={`Remove ${emp.name}`}
          >{emp.name} ×</button>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs px-2 py-1 rounded t-border border t-text-secondary hover:t-text transition-colors"
          disabled={unassigned.length === 0}
        >+ Assign employee</button>
        {showDropdown && unassigned.length > 0 && (
          <div className="absolute top-full left-0 mt-1 t-bg-card t-border border rounded shadow-lg z-10 max-h-48 overflow-y-auto min-w-[180px]">
            {unassigned.map((emp) => (
              <button
                key={emp.id}
                onClick={() => { onAssign(emp.id); setShowDropdown(false); }}
                className="block w-full text-left px-3 py-1.5 text-sm t-text-secondary hover:t-bg-hover transition-colors"
              >{emp.name}</button>
            ))}
          </div>
        )}
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
  const unassigned = state.employees.filter((e) => !e.assignment && e.status === 'Active');
  const allEpicsComplete = epics.every((e) => e.status === 'Complete');
  const isProduction = appify.phase === 'production';
  const operational = isInfraOperational(appify);
  const infraAssigned = state.employees.filter((e) => appify.infraEmployeeIds.includes(e.id));

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* === Development Phase === */}
      <div className="t-bg-card t-border border rounded px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold t-text text-base font-mono">{appify.name} MVP Development</span>
          <span className="text-xs t-text-muted">({appify.type})</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-sm">
          {!isProduction && (
            <>
              <span className="t-text-secondary">
                Dev Cost: <span className="text-accent-red">{formatCR(appify.devCostPerWeek)}/wk</span>
              </span>
              <span className="t-text-secondary">
                Spent: <span className="text-accent-red">{formatCR(appify.financials.totalDevCost)}</span>
              </span>
            </>
          )}
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            allEpicsComplete ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'
          }`}>{allEpicsComplete ? 'Complete' : 'In Development'}</span>
        </div>
      </div>

      {allEpicsComplete ? (
        <div className="t-bg-card t-border border rounded px-4 py-2 text-sm font-mono t-text-muted">
          All development epics completed. Total dev spend: {formatCR(appify.financials.totalDevCost)}
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

          <div className="grid grid-cols-2 gap-3">
            {epics.map((epic) => (
              <AssignmentPanel
                key={epic.id}
                title={epic.name}
                assignedEmployees={state.employees.filter((e) => epic.assignedEmployeeIds.includes(e.id))}
                unassigned={unassigned}
                onAssign={(id) => dispatch({ type: 'ASSIGN_EMPLOYEE', employeeId: id, epicId: epic.id })}
                onUnassign={(id) => dispatch({ type: 'UNASSIGN_EMPLOYEE', employeeId: id })}
                complete={epic.status === 'Complete'}
              />
            ))}
          </div>
        </>
      )}

      {/* === Production Phase === */}
      {isProduction && (
        <>
          <div className="t-bg-card t-border border rounded px-4 py-3 flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="font-bold t-text text-base font-mono">{appify.name} MVP Production</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-sm">
              <span className="t-text-secondary">
                Infra: <span className="text-accent-red">{formatCR(appify.revenueConfig.infraBaseCost)}/wk base</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                operational ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
              }`}>{operational ? 'Operational' : `Needs ${appify.infraMinStaff}+ staff`}</span>
            </div>
          </div>

          {/* Infra status table */}
          <div className="t-bg-card t-border border rounded overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="t-border border-b">
                  <th className="px-3 py-2 text-xs t-text-secondary uppercase tracking-wider text-left">Project</th>
                  <th className="px-3 py-2 text-xs t-text-secondary uppercase tracking-wider text-center">Assigned</th>
                  <th className="px-3 py-2 text-xs t-text-secondary uppercase tracking-wider text-center">Min Required</th>
                  <th className="px-3 py-2 text-xs t-text-secondary uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="t-border border-b">
                  <td className="px-3 py-2 t-text font-medium">Infrastructure</td>
                  <td className="px-3 py-2 text-center t-text-secondary">{infraAssigned.length}</td>
                  <td className="px-3 py-2 text-center t-text-muted">{appify.infraMinStaff}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      operational ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
                    }`}>{operational ? 'Running' : 'Understaffed'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!operational && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded px-4 py-2 text-sm font-mono text-accent-yellow">
              Assign at least {appify.infraMinStaff} employees to Infrastructure to begin operations. No signups or revenue until operational.
            </div>
          )}

          <AssignmentPanel
            title="Infrastructure"
            assignedEmployees={infraAssigned}
            unassigned={unassigned}
            onAssign={(id) => dispatch({ type: 'ASSIGN_INFRA', employeeId: id, productId: 'appify' })}
            onUnassign={(id) => dispatch({ type: 'UNASSIGN_EMPLOYEE', employeeId: id })}
          />
        </>
      )}

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
    </div>
  );
}
