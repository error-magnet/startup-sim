import { useReducer, useEffect, useRef, useState } from 'react';
import { gameReducer, initialState } from './reducer';
import Dashboard from './components/Dashboard';
import HRMS from './components/HRMS';
import BalanceSheet from './components/BalanceSheet';
import Projects from './components/Projects';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'projects', label: 'Projects' },
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
          if (e.key === 'Escape') {
            setDraft(name);
            setEditing(false);
          }
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.paused, state.speed, state.gameOver]);

  // Sync theme class on document root
  useEffect(() => {
    document.documentElement.className = `theme-${state.theme}`;
  }, [state.theme]);

  return (
    <div className="h-screen flex flex-col t-bg t-text">
      {/* Top Bar */}
      <div className="t-bg-card t-border border-b flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-6">
          <CompanyName name={state.companyName} dispatch={dispatch} />

          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
                className={`px-4 py-1.5 text-sm t-border border -ml-px first:ml-0 first:rounded-l last:rounded-r transition-colors ${
                  state.activeTab === tab.key
                    ? 't-bg-hover t-text'
                    : 't-text-secondary'
                }`}
                style={state.activeTab === tab.key ? { borderColor: 'rgba(59,130,246,0.4)' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time - prominent */}
          <div className="font-mono text-lg flex items-center gap-1 mr-2 t-bg-cell px-3 py-1 t-border border">
            <span className="t-text-muted">Y</span>
            <span className="font-bold text-xl t-text">{state.year}</span>
            <span className="t-text-muted mx-1">|</span>
            <span className="t-text-muted">W</span>
            <span className="font-bold text-xl t-text">
              {String(state.week).padStart(2, '0')}
            </span>
          </div>

          {/* Play/Pause - icon only */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={state.gameOver}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
              state.gameOver ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: state.paused ? '#00d26a' : '#ffc048',
              color: '#000',
            }}
            title={state.paused ? 'Play' : 'Pause'}
          >
            {state.paused ? '▶' : '⏸'}
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  state.speed === s
                    ? 'bg-accent-blue text-white'
                    : 't-text-muted'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Restart */}
          <button
            onClick={() => { if (confirm('Restart game? All progress will be lost.')) dispatch({ type: 'RESTART' }); }}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors t-text-muted"
            title="Restart game"
          >
            ↻
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors t-text-muted"
            title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {state.theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {state.activeTab === 'dashboard' && <Dashboard state={state} />}
        {state.activeTab === 'hrms' && <HRMS state={state} />}
        {state.activeTab === 'projects' && <Projects state={state} dispatch={dispatch} />}
        {state.activeTab === 'balance' && <BalanceSheet state={state} />}
      </div>
    </div>
  );
}
