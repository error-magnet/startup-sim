import { useState, useMemo } from 'react';
import { formatCR } from '../helpers';

const HEADERS = [
  { key: 'id', label: '#', align: 'text-left' },
  { key: 'name', label: 'Name', align: 'text-left' },
  { key: 'assignment', label: 'Assignment', align: 'text-left' },
  { key: 'salary', label: 'Salary (Annual)', align: 'text-right' },
  { key: 'salaryW', label: 'Salary (Weekly)', align: 'text-right' },
  { key: 'status', label: 'Status', align: 'text-left' },
  { key: 'joinedWeek', label: 'Joined', align: 'text-left' },
];

export default function HRMS({ state }) {
  const [sortKey, setSortKey] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);

  const epicMap = useMemo(() => {
    const map = {};
    for (const epic of state.epics) {
      map[epic.id] = epic;
    }
    return map;
  }, [state.epics]);

  const handleSort = (key) => {
    const resolved = key === 'salaryW' ? 'salary' : key;
    if (sortKey === resolved) setSortAsc(!sortAsc);
    else {
      setSortKey(resolved);
      setSortAsc(true);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...state.employees];
    arr.sort((a, b) => {
      let va, vb;
      if (sortKey === 'assignment') {
        va = a.assignedEpicId || '';
        vb = b.assignedEpicId || '';
      } else {
        va = a[sortKey];
        vb = b[sortKey];
      }
      if (typeof va === 'string') {
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [state.employees, sortKey, sortAsc]);

  const totalAnnual = state.employees.reduce(
    (s, e) => s + (e.status === 'Active' ? e.salary : 0),
    0
  );
  const totalWeekly = totalAnnual / 52;
  const activeCount = state.employees.filter(
    (e) => e.status === 'Active'
  ).length;

  function getAssignmentLabel(emp) {
    if (!emp.assignedEpicId) return 'Unassigned';
    const epic = epicMap[emp.assignedEpicId];
    if (!epic) return 'Unassigned';
    const product = state.products.find((p) => p.id === epic.productId);
    const shortEpic = epic.name.length > 20 ? epic.name.slice(0, 18) + '...' : epic.name;
    return `${product?.name || ''}: ${shortEpic}`;
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="t-bg-card t-border border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="t-border border-b">
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={`px-3 py-2 text-xs t-text-secondary uppercase tracking-wider cursor-pointer select-none ${h.align}`}
                    onClick={() => handleSort(h.key)}
                  >
                    {h.label}{' '}
                    {sortKey === (h.key === 'salaryW' ? 'salary' : h.key)
                      ? sortAsc
                        ? '▲'
                        : '▼'
                      : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={`t-border border-b hover:t-bg-hover ${
                    i % 2 === 0 ? 't-bg-cell' : 't-bg-card'
                  }`}
                >
                  <td className="px-3 py-2 t-text-muted">{emp.id}</td>
                  <td className="px-3 py-2 t-text">{emp.name}</td>
                  <td className="px-3 py-2">
                    <span className={emp.assignedEpicId ? 'text-accent-blue' : 't-text-muted'}>
                      {getAssignmentLabel(emp)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCR(emp.salary)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCR(emp.salary / 52)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        emp.status === 'Active'
                          ? 'bg-accent-green/20 text-accent-green'
                          : 'bg-accent-red/20 text-accent-red'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 t-text-muted">
                    Wk {emp.joinedWeek}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="t-border border-t-2 t-bg-card font-semibold">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 t-text">
                  Total ({activeCount} active)
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-accent-cyan">
                  {formatCR(totalAnnual)}
                </td>
                <td className="px-3 py-2 text-right text-accent-cyan">
                  {formatCR(totalWeekly)}
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
