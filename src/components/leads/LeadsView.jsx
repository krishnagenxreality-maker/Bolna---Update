import React, { useMemo } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { LEAD_CATEGORIES } from '../../utils/constants';
import { DatePicker } from '../ui/DatePicker';
import { Download } from 'lucide-react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export const LeadsView = ({ contacts, leadsStatusTab, setLeadsStatusTab, searchDate, setSearchDate }) => {
  const filteredContacts = useMemo(() => contacts.filter(c => !searchDate || c.date === searchDate), [contacts, searchDate]);
  const filteredLeads = useMemo(() => filteredContacts.filter(c => c.leadCategory === leadsStatusTab), [filteredContacts, leadsStatusTab]);

  const classificationData = useMemo(() => {
    const counts = { 'Interested': 0, 'Not Interested': 0, 'Rescheduled': 0 };
    filteredContacts.forEach(c => {
      if (c.leadCategory === 'interested') counts['Interested']++;
      else if (c.leadCategory === 'not_interested') counts['Not Interested']++;
      else if (c.leadCategory === 'reschedule') counts['Rescheduled']++;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [filteredContacts]);

  const leadsTrendData = useMemo(() => {
    const counts = {};
    // Show trend of all leads for the current agent context
    contacts.filter(c => c.leadCategory === 'interested').forEach(c => {
      counts[c.date] = (counts[c.date] || 0) + 1;
    });
    return Object.keys(counts).sort().map(date => ({ date, count: counts[date] }));
  }, [contacts]);

  const COLORS = ['#4ade80', '#f87171', '#fbbf24'];

  const chartTheme = {
    text: 'rgba(255,255,255,0.5)',
    grid: 'rgba(255,255,255,0.05)',
    tooltip: {
      contentStyle: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' },
      itemStyle: { color: '#fff' }
    }
  };

  const handleDownload = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to download for this selection.");
      return;
    }

    const headers = ['Name', 'Phone Number', 'Status', 'Response', 'Category', 'Date'];
    
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(c => [
        `"${c.name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.status || ''}"`,
        `"${(c.response || '').replace(/"/g, '""')}"`,
        `"${c.leadCategory || ''}"`,
        `"${c.date || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${searchDate || 'all'}_${leadsStatusTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="leads-view">
      <div className="analytics-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '24px' }}>
        <Panel label="Lead Classification">
          <div className="panel-body" style={{ height: '220px', paddingTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTheme.tooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel label="Leads Acquisition Trend">
          <div className="panel-body" style={{ height: '220px', paddingTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="date" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip {...chartTheme.tooltip} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            AI Lead Analysis
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleDownload}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Download size={14} /> Download Leads
            </button>
            <DatePicker value={searchDate} onChange={setSearchDate} />
          </div>
        </PanelHead>

        <div className="panel-body">
          <div className="details-tabs">
            {LEAD_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`tab-btn ${leadsStatusTab === cat.id ? 'active' : ''}`}
                onClick={() => setLeadsStatusTab(cat.id)}
              >
                {cat.label}
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
                  <th>Category</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-num">{i + 1}</td>
                    <td className="td-name">{c.name}</td>
                    <td className="td-phone">{c.phone}</td>
                    <td>
                      <StatusPill status={c.status} />
                    </td>
                    <td>
                      <span className={`spill s-${c.leadCategory === 'interested' ? 'done' : c.leadCategory === 'reschedule' ? 'queued' : 'pending'}`}>
                        {c.leadCategory.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="td-phone" style={{ fontSize: '11px' }}>{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="no-data">No records found in this category for the selected date.</div>
            )}
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: '1.6'
          }}>
            "After every month the leads data will be deleted, so please make sure that you download your data. Due to security reasons and because we value our customers, we do not store or access your data. Your data always remains with you."
          </div>
        </div>
      </Panel>
    </div>
  );
};

