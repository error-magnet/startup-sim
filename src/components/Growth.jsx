import { useState, useRef, useEffect } from 'react';
import { calcConversionRate, getProductUserStats, isInfraOperational } from '../reducer';
import { formatCR } from '../helpers';

function PriceInput({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) onChange(Math.round(n * 100) / 100);
    else setDraft(String(value));
  };

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      className="w-16 bg-transparent t-border border px-2 py-0.5 text-right font-mono text-sm t-text outline-none focus:border-accent-blue"
    />
  );
}

export default function Growth({ state, dispatch }) {
  const appify = state.products.find((p) => p.id === 'appify');

  if (appify.phase !== 'production') {
    return (
      <div className="p-4">
        <div className="t-bg-card t-border border rounded px-4 py-8 text-center">
          <div className="t-text-muted font-mono text-sm">
            {appify.name} is still in development. Growth data will appear once the product is live.
          </div>
        </div>
      </div>
    );
  }

  const cfg = appify.revenueConfig;
  const stats = getProductUserStats(appify);
  const operational = isInfraOperational(appify);
  const conversionRate = calcConversionRate(cfg);
  const weeklyRevenue = (stats.payingUsers * cfg.monthlyPrice) / 4;
  const weeklyInfra = cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
  const weeklyProfit = weeklyRevenue - weeklyInfra;
  const mrr = stats.payingUsers * cfg.monthlyPrice;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Product header */}
      <div className="t-bg-card t-border border rounded px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold t-text text-base font-mono">{appify.name}</span>
          <span className="text-xs t-text-muted">({appify.type})</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-sm">
          {appify.launchedWeek && (
            <span className="t-text-muted">
              Launched Y{Math.ceil(appify.launchedWeek / 52)} W{((appify.launchedWeek - 1) % 52) + 1}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            operational ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
          }`}>{operational ? 'Live' : 'Infra Understaffed'}</span>
        </div>
      </div>

      {!operational && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded px-4 py-2 text-sm font-mono text-accent-red">
          Infrastructure is understaffed. No signups or revenue until at least {appify.infraMinStaff} people are assigned. Go to Projects tab to staff.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Pricing */}
        <div className="t-bg-card t-border border rounded p-4">
          <div className="text-xs t-text-secondary uppercase tracking-wider mb-3">Pricing</div>
          <table className="text-sm font-mono w-full">
            <tbody>
              <tr>
                <td className="py-1.5 t-text-secondary">Monthly Price</td>
                <td className="py-1.5 text-right">
                  <span className="t-text-muted mr-1">CR</span>
                  <PriceInput
                    value={cfg.monthlyPrice}
                    onChange={(p) => dispatch({ type: 'SET_PRICE', productId: 'appify', price: p })}
                  />
                </td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Conversion Rate</td>
                <td className="py-1.5 text-right t-text">{(conversionRate * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Free Trial</td>
                <td className="py-1.5 text-right t-text">{cfg.freeTrialWeeks} weeks</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Monthly Churn</td>
                <td className="py-1.5 text-right t-text">{(cfg.monthlyChurnRate * 100).toFixed(0)}%</td>
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
                <td className="py-1.5 t-text-secondary">Infra Cost</td>
                <td className="py-1.5 text-right text-accent-red">{formatCR(weeklyInfra)}/wk</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Weekly Revenue</td>
                <td className="py-1.5 text-right text-accent-green">{formatCR(weeklyRevenue)}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Weekly Profit</td>
                <td className={`py-1.5 text-right font-semibold ${weeklyProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatCR(weeklyProfit)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">MRR</td>
                <td className="py-1.5 text-right text-accent-green font-semibold">{formatCR(mrr)}</td>
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
                <td className="py-1.5 t-text-secondary">New Signups</td>
                <td className="py-1.5 text-right t-text">{cfg.signupsPerMonth}/mo</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">On Free Trial</td>
                <td className="py-1.5 text-right t-text">{stats.trialUsers}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Paying Users</td>
                <td className="py-1.5 text-right text-accent-green">{stats.payingUsers}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Total Active</td>
                <td className="py-1.5 text-right t-text font-semibold">{stats.totalActive}</td>
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
                <td className="py-1.5 t-text-secondary">Total Revenue</td>
                <td className="py-1.5 text-right text-accent-green">{formatCR(appify.financials.totalRevenue)}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Total Dev Cost</td>
                <td className="py-1.5 text-right text-accent-red">{formatCR(appify.financials.totalDevCost)}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Total Infra</td>
                <td className="py-1.5 text-right text-accent-red">{formatCR(appify.financials.totalInfraCost)}</td>
              </tr>
              <tr>
                <td className="py-1.5 t-text-secondary">Net from {appify.name}</td>
                <td className={`py-1.5 text-right font-semibold ${
                  appify.financials.totalRevenue - appify.financials.totalDevCost - appify.financials.totalInfraCost >= 0
                    ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  {formatCR(appify.financials.totalRevenue - appify.financials.totalDevCost - appify.financials.totalInfraCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
