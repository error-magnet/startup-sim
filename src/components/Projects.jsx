import { useState } from 'react';
import { effectiveWork, weeksRemaining } from '../reducer';
import { formatCR } from '../helpers';

function EpicRow({ epic }) {
  const assigned = epic.assignedEmployeeIds.length;
  const eff = effectiveWork(assigned, epic.baseHeadcount);
  const wksLeft = weeksRemaining(epic);
  const pct = epic.totalWork > 0 ? (epic.workCompleted / epic.totalWork) * 100 : 0;

  return (
    <tr>
      <td className="t-text">{epic.name}</td>
      <td className="text-center font-mono">{assigned}</td>
      <td className="text-center font-mono">{eff.toFixed(1)}/wk</td>
      <td>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 t-bg-hover overflow-hidden">
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: epic.status === 'Complete' ? '#00d26a' : '#3b82f6' }}
            />
          </div>
          <span className="text-xs t-text-muted font-mono w-16 text-right">
            {epic.workCompleted.toFixed(1)}/{epic.totalWork}
          </span>
        </div>
      </td>
      <td className="text-center font-mono t-text-secondary">
        {epic.status === 'Complete' ? '--' : wksLeft === Infinity ? '--' : `${wksLeft} wks`}
      </td>
      <td className="text-center">
        <span className={
          epic.status === 'Complete' ? 'text-accent-green'
            : epic.status === 'In Progress' ? 'text-accent-blue'
              : 'text-accent-yellow'
        }>{epic.status}</span>
      </td>
    </tr>
  );
}

function AssignmentPanel({ title, assignedEmployees, unassigned, onAssign, onUnassign, complete, baseHeadcount }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (complete) {
    return (
      <div className="t-bg-card t-border border p-3">
        <div className="text-xs t-text-secondary mb-1">{title} — Complete</div>
        <div className="text-xs t-text-muted">All work finished.</div>
      </div>
    );
  }

  return (
    <div className="t-bg-card t-border border p-3">
      <div className="text-xs t-text-secondary mb-2">
        {title}
        <span className="t-text-muted ml-1">({assignedEmployees.length}/{baseHeadcount} needed)</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
        {assignedEmployees.length === 0 && (
          <span className="text-xs t-text-muted">No one assigned</span>
        )}
        {assignedEmployees.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onUnassign(emp.id)}
            className="text-xs px-1.5 py-0.5 text-accent-blue t-border border hover:text-accent-red transition-colors cursor-pointer"
            title={`Remove ${emp.name}`}
          >{emp.name} ×</button>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs px-2 py-0.5 t-border border t-text-secondary hover:t-text transition-colors"
          disabled={unassigned.length === 0}
        >+ Assign</button>
        {showDropdown && unassigned.length > 0 && (
          <div className="absolute top-full left-0 mt-1 t-bg-card t-border border shadow-lg z-10 max-h-48 overflow-y-auto min-w-[160px]">
            {unassigned.map((emp) => (
              <button
                key={emp.id}
                onClick={() => { onAssign(emp.id); setShowDropdown(false); }}
                className="block w-full text-left px-3 py-1 text-sm t-text-secondary hover:t-bg-hover transition-colors"
              >{emp.name}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, state, dispatch, unassigned }) {
  const fmt = (v) => formatCR(v, state.currency.symbol);
  const isComplete = project.status === 'Complete';

  return (
    <div className="flex flex-col gap-3">
      {/* Project header */}
      <div className="t-bg-card t-border border px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold t-text">{project.name}</span>
          <span className="text-xs t-text-muted">({project.type})</span>
          <span className={`sm:hidden ${isComplete ? 'text-accent-green' : 'text-accent-yellow'} text-sm`}>
            {isComplete ? 'Complete' : 'Active'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {!isComplete && (
            <>
              <span className="t-text-secondary">
                Project Cost: <span className="text-accent-red font-mono">{fmt(project.devCostPerMonth)}/mo</span>
              </span>
              <span className="t-text-secondary">
                Spent: <span className="text-accent-red font-mono">{fmt(project.totalDevSpend)}</span>
              </span>
            </>
          )}
          <span className={`hidden sm:inline ${isComplete ? 'text-accent-green' : 'text-accent-yellow'}`}>
            {isComplete ? 'Complete' : 'Active'}
          </span>
        </div>
      </div>

      {isComplete ? (
        <div className="t-bg-card t-border border px-3 py-2 text-sm t-text-muted">
          All epics completed. Total project spend: <span className="font-mono">{fmt(project.totalDevSpend)}</span>
        </div>
      ) : (
        <>
          <div className="t-bg-card t-border border overflow-x-auto">
            <table className="sheet text-sm w-max sm:w-full" style={{ minWidth: '520px' }}>
              <thead>
                <tr>
                  <th className="text-left">Epic</th>
                  <th className="text-center">Assigned</th>
                  <th className="text-center">Eff. Rate</th>
                  <th className="text-left">Progress</th>
                  <th className="text-center">Est. Left</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {project.epics.map((epic) => (
                  <EpicRow key={epic.id} epic={epic} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.epics.map((epic) => (
              <AssignmentPanel
                key={epic.id}
                title={epic.name}
                assignedEmployees={state.employees.filter((e) => epic.assignedEmployeeIds.includes(e.id))}
                unassigned={unassigned}
                onAssign={(id) => dispatch({ type: 'ASSIGN_EMPLOYEE', employeeId: id, epicId: epic.id })}
                onUnassign={(id) => dispatch({ type: 'UNASSIGN_EMPLOYEE', employeeId: id })}
                complete={epic.status === 'Complete'}
                baseHeadcount={epic.baseHeadcount}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Projects({ state, dispatch }) {
  const unassigned = state.employees.filter((e) => !e.assignment && e.status === 'Active');

  return (
    <div className="p-3 flex flex-col gap-4 overflow-hidden">
      {state.devProjects.map((proj) => (
        <ProjectCard key={proj.id} project={proj} state={state} dispatch={dispatch} unassigned={unassigned} />
      ))}

      {/* Unassigned pool */}
      <div className="t-bg-card t-border border p-3">
        <div className="text-xs t-text-secondary mb-1.5">Unassigned Employees ({unassigned.length})</div>
        <div className="flex flex-wrap gap-1">
          {unassigned.length === 0 && (
            <span className="text-xs t-text-muted">All employees are assigned</span>
          )}
          {unassigned.map((emp) => (
            <span key={emp.id} className="text-xs px-1.5 py-0.5 t-text-secondary t-bg-cell t-border border">
              {emp.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
