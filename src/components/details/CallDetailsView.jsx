import React, { useMemo } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { DatePicker } from '../ui/DatePicker';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList 
} from 'lucide-react';

export const CallDetailsView = ({ 
  contacts, 
  searchDate, 
  setSearchDate, 
  detailsStatusTab, 
  setDetailsStatusTab,
  stats,
  activeView,
  setActiveView
}) => {
  const filteredData = useMemo(() => {
    return contacts.filter(c => {
      const statusMatch = detailsStatusTab === 'all' || c.status === detailsStatusTab;
      const dateMatch = !searchDate || c.date === searchDate;
      return statusMatch && dateMatch;
    });
  }, [contacts, detailsStatusTab, searchDate]);

  const trendData = useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      counts[c.date] = (counts[c.date] || 0) + 1;
    });
    return Object.keys(counts).sort().map(date => ({ date, count: counts[date] }));
  }, [contacts]);

  const statusData = useMemo(() => {
    const counts = { completed: 0, failed: 0, busy: 0, 'no answer': 0 };
    filteredData.forEach(c => {
      const s = c.status?.toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else if (s === 'called') counts.completed++;
    });
    return Object.keys(counts).map(status => ({ 
      status: status.charAt(0).toUpperCase() + status.slice(1), 
      count: counts[status] 
    }));
  }, [filteredData]);

  const chartTheme = {
    text: 'rgba(255,255,255,0.5)',
    grid: 'rgba(255,255,255,0.05)',
    tooltip: {
      contentStyle: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' },
      itemStyle: { color: '#fff' }
    }
  };

  const navItems = [
    { id: 'calendar', label: 'Dashboard', icon: <CalendarDays size={18} /> },
    { id: 'manager', label: 'Call Manager', icon: <PhoneCall size={18} /> },
    { id: 'details', label: 'Call Details', icon: <ListTodo size={18} /> },
    { id: 'responses', label: 'Responses', icon: <BarChart3 size={18} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={18} /> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  return (
    <div className="details-layout-wrapper">
      
      {/* LEFT COLUMN: 2x3 Navigation Grid */}
      <div className="details-left-column">
        <div className="details-nav-matrix">
          {navItems.map((item) => (
            <div 
              key={item.id}
              className={`nav-matrix-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <div className="nav-matrix-icon">{item.icon}</div>
              <span className="nav-matrix-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER COLUMN: Analytics */}
      <div className="details-center-column">
        <Panel label="Calling Activity Trend">
          <div className="panel-body" style={{ height: '240px', paddingTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel label="Status Breakdown">
          <div className="panel-body" style={{ height: '240px', paddingTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="status" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* RIGHT COLUMN: Search Table */}
      <div className="details-right-column">
        <Panel>
          <PanelHead>
            <div className="panel-label" style={{marginBottom:0}}>
              <span className="label-dot" />
              Call Details Search
            </div>
            <DatePicker value={searchDate} onChange={setSearchDate} />
          </PanelHead>

          <div className="panel-body">
            <div className="details-tabs">
              {['all', 'called', 'failed'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${detailsStatusTab === tab ? 'active' : ''}`}
                  onClick={() => setDetailsStatusTab(tab)}
                >
                  {tab === 'all' ? 'All Records' : tab === 'called' ? 'Called' : 'Failed'}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <table className="ct">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((c, i) => (
                    <tr key={c.id}>
                      <td className="td-num">{i + 1}</td>
                      <td className="td-name">{c.name}</td>
                      <td className="td-phone">{c.phone}</td>
                      <td>
                        <StatusPill status={c.status} />
                      </td>
                      <td className="td-response">{c.response || "-"}</td>
                      <td className="td-phone" style={{ fontSize: '11px' }}>{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                  No records found for the selected criteria.
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

    </div>
  );
};
