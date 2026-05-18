import { useState } from 'react';
import type { PackageRow, RiskLevel } from '../types';
import { CVEDrawer } from './CVEDrawer';

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low      : '#22c55e',
  medium   : '#eab308',
  high     : '#f97316',
  critical : '#ef4444',
};

const LEVEL_ICON: Record<RiskLevel, string> = {
  low      : '🟢',
  medium   : '🟡',
  high     : '🟠',
  critical : '🔴',
};

function fmt(n: number | null, suffix = ''): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${n}${suffix}`;
}

export function PackageTable({ packages }: { packages: PackageRow[] }) {
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<RiskLevel | 'all'>('all');
  const [sortKey, setSortKey] = useState<keyof PackageRow>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<PackageRow | null>(null);

  const filtered = packages
    .filter(p => filter === 'all' || p.riskLevel === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'desc'
        ? (bv > av ? 1 : -1)
        : (av > bv ? 1 : -1);
    });

  function toggleSort(key: keyof PackageRow) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const th = (label: string, key: keyof PackageRow) => (
    <th
      onClick={() => toggleSort(key)}
      style={{
        padding    : '10px 14px',
        textAlign  : 'left',
        fontSize   : '12px',
        color      : sortKey === key ? '#7dd3fc' : '#64748b',
        cursor     : 'pointer',
        userSelect : 'none',
        whiteSpace : 'nowrap',
        borderBottom: '1px solid #2d2d3d',
      }}
    >
      {label} {sortKey === key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search packages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background   : '#13131f',
            border       : '1px solid #2d2d3d',
            borderRadius : '8px',
            padding      : '8px 14px',
            color        : '#e2e8f0',
            fontSize     : '13px',
            width        : '220px',
          }}
        />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            style={{
              background   : filter === level ? '#1e1e2e' : 'transparent',
              border       : `1px solid ${filter === level ? '#7dd3fc' : '#2d2d3d'}`,
              borderRadius : '8px',
              color        : filter === level ? '#7dd3fc' : '#64748b',
              cursor       : 'pointer',
              fontSize     : '12px',
              padding      : '6px 14px',
            }}
          >
            {level === 'all' ? 'All' : `${LEVEL_ICON[level]} ${level}`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', alignSelf: 'center' }}>
          {filtered.length} packages
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #2d2d3d' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: '#0d0d1a' }}>
            <tr>
              {th('Package',      'name')}
              {th('Version',      'version')}
              {th('Last Commit',  'daysSinceCommit')}
              {th('CVEs',         'cveCount')}
              {th('Bus Factor',   'busFactor')}
              {th('Downloads/wk', 'weeklyDownloads')}
              {th('Score',        'riskScore')}
              <th style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #2d2d3d' }}>
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pkg, i) => (
              <tr
                key={`${pkg.name}-${i}`}
                onClick={() => setSelected(pkg)}
                style={{
                  background     : i % 2 === 0 ? '#0a0a0f' : '#0d0d1a',
                  cursor         : 'pointer',
                  borderBottom   : '1px solid #1a1a2e',
                  transition     : 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#0a0a0f' : '#0d0d1a')}
              >
                <td style={{ padding: '10px 14px', color: '#e2e8f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pkg.name}
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace' }}>
                  {pkg.version}
                </td>
                <td style={{ padding: '10px 14px', color: pkg.daysSinceCommit && pkg.daysSinceCommit > 365 ? '#ef4444' : '#94a3b8' }}>
                  {pkg.daysSinceCommit !== null ? `${pkg.daysSinceCommit}d` : '—'}
                </td>
                <td style={{ padding: '10px 14px', color: pkg.cveCount > 0 ? '#ef4444' : '#22c55e', fontWeight: pkg.cveCount > 0 ? 600 : 400 }}>
                  {pkg.cveCount}
                  {pkg.maxCvssScore ? ` (${pkg.maxCvssScore})` : ''}
                </td>
                <td style={{ padding: '10px 14px', color: pkg.busFactor <= 1 ? '#ef4444' : pkg.busFactor <= 2 ? '#f97316' : '#22c55e' }}>
                  {pkg.busFactor}
                </td>
                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                  {fmt(pkg.weeklyDownloads)}
                </td>
                <td style={{ padding: '10px 14px', color: LEVEL_COLOR[pkg.riskLevel], fontWeight: 600 }}>
                  {pkg.riskScore}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    background   : `${LEVEL_COLOR[pkg.riskLevel]}22`,
                    border       : `1px solid ${LEVEL_COLOR[pkg.riskLevel]}44`,
                    borderRadius : '6px',
                    color        : LEVEL_COLOR[pkg.riskLevel],
                    fontSize     : '11px',
                    fontWeight   : 600,
                    padding      : '3px 8px',
                  }}>
                    {LEVEL_ICON[pkg.riskLevel]} {pkg.riskLevel.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <CVEDrawer pkg={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}