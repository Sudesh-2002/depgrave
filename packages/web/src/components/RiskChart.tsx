import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import type { Report } from '../types';

const COLORS = {
  critical : '#ef4444',
  high     : '#f97316',
  medium   : '#eab308',
  low      : '#22c55e',
};

export function RiskChart({ report }: { report: Report }) {
  const pieData = Object.entries(report.summary)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const top10 = [...report.packages]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  return (
    <div style={{
      display             : 'grid',
      gridTemplateColumns : '1fr 2fr',
      gap                 : '16px',
      marginBottom        : '24px',
    }}>
      <div style={{
        background   : '#13131f',
        border       : '1px solid #2d2d3d',
        borderRadius : '12px',
        padding      : '20px',
      }}>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          Risk distribution
        </div>
        <PieChart width={200} height={200}>
          <Pie
            data={pieData}
            cx={100} cy={100}
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map(entry => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #2d2d3d', borderRadius: '8px' }}
            labelStyle={{ color: '#e2e8f0' }}
          />
        </PieChart>
      </div>

      <div style={{
        background   : '#13131f',
        border       : '1px solid #2d2d3d',
        borderRadius : '12px',
        padding      : '20px',
      }}>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          Top 10 riskiest packages
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={top10} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
            />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #2d2d3d', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="riskScore" radius={[0, 4, 4, 0]}>
              {top10.map(entry => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.riskLevel]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}