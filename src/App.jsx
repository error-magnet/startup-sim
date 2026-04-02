import { useReducer, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './reducer';
import Dashboard from './components/Dashboard';
import HRMS from './components/HRMS';
import BalanceSheet from './components/BalanceSheet';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'balance', label: 'Balance Sheet' },
];

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!state.paused && !state.gameOver) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000 / state.speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.paused, state.speed, state.gameOver]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-bg-card border-b border-bg-border flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-bold text-accent-cyan tracking-wider text-sm">
            STARTUP<span className="text-txt-muted">.SIM</span>
          </span>

          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
                className={`px-4 py-1.5 text-sm border border-bg-border -ml-px first:ml-0 first:rounded-l last:rounded-r transition-colors ${
                  state.activeTab === tab.key
                    ? 'bg-bg-hover text-txt-primary border-accent-blue/40'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Speed controls */}
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_SPEED', speed: s })}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  state.speed === s
                    ? 'bg-accent-blue text-white'
                    : 'text-txt-muted hover:text-txt-secondary'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Time */}
          <div className="font-mono text-sm flex items-center gap-2">
            <span className="text-txt-muted">Y</span>
            <span className="text-txt-primary font-semibold">{state.year}</span>
            <span className="text-txt-muted">W</span>
            <span className="text-txt-primary font-semibold">
              {String(state.week).padStart(2, '0')}
            </span>
          </div>

          {/* Pause/Play */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={state.gameOver}
            className={`px-4 py-1 rounded text-sm font-semibold transition-colors ${
              state.paused
                ? 'bg-accent-green text-black hover:bg-accent-green/80'
                : 'bg-accent-yellow/80 text-black hover:bg-accent-yellow'
            } ${state.gameOver ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {state.paused ? '▶ PLAY' : '⏸ PAUSE'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {state.activeTab === 'dashboard' && <Dashboard state={state} />}
        {state.activeTab === 'hrms' && <HRMS state={state} />}
        {state.activeTab === 'balance' && <BalanceSheet state={state} />}
      </div>
    </div>
  );
}
