import React, { useState, useEffect } from 'react';
import { 
  Phone, Users, UserCheck, UserX, BarChart3, 
  ArrowUpRight, Clock, Calendar as CalendarIcon,
  MessageSquare, UserPlus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

export default function EducationDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalCalls: 0,
    totalLeads: 0,
    presentCount: 0,
    absentCount: 0,
    callVolume: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/education/dashboard-data/${user.userId}`);
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading Dashboard...</div>;
  }

  // Simple Line Chart Implementation using SVG
  const renderLineChart = () => {
    const chartData = data.callVolume || [];
    if (chartData.length === 0) return <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '40px' }}>No data available for last 7 days</div>;

    const width = 600;
    const height = 200;
    const padding = 40;
    const maxVal = Math.max(...chartData.map(d => d.count), 5); // Minimum scale of 5
    
    const points = chartData.map((d, i) => {
      const x = padding + (i * (width - 2 * padding) / (chartData.length - 1));
      const y = height - padding - (d.count * (height - 2 * padding) / maxVal);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Grids */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i * (height - 2 * padding) / 4);
          const val = Math.round(maxVal - (i * maxVal / 4));
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={padding - 10} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {chartData.map((d, i) => {
          const x = padding + (i * (width - 2 * padding) / (chartData.length - 1));
          return (
            <text key={i} x={x} y={height - padding + 20} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle">
              {d.date.split('-').slice(1).join('/')}
            </text>
          );
        })}

        {/* The Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {chartData.map((d, i) => {
          const x = padding + (i * (width - 2 * padding) / (chartData.length - 1));
          const y = height - padding - (d.count * (height - 2 * padding) / maxVal);
          return (
            <g key={i} className="chart-dot">
              <circle cx={x} cy={y} r="4" fill="#3b82f6" />
              <circle cx={x} cy={y} r="8" fill="#3b82f6" opacity="0.2" />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <MetricCard 
          icon={<Phone size={20} className="sn-blue" />} 
          title="Total Calls Made" 
          value={data.totalCalls} 
          trend="+12% from last week" 
        />
        <MetricCard 
          icon={<Users size={20} className="sn-purple" />} 
          title="Number of Leads" 
          value={data.totalLeads} 
          trend="Active leads" 
        />
        <MetricCard 
          icon={<UserCheck size={20} className="sn-green" />} 
          title="Students Present" 
          value={data.presentCount} 
          trend="Today" 
        />
        <MetricCard 
          icon={<UserX size={20} className="sn-red" />} 
          title="Students Absent" 
          value={data.absentCount} 
          trend="Today" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Call Volume Graph */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div className="panel-label">
              <div className="label-dot"></div>
              Call Volume (Last 7 Days)
            </div>
            <BarChart3 size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ padding: '0 20px 20px 0' }}>
            {renderLineChart()}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="panel-label">
              <div className="label-dot"></div>
              Recent Activity
            </div>
            <Clock size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.recentActivity.length > 0 ? data.recentActivity.map((activity, idx) => (
              <ActivityItem key={idx} activity={activity} />
            )) : (
              <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px' }}>No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({ icon, title, value, trend }) => (
  <div className="panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div className="logo-mark" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)' }}>
        {icon}
      </div>
      <ArrowUpRight size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
    </div>
    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{title}</div>
    <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{value}</div>
    <div style={{ color: trend.includes('red') || trend.includes('Absent') ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)', fontSize: '11px', fontWeight: '500' }}>
      {trend}
    </div>
  </div>
);

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'call': return <Phone size={14} />;
      case 'lead': return <UserPlus size={14} />;
      case 'appointment': return <CalendarIcon size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  const getLabelColor = (type) => {
    switch (type) {
      case 'call': return '#3b82f6';
      case 'lead': return '#a855f7';
      case 'appointment': return '#22c55e';
      default: return '#fff';
    }
  };

  const formattedDate = new Date(activity.date).toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ 
        width: '32px', height: '32px', borderRadius: '8px', 
        background: 'rgba(255,255,255,0.03)', color: getLabelColor(activity.type),
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {getIcon(activity.type)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{activity.type}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{formattedDate}</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.4' }}>{activity.description}</div>
      </div>
    </div>
  );
};
