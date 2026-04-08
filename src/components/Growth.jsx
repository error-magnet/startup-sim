import { useState, useEffect } from 'react';
import { calcRetentionRate, calcChurnRate, getProductUserStats } from '../reducer';
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

function ProductPanel({ product, dispatch, sym }) {
  const fmt = (v) => formatCR(v, sym);
  const cfg = product.config;
  const stats = getProductUserStats(product);
  const retentionRate = calcRetentionRate(cfg, product.monthlyPrice);
  const churnRate = calcChurnRate(cfg, product.monthlyPrice);
  const monthlyRevenue = stats.payingUsers * product.monthlyPrice;
  const monthlyInfra = cfg.infraBaseCost + stats.totalActive * cfg.infraCostPerUser;
  const monthlyPnL = monthlyRevenue - monthlyInfra;
  const mrr = stats.payingUsers * product.monthlyPrice;
  const lm = product.lastMonthStats;
  const netChange = lm.converted - lm.churned;

  return (
    <div className="flex flex-col gap-3">
      {/* Product header */}
      <div className="t-bg-card t-border border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold t-text">{product.name}</span>
          <span className="text-xs t-text-muted">({product.type})</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {product.launchedWeek && (
            <span className="t-text-muted font-mono text-xs">
              Launched Y{Math.ceil(product.launchedWeek / 52)} W{((product.launchedWeek - 1) % 52) + 1}
            </span>
          )}
          <span className="text-accent-green">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pricing */}
        <div className="t-bg-card t-border border overflow-hidden">
          <table className="sheet w-full text-sm">
            <thead><tr><th colSpan={2}>Pricing</th></tr></thead>
            <tbody>
              <tr>
                <td className="t-text-secondary">Monthly Price</td>
                <td className="text-right">
                  <span className="t-text-muted mr-1">{sym}</span>
                  <PriceInput
                    value={product.monthlyPrice}
                    onChange={(p) => dispatch({ type: 'SET_PRICE', productId: product.id, price: p })}
                  />
                </td>
              </tr>
              <tr>
                <td className="t-text-secondary">Retention Rate</td>
                <td className="text-right font-mono">{(retentionRate * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Churn Rate</td>
                <td className="text-right font-mono">{(churnRate * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Revenue */}
        <div className="t-bg-card t-border border overflow-hidden">
          <table className="sheet w-full text-sm">
            <thead><tr><th colSpan={2}>Revenue</th></tr></thead>
            <tbody>
              <tr>
                <td className="t-text-secondary">MRR</td>
                <td className="text-right text-accent-green font-mono font-semibold">{fmt(mrr)}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Monthly Rev</td>
                <td className="text-right text-accent-green font-mono">{fmt(monthlyRevenue)}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Total Rev</td>
                <td className="text-right text-accent-green font-mono">{fmt(product.financials.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Users */}
        <div className="t-bg-card t-border border overflow-hidden">
          <table className="sheet w-full text-sm">
            <thead><tr><th colSpan={2}>Users</th></tr></thead>
            <tbody>
              <tr>
                <td className="t-text-secondary">On Free Trial</td>
                <td className="text-right font-mono">{stats.trialUsers}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Paying Users</td>
                <td className="text-right text-accent-green font-mono">{stats.payingUsers}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Total Active</td>
                <td className="text-right font-semibold font-mono">{stats.totalActive}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Costs */}
        <div className="t-bg-card t-border border overflow-hidden">
          <table className="sheet w-full text-sm">
            <thead><tr><th colSpan={2}>Costs</th></tr></thead>
            <tbody>
              <tr>
                <td className="t-text-secondary">Infra Cost</td>
                <td className="text-right text-accent-red font-mono">{fmt(monthlyInfra)}/mo</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Total Infra</td>
                <td className="text-right text-accent-red font-mono">{fmt(product.financials.totalInfraCost)}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Monthly P&L</td>
                <td className={`text-right font-semibold font-mono ${monthlyPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {fmt(monthlyPnL)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Last Month */}
        <div className="t-bg-card t-border border overflow-hidden">
          <table className="sheet w-full text-sm">
            <thead><tr><th colSpan={2}>Last Month</th></tr></thead>
            <tbody>
              <tr>
                <td className="t-text-secondary">New Signups</td>
                <td className="text-right font-mono">{lm.signups}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Converted</td>
                <td className="text-right text-accent-green font-mono">{lm.converted}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Churned</td>
                <td className="text-right text-accent-red font-mono">{lm.churned}</td>
              </tr>
              <tr>
                <td className="t-text-secondary">Net Change</td>
                <td className={`text-right font-semibold font-mono ${netChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Growth({ state, dispatch }) {
  if (state.products.length === 0) {
    return (
      <div className="p-3">
        <div className="t-bg-card t-border border px-4 py-8 text-center">
          <div className="t-text-muted text-sm">
            No live products yet. Ship an MVP from the Projects tab first.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      {state.products.map((product) => (
        <ProductPanel key={product.id} product={product} dispatch={dispatch} sym={state.currency.symbol} />
      ))}
    </div>
  );
}
