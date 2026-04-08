import { useState } from 'react';

function NumberField({ label, value, onChange, step = 1, min, max, suffix }) {
  return (
    <tr>
      <td className="t-text-secondary text-sm pr-3 py-0.5 whitespace-nowrap">{label}</td>
      <td className="text-right py-0.5">
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(v);
            }}
            step={step}
            min={min}
            max={max}
            className="w-28 bg-transparent t-border border px-2 py-0.5 text-right font-mono text-sm t-text outline-none focus:border-accent-blue"
          />
          {suffix && <span className="t-text-muted text-xs">{suffix}</span>}
        </div>
      </td>
    </tr>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="t-bg-card t-border border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-1.5 text-sm font-semibold t-text flex items-center justify-between hover:t-bg-hover transition-colors"
      >
        {title}
        <span className="t-text-muted text-xs">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

const CURRENCIES = [
  { symbol: '₹', name: 'Rupee' },
  { symbol: '$', name: 'Dollar' },
  { symbol: '€', name: 'Euro' },
  { symbol: '£', name: 'Pound' },
  { symbol: '¥', name: 'Yen' },
];

export default function Admin({ state, dispatch }) {
  const set = (path, value) => dispatch({ type: 'ADMIN_SET', path, value });
  const sym = state.currency.symbol;

  return (
    <div className="p-4 flex flex-col gap-3 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent-yellow font-mono text-sm font-bold">ADMIN</span>
        <span className="t-text-muted text-xs">Tweak game parameters in real time</span>
      </div>

      {/* Currency */}
      <Section title="Currency">
        <div className="flex gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.symbol}
              onClick={() => dispatch({ type: 'SET_CURRENCY', currency: c })}
              className={`px-3 py-1 text-sm font-mono t-border border transition-colors ${
                state.currency.symbol === c.symbol ? 'bg-accent-blue text-white' : 't-text-secondary'
              }`}
            >
              {c.symbol} {c.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Game State */}
      <Section title="Game State">
        <table className="sheet w-full">
          <tbody>
            <NumberField label="Bank" value={state.bank} onChange={(v) => set(['bank'], v)} step={10000} suffix={sym} />
            <NumberField label="Week" value={state.week} onChange={(v) => set(['week'], v)} min={1} max={52} />
            <NumberField label="Year" value={state.year} onChange={(v) => set(['year'], v)} min={1} />
            <NumberField label="Total Weeks" value={state.totalWeeks} onChange={(v) => set(['totalWeeks'], v)} min={1} />
          </tbody>
        </table>
      </Section>

      {/* Products */}
      {state.products.map((product) => (
        <Section key={product.id} title={`Product: ${product.name}`} defaultOpen={false}>
          <table className="sheet w-full">
            <tbody>
              <NumberField
                label="Monthly Price"
                value={product.monthlyPrice}
                onChange={(v) => set(['products', product.id, 'monthlyPrice'], v)}
                step={1}
                min={0}
                suffix={sym}
              />
              <NumberField
                label="Signups / Month"
                value={product.config.signupsPerMonth}
                onChange={(v) => set(['products', product.id, 'config', 'signupsPerMonth'], v)}
                min={0}
              />
              <NumberField
                label="Base Retention Rate"
                value={product.config.baseRetentionRate}
                onChange={(v) => set(['products', product.id, 'config', 'baseRetentionRate'], v)}
                step={0.01}
                min={0}
                max={1}
              />
              <NumberField
                label="Base Price"
                value={product.config.basePrice}
                onChange={(v) => set(['products', product.id, 'config', 'basePrice'], v)}
                step={1}
                min={0}
                suffix={sym}
              />
              <NumberField
                label="Retention Drop / price unit"
                value={product.config.retentionDropPerCR}
                onChange={(v) => set(['products', product.id, 'config', 'retentionDropPerCR'], v)}
                step={0.01}
                min={0}
              />
              <NumberField
                label="Retention Gain / price unit"
                value={product.config.retentionGainPerCR}
                onChange={(v) => set(['products', product.id, 'config', 'retentionGainPerCR'], v)}
                step={0.01}
                min={0}
              />
              <NumberField
                label="Base Churn Rate"
                value={product.config.baseChurnRate}
                onChange={(v) => set(['products', product.id, 'config', 'baseChurnRate'], v)}
                step={0.01}
                min={0}
                max={1}
              />
              <NumberField
                label="Churn Increase / price unit"
                value={product.config.churnIncreasePerCR}
                onChange={(v) => set(['products', product.id, 'config', 'churnIncreasePerCR'], v)}
                step={0.01}
                min={0}
              />
              <NumberField
                label="Churn Decrease / price unit"
                value={product.config.churnDecreasePerCR}
                onChange={(v) => set(['products', product.id, 'config', 'churnDecreasePerCR'], v)}
                step={0.01}
                min={0}
              />
              <NumberField
                label="Free Trial Weeks"
                value={product.config.freeTrialWeeks}
                onChange={(v) => set(['products', product.id, 'config', 'freeTrialWeeks'], v)}
                min={0}
              />
              <NumberField
                label="Weekly Variance"
                value={product.config.weeklyVariance}
                onChange={(v) => set(['products', product.id, 'config', 'weeklyVariance'], v)}
                step={0.01}
                min={0}
              />
              <NumberField
                label="Infra Cost / User"
                value={product.config.infraCostPerUser}
                onChange={(v) => set(['products', product.id, 'config', 'infraCostPerUser'], v)}
                step={0.1}
                min={0}
                suffix={sym}
              />
              <NumberField
                label="Infra Base Cost"
                value={product.config.infraBaseCost}
                onChange={(v) => set(['products', product.id, 'config', 'infraBaseCost'], v)}
                step={50}
                min={0}
                suffix={sym}
              />
            </tbody>
          </table>
        </Section>
      ))}

      {/* Dev Projects */}
      {state.devProjects.filter((p) => p.status === 'Active').map((proj) => (
        <Section key={proj.id} title={`Project: ${proj.name}`} defaultOpen={false}>
          <table className="sheet w-full">
            <tbody>
              <NumberField
                label="Project Cost / Month"
                value={proj.devCostPerMonth}
                onChange={(v) => set(['devProjects', proj.id, 'devCostPerMonth'], v)}
                step={100}
                min={0}
                suffix={sym}
              />
            </tbody>
          </table>
          {proj.epics.map((epic) => (
            <div key={epic.id} className="mt-2">
              <div className="text-xs t-text-muted mb-1 font-mono">{epic.name}</div>
              <table className="sheet w-full">
                <tbody>
                  <NumberField
                    label="Total Work"
                    value={epic.totalWork}
                    onChange={(v) => set(['epics', proj.id, epic.id, 'totalWork'], v)}
                    min={1}
                  />
                  <NumberField
                    label="Work Completed"
                    value={epic.workCompleted}
                    onChange={(v) => set(['epics', proj.id, epic.id, 'workCompleted'], v)}
                    min={0}
                    max={epic.totalWork}
                  />
                  <NumberField
                    label="Base Headcount"
                    value={epic.baseHeadcount}
                    onChange={(v) => set(['epics', proj.id, epic.id, 'baseHeadcount'], v)}
                    min={1}
                  />
                </tbody>
              </table>
            </div>
          ))}
        </Section>
      ))}

      {/* Employees */}
      <Section title="Employees" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          {state.employees.filter((e) => e.status === 'Active').map((emp) => (
            <div key={emp.id} className="t-border border-b pb-2 last:border-b-0">
              <div className="text-xs font-mono t-text mb-1">{emp.name}</div>
              <table className="sheet w-full">
                <tbody>
                  <NumberField
                    label="Salary"
                    value={emp.salary}
                    onChange={(v) => set(['employees', emp.id, 'salary'], v)}
                    step={1000}
                    min={0}
                    suffix={`${sym}/mo`}
                  />
                  <NumberField
                    label="Happiness"
                    value={emp.happiness}
                    onChange={(v) => set(['employees', emp.id, 'happiness'], v)}
                    min={0}
                    max={100}
                  />
                  <NumberField
                    label="Salary Priority"
                    value={emp.personality.salaryPriority}
                    onChange={(v) => set(['employees', emp.id, 'personality', 'salaryPriority'], v)}
                    min={1}
                    max={10}
                  />
                  <NumberField
                    label="Restlessness"
                    value={emp.personality.restlessness}
                    onChange={(v) => set(['employees', emp.id, 'personality', 'restlessness'], v)}
                    min={1}
                    max={10}
                  />
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
