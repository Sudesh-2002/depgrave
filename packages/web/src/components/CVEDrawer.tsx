import type { PackageRow } from '../types';

export function CVEDrawer({
  pkg,
  onClose,
}: {
  pkg     : PackageRow;
  onClose : () => void;
}) {
  return (
    <div style={{
      position   : 'fixed',
      inset      : 0,
      background : 'rgba(0,0,0,0.7)',
      zIndex     : 50,
      display    : 'flex',
      alignItems : 'flex-end',
    }}
      onClick={onClose}
    >
      <div
        style={{
          background   : '#13131f',
          border       : '1px solid #2d2d3d',
          borderRadius : '16px 16px 0 0',
          padding      : '24px',
          width        : '100%',
          maxHeight    : '60vh',
          overflowY    : 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{pkg.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>v{pkg.version}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background   : 'transparent',
              border       : '1px solid #2d2d3d',
              borderRadius : '8px',
              color        : '#94a3b8',
              cursor       : 'pointer',
              padding      : '6px 12px',
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          display             : 'grid',
          gridTemplateColumns : 'repeat(4, 1fr)',
          gap                 : '12px',
          marginBottom        : '20px',
        }}>
          {[
            { label: 'Risk Score',   value: `${pkg.riskScore}/100` },
            { label: 'Days Stale',   value: pkg.daysSinceCommit ?? '—' },
            { label: 'Bus Factor',   value: pkg.busFactor },
            { label: 'Open CVEs',    value: pkg.cveCount },
          ].map(stat => (
            <div key={stat.label} style={{
              background   : '#0a0a0f',
              borderRadius : '8px',
              padding      : '12px',
              textAlign    : 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{stat.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {pkg.cveCount === 0 ? (
          <div style={{ color: '#22c55e', fontSize: '14px' }}>
            ✅ No known CVEs for this version.
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            CVE details are available in the JSON report. Open{' '}
            <code style={{ color: '#7dd3fc' }}>report.json</code> and search for{' '}
            <code style={{ color: '#7dd3fc' }}>{pkg.name}</code> to see full CVE list.
          </div>
        )}
      </div>
    </div>
  );
}