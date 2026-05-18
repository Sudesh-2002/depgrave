import type { Report } from '../types';

const CARDS = [
  { key: 'critical', label: 'Critical', color: '#ef4444', bg: '#2d1515' },
  { key: 'high',     label: 'High',     color: '#f97316', bg: '#2d1a0f' },
  { key: 'medium',   label: 'Medium',   color: '#eab308', bg: '#2d2710' },
  { key: 'low',      label: 'Low',      color: '#22c55e', bg: '#0f2d1a' },
] as const;

export function SummaryCards({ report }: { report: Report }) {
  return (
    <div style={{
      display              : 'grid',
      gridTemplateColumns  : 'repeat(auto-fit, minmax(160px, 1fr))',
      gap                  : '12px',
      marginBottom         : '24px',
    }}>
      {CARDS.map(card => (
        <div key={card.key} style={{
          background   : card.bg,
          border       : `1px solid ${card.color}33`,
          borderRadius : '12px',
          padding      : '16px 20px',
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            {card.label}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: card.color }}>
            {report.summary[card.key]}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            packages
          </div>
        </div>
      ))}

      <div style={{
        background   : '#13131f',
        border       : '1px solid #2d2d3d',
        borderRadius : '12px',
        padding      : '16px 20px',
      }}>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
          Total scanned
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#e2e8f0' }}>
          {report.total}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          packages
        </div>
      </div>
    </div>
  );
}