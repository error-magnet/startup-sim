import { useReducer, useEffect, useRef, useState } from 'react';
import { gameReducer, initialState } from './reducer';
import { formatCR } from './helpers';
import Dashboard from './components/Dashboard';
import HRMS from './components/HRMS';
import BalanceSheet from './components/BalanceSheet';
import Projects from './components/Projects';
import Growth from './components/Growth';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'growth', label: 'Growth' },
  { key: 'projects', label: 'Projects' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'balance', label: 'Balance Sheet' },
];

function CompanyName({ name, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim()) dispatch({ type: 'SET_COMPANY_NAME', name: draft.trim() });
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (draft.trim()) dispatch({ type: 'SET_COMPANY_NAME', name: draft.trim() });
            setEditing(false);
          }
          if (e.key === 'Escape') { setDraft(name); setEditing(false); }
        }}
        className="bg-transparent border-b border-accent-cyan text-accent-cyan font-bold tracking-wider text-sm outline-none w-48 font-mono"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(name); setEditing(true); }}
      className="font-bold text-accent-cyan tracking-wider text-sm hover:text-accent-cyan/80 transition-colors cursor-text font-mono"
      title="Click to rename"
    >
      {name}
    </button>
  );
}

function NegotiationModal({ employee, dispatch }) {
  const [offerSalary, setOfferSalary] = useState(String(employee.salary));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="t-bg-card t-border border p-5 max-w-sm flex flex-col gap-3">
        <div className="text-accent-yellow font-semibold text-sm">{employee.name} is considering leaving</div>
        <table className="sheet text-sm w-full">
          <tbody>
            <tr>
              <td className="t-text-secondary">Happiness</td>
              <td className="text-right font-mono text-accent-red">{employee.happiness.toFixed(0)}</td>
            </tr>
            <tr>
              <td className="t-text-secondary">Current Salary</td>
              <td className="text-right font-mono">{formatCR(employee.salary)}/yr</td>
            </tr>
            <tr>
              <td className="t-text-secondary">Salary Priority</td>
              <td className="text-right font-mono">{employee.personality.salaryPriority}/10</td>
            </tr>
            <tr>
              <td className="t-text-secondary">Restlessness</td>
              <td className="text-right font-mono">{employee.personality.restlessness}/10</td>
            </tr>
          </tbody>
        </table>
        <div className="flex items-center gap-2 text-sm">
          <span className="t-text-secondary">Offer:</span>
          <span className="t-text-muted">CR</span>
          <input
            value={offerSalary}
            onChange={(e) => setOfferSalary(e.target.value)}
            className="w-24 bg-transparent t-border border px-2 py-0.5 text-right font-mono text-sm t-text outline-none focus:border-accent-blue"
          />
          <span className="t-text-muted">/yr</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const n = parseFloat(offerSalary);
              if (!isNaN(n) && n > 0) dispatch({ type: 'NEGOTIATE_OFFER', employeeId: employee.id, newSalary: n });
            }}
            className="px-3 py-1 text-sm font-semibold"
            style={{ background: '#00d26a', color: '#000' }}
          >Make Offer</button>
          <button
            onClick={() => dispatch({ type: 'LET_EMPLOYEE_GO', employeeId: employee.id })}
            className="px-3 py-1 text-sm t-text-secondary t-border border hover:text-accent-red transition-colors"
          >Let Them Go</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!state.paused && !state.gameOver) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 5000 / state.speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.paused, state.speed, state.gameOver]);

  useEffect(() => {
    document.documentElement.className = `theme-${state.theme}`;
  }, [state.theme]);

  const negotiatingEmployee = state.negotiatingEmployeeId
    ? state.employees.find((e) => e.id === state.negotiatingEmployeeId)
    : null;

  const isPlaying = !state.paused && !state.gameOver;
  const barAccent = isPlaying ? 'rgba(0,210,106,0.08)' : undefined;
  const barBorder = isPlaying ? 'rgba(0,210,106,0.3)' : undefined;

  return (
    <div className="h-screen flex flex-col t-bg t-text">
      {/* Top Bar */}
      <div
        className="t-bg-card t-border border-b flex items-center justify-between px-3 py-1.5 shrink-0 transition-colors"
        style={{ background: barAccent, borderBottomColor: barBorder }}
      >
        <div className="flex items-center gap-4">
          <CompanyName name={state.companyName} dispatch={dispatch} />

          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
                className={`px-3 py-1 text-sm t-border border -ml-px first:ml-0 transition-colors ${
                  state.activeTab === tab.key ? 't-bg-hover t-text' : 't-text-secondary'
                }`}
                style={state.activeTab === tab.key ? { borderColor: 'rgba(59,130,246,0.4)' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-mono text-base flex items-center gap-1 mr-1 t-bg-cell px-2 py-0.5 t-border border">
            <span className="t-text-muted text-xs">Y</span>
            <span className="font-bold t-text">{state.year}</span>
            <span className="t-text-muted mx-0.5">|</span>
            <span className="t-text-muted text-xs">W</span>
            <span className="font-bold t-text">{String(state.week).padStart(2, '0')}</span>
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={state.gameOver || !!state.negotiatingEmployeeId}
            className={`w-7 h-7 flex items-center justify-center text-sm transition-colors ${
              state.gameOver || state.negotiatingEmployeeId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ background: state.paused ? '#00d26a' : '#ffc048', color: '#000' }}
            title={state.paused ? 'Play' : 'Pause'}
          >
            {state.paused ? '▶' : '⏸'}
          </button>

          <div className="flex items-center gap-0.5">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
                className={`px-1.5 py-0.5 text-xs font-mono transition-colors ${
                  state.speed === s ? 'bg-accent-blue text-white' : 't-text-muted'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => { if (confirm('Restart game? All progress will be lost.')) dispatch({ type: 'RESTART' }); }}
            className="w-7 h-7 flex items-center justify-center transition-colors t-text-muted"
            title="Restart game"
          >↻</button>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="w-7 h-7 flex items-center justify-center transition-colors t-text-muted"
            title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {state.theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {state.activeTab === 'dashboard' && <Dashboard state={state} />}
        {state.activeTab === 'growth' && <Growth state={state} dispatch={dispatch} />}
        {state.activeTab === 'projects' && <Projects state={state} dispatch={dispatch} />}
        {state.activeTab === 'hrms' && <HRMS state={state} />}
        {state.activeTab === 'balance' && <BalanceSheet state={state} />}
      </div>

      {/* Negotiation modal */}
      {negotiatingEmployee && (
        <NegotiationModal key={negotiatingEmployee.id} employee={negotiatingEmployee} dispatch={dispatch} />
      )}

      {/* Game Over overlay */}
      {state.gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="t-bg-card t-border border p-6 max-w-sm text-center flex flex-col gap-3">
            <div className="text-accent-red font-mono text-xl font-bold">BANKRUPT</div>
            <div className="t-text-secondary text-sm">
              {state.companyName} ran out of money at Year {state.year}, Week {state.week}.
            </div>
            <button
              onClick={() => dispatch({ type: 'RESTART' })}
              className="mt-1 px-4 py-1.5 text-sm font-semibold transition-colors"
              style={{ background: '#00d26a', color: '#000' }}
            >Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
