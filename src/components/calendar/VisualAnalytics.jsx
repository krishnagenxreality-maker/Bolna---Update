import React from 'react';

const PIE_COLORS = ['#7dffb3', '#ff7070', '#f5c842', '#3b82f6'];

const ChartCard = ({ title, children, fullWidth }) => (
  <div style={{ 
    background: 'rgba(255, 255, 255, 0.02)', 
    border: '1px solid rgba(255, 255, 255, 0.06)', 
    borderRadius: '20px', 
    padding: '24px',
    backdropFilter: 'blur(10px)',
    gridColumn: fullWidth ? '1 / -1' : 'auto',
    position: 'relative'
  }}>
    <h4 style={{ 
      fontSize: '13px', 
      fontWeight: '600', 
      color: 'rgba(255,255,255,0.4)', 
      textTransform: 'uppercase', 
      letterSpacing: '1.5px', 
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ width: '4px', height: '14px', background: '#3b82f6', borderRadius: '2px' }} />
      {title}
    </h4>
    {children}
  </div>
);

const renderPieSlices = (data) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  let accumulated = 0;
  return Object.entries(data).map(([label, value], i) => {
    const percentage = (value / total) * 100;
    const dashArray = `${percentage} ${100 - percentage}`;
    const dashOffset = -accumulated;
    accumulated += percentage;
    return (
      <circle
        key={label}
        cx="16" cy="16" r="12"
        fill="transparent"
        stroke={PIE_COLORS[i]}
        strokeWidth="6"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        style={{ transition: 'all 1s ease' }}
      />
    );
  });
};

const renderLineChart = (data) => {
  if (data.length < 2) return <text x="400" y="100" fill="white" textAnchor="middle">Insufficient trend data</text>;
  const max = Math.max(...data.map(d => d.count), 5);
  const width = 800;
  const height = 200;
  const padding = 20;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d.count / max) * (height - padding * 2) + padding);
    return { x, y, date: d.date, count: d.count };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <g>
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <line 
          key={v} 
          x1="0" y1={height - (v * height)} 
          x2={width} y2={height - (v * height)} 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="1" 
        />
      ))}
      
      {/* Area under line */}
      <path d={areaD} fill="url(#lineGradient)" />
      
      {/* Line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#080808" strokeWidth="2" />
          <text x={p.x} y={height + 25} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle">
            {p.date.split('-').slice(1).join('/')}
          </text>
          <text x={p.x} y={p.y - 12} fill="white" fontSize="11" fontWeight="700" textAnchor="middle">
            {p.count}
          </text>
        </g>
      ))}
    </g>
  );
};

export const VisualAnalytics = ({ contacts }) => {
  // 1. Call Performance Data
  const perfData = {
    Completed: contacts.filter(c => c.status === 'completed' || c.status === 'called').length,
    Failed: contacts.filter(c => c.status === 'failed').length,
    Busy: contacts.filter(c => c.response?.toLowerCase().includes('busy')).length,
    NoAnswer: contacts.filter(c => c.response?.toLowerCase().includes('no answer') || c.response?.toLowerCase().includes('no_answer')).length,
  };

  // 2. Lead Classification Data
  const leadData = {
    Interested: contacts.filter(c => (c.leadCategory?.toLowerCase() === 'interested') || (c.classification?.toLowerCase() === 'interested')).length,
    Rescheduled: contacts.filter(c => (c.leadCategory?.toLowerCase() === 'reschedule') || (c.classification?.toLowerCase() === 'reschedule')).length,
    'Not Interested': contacts.filter(c => (c.leadCategory?.toLowerCase() === 'not_interested') || (c.classification?.toLowerCase() === 'not_interested')).length,
    Others: contacts.filter(c => c.leadCategory && !['interested', 'reschedule', 'not_interested'].includes(c.leadCategory.toLowerCase())).length
  };

  // 3. Call Trend (Grouped by date)
  const trendMap = contacts.reduce((acc, c) => {
    const d = c.date || c.createdAt?.split('T')[0];
    if (d) acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const trendData = Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7); // Last 7 days

  return (
    <div className="visual-analytics-section" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      
      {/* Bar Chart: Call Performance */}
      <ChartCard title="Call Performance">
        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 10px 40px', position: 'relative' }}>
          {Object.entries(perfData).map(([label, value]) => {
            const max = Math.max(...Object.values(perfData), 1);
            const height = (value / max) * 100;
            const color = label === 'Completed' ? '#7dffb3' : label === 'Failed' ? '#ff7070' : label === 'Busy' ? '#f5c842' : '#3b82f6';
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{value}</div>
                <div style={{ 
                  width: '100%', 
                  height: `${height}%`, 
                  background: `linear-gradient(to top, ${color}33, ${color})`,
                  borderRadius: '6px 6px 2px 2px',
                  boxShadow: `0 0 15px ${color}22`,
                  transition: 'height 1s ease-out'
                }} />
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '10px' }}>{label}</div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Pie Chart: Lead Classification */}
      <ChartCard title="Lead Classification">
        <div style={{ height: '240px', display: 'flex', alignItems: 'center', gap: '30px', padding: '20px' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
             <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {renderPieSlices(leadData)}
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{Object.values(leadData).reduce((a,b)=>a+b,0)}</span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Leads</span>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(leadData).map(([label, value], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PIE_COLORS[i] }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{label}: <strong>{value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Line Chart: Call Trend */}
      <ChartCard title="Call Trend (Last 7 Days)" fullWidth>
        <div style={{ height: '260px', padding: '20px 40px 40px' }}>
          <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {renderLineChart(trendData)}
          </svg>
        </div>
      </ChartCard>
    </div>
  );
};
