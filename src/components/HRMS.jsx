import { useState, useMemo } from 'react';
import { formatCR } from '../helpers';
import { findEpicInProjects } from '../reducer';

const HEADERS = [
  { key: 'id', label: '#', align: 'text-left' },
  { key: 'name', label: 'Name', align: 'text-left' },
  { key: 'assignment', label: 'Assignment', align: 'text-left' },
  { key: 'salary', label: 'Salary (Mo)', align: 'text-right' },
  { key: 'happiness', label: 'Happiness', align: 'text-right' },
  { key: 'salaryPriority', label: 'Sal.Pri', align: 'text-center' },
  { key: 'restlessness', label: 'Restless', align: 'text-center' },
  { key: 'status', label: 'Status', align: 'text-left' },
  { key: 'joinedWeek', label: 'Joined', align: 'text-left' },
];

export default function HRMS({ state, dispatch }) {
  const fmt = (v) => formatCR(v, state.currency.symbol);
  const [sortKey, setSortKey] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key) => {
    const resolved = key === 'salaryW' ? 'salary' : key;
    if (sortKey === resolved) setSortAsc(!sortAsc);
    else { setSortKey(resolved); setSortAsc(true); }
  };

  const sorted = useMemo(() => {
    const arr = [...state.employees];
    arr.sort((a, b) => {
      let va, vb;
      if (sortKey === 'salary') {
        va = a.salary; vb = b.salary;
      } else if (sortKey === 'salaryPriority') {
        va = a.personality.salaryPriority; vb = b.personality.salaryPriority;
      } else if (sortKey === 'restlessness') {
        va = a.personality.restlessness; vb = b.personality.restlessness;
      } else if (sortKey === 'assignment') {
        va = a.assignment || ''; vb = b.assignment || '';
      } else {
        va = a[sortKey]; vb = b[sortKey];
      }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [state.employees, sortKey, sortAsc]);

  const activeCount = state.employees.filter((e) => e.status !== 'Left').length;
  const totalAnnual = state.employees.reduce(
    (s, e) => s + (e.status !== 'Left' ? e.salary : 0), 0
  );
  const totalMonthly = totalAnnual;

  function getAssignmentLabel(emp) {
    if (!emp.assignment) return 'Unassigned';
    const found = findEpicInProjects(emp.assignment, state.devProjects);
    if (!found) return 'Unassigned';
    const shortEpic = found.epic.name.length > 20 ? found.epic.name.slice(0, 18) + '...' : found.epic.name;
    return `${found.project.name}: ${shortEpic}`;
  }

  function happinessColor(h) {
    if (h >= 80) return 'text-accent-green';
    if (h >= 50) return 'text-accent-yellow';
    return 'text-accent-red';
  }

  return (
    <div className="p-3 overflow-hidden">
      <div className="t-bg-card t-border border overflow-x-auto">
        <table className="sheet text-sm w-max sm:w-full" style={{ minWidth: '720px' }}>
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  className={`cursor-pointer select-none ${h.align}`}
                  onClick={() => handleSort(h.key)}
                >
                  {h.label}{' '}
                  {sortKey === (h.key === 'salaryW' ? 'salary' : h.key)
                    ? sortAsc ? '▲' : '▼' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((emp) => (
              <tr key={emp.id} className={emp.status === 'Left' ? 'opacity-40' : ''}>
                <td className="t-text-muted font-mono">{emp.id}</td>
                <td className="t-text">{emp.name}</td>
                <td>
                  <span className={emp.assignment ? 'text-accent-blue' : 't-text-muted'}>
                    {getAssignmentLabel(emp)}
                  </span>
                </td>
                <td className="text-right font-mono">{fmt(emp.salary)}</td>
                <td className={`text-right font-mono ${happinessColor(emp.happiness)}`}>
                  {emp.happiness.toFixed(0)}
                </td>
                <td className="text-center font-mono t-text-secondary">{emp.personality.salaryPriority}</td>
                <td className="text-center font-mono t-text-secondary">{emp.personality.restlessness}</td>
                <td>
                  <span className={
                    emp.status === 'Active' ? 'text-accent-green'
                      : emp.status === 'Negotiating' ? 'text-accent-yellow'
                        : 'text-accent-red'
                  }>{emp.status}</span>
                </td>
                <td className="t-text-muted font-mono">Wk {emp.joinedWeek}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold" style={{ borderTop: '2px solid var(--bg-border)' }}>
              <td></td>
              <td className="t-text">Total ({activeCount} active)</td>
              <td></td>
              <td className="text-right text-accent-cyan font-mono">{fmt(totalMonthly)}</td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hiring Section */}
      {state.hiringCandidates.length > 0 && (
        <div className="t-bg-card t-border border overflow-hidden mt-3">
          <div className="px-3 py-1.5 t-border border-b">
            <span className="text-xs t-text-secondary font-semibold">Hiring</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {state.hiringCandidates.map((candidate) => (
              <div key={candidate.id} className="t-border border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold t-text text-sm">{candidate.name}</div>
                  <div className="text-xs t-text-secondary">{candidate.role}</div>
                  <div className="text-xs t-text-muted mt-1">
                    Salary: <span className="font-mono text-accent-yellow">{fmt(candidate.salary)}/mo</span>
                    {candidate.termWeeks && (
                      <span> — Term: {Math.round(candidate.termWeeks / 4)} months</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'HIRE_CANDIDATE', candidateId: candidate.id })}
                  className="px-3 py-1 text-sm font-semibold shrink-0 transition-colors"
                  style={{ background: '#00d26a', color: '#000' }}
                >Hire</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
