import { useState } from 'react';
import { effectiveWork, weeksRemaining } from '../reducer';

function EpicRow({ epic, employees, dispatch }) {
  const assigned = employees.filter((e) =>
    epic.assignedEmployeeIds.includes(e.id)
  );
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
        {epic.status === 'Complete'
          ? '--'
          : wksLeft === Infinity
            ? '--'
            : `${wksLeft} wks`}
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            epic.status === 'Complete'
              ? 'bg-accent-green/20 text-accent-green'
              : epic.status === 'In Progress'
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'bg-accent-yellow/20 text-accent-yellow'
          }`}
        >
          {epic.status}
        </span>
      </td>
    </tr>
  );
}

function EpicAssignment({ epic, allEmployees, dispatch }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const assigned = allEmployees.filter((e) =>
    epic.assignedEmployeeIds.includes(e.id)
  );
  const unassigned = allEmployees.filter(
    (e) => !e.assignedEpicId && e.status === 'Active'
  );

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
      <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">
        {epic.name}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {assigned.length === 0 && (
          <span className="text-xs t-text-muted italic">No one assigned</span>
        )}
        {assigned.map((emp) => (
          <button
            key={emp.id}
            onClick={() =>
              dispatch({ type: 'UNASSIGN_EMPLOYEE', employeeId: emp.id })
            }
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
                  dispatch({
                    type: 'ASSIGN_EMPLOYEE',
                    employeeId: emp.id,
                    epicId: epic.id,
                  });
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

export default function Projects({ state, dispatch }) {
  const appify = state.products.find((p) => p.id === 'appify');
  const epics = state.epics.filter((e) => e.productId === 'appify');
  const unassigned = state.employees.filter(
    (e) => !e.assignedEpicId && e.status === 'Active'
  );

  const HEADERS = [
    { label: 'Epic', align: 'text-left' },
    { label: 'Assigned', align: 'text-center' },
    { label: 'Effective Rate', align: 'text-center' },
    { label: 'Progress', align: 'text-left' },
    { label: 'Est. Weeks Left', align: 'text-center' },
    { label: 'Status', align: 'text-center' },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Product header */}
      <div className="t-bg-card t-border border rounded px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold t-text text-base font-mono">
            {appify.name}
          </span>
          <span className="text-xs t-text-muted">({appify.type})</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono ${
            appify.status === 'Live'
              ? 'bg-accent-green/20 text-accent-green'
              : 'bg-accent-yellow/20 text-accent-yellow'
          }`}
        >
          {appify.status}
        </span>
      </div>

      {/* Epics table */}
      <div className="t-bg-card t-border border rounded overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="t-border border-b">
              {HEADERS.map((h) => (
                <th
                  key={h.label}
                  className={`px-3 py-2 text-xs t-text-secondary uppercase tracking-wider ${h.align}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {epics.map((epic, i) => (
              <EpicRow
                key={epic.id}
                epic={epic}
                employees={state.employees}
                dispatch={dispatch}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Assignment panels */}
      <div className="grid grid-cols-2 gap-3">
        {epics.map((epic) => (
          <EpicAssignment
            key={epic.id}
            epic={epic}
            allEmployees={state.employees}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Unassigned pool */}
      <div className="t-bg-card t-border border rounded p-3">
        <div className="text-xs t-text-secondary uppercase tracking-wider mb-2">
          Unassigned Employees ({unassigned.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unassigned.length === 0 && (
            <span className="text-xs t-text-muted italic">
              All employees are assigned
            </span>
          )}
          {unassigned.map((emp) => (
            <span
              key={emp.id}
              className="text-xs px-2 py-1 rounded t-text-secondary"
              style={{ background: 'var(--bg-cell)' }}
            >
              {emp.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
