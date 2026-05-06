import React, { useMemo } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { DatePicker } from '../ui/DatePicker';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export const ResponseAnalysisView = ({ contacts, responseTab, setResponseTab, searchDate, setSearchDate }) => {
  const filteredContacts = useMemo(() => contacts.filter(c => !searchDate || c.date === searchDate), [contacts, searchDate]);
  const uniqueResponses = useMemo(() => Array.from(new Set(filteredContacts.map(c => c.response).filter(r => r))).sort(), [filteredContacts]);

  const distributionData = useMemo(() => {
    const counts = { 'Interested': 0, 'Not Interested': 0, 'Reschedule': 0, 'No Response': 0 };
    filteredContacts.forEach(c => {
      const cat = c.leadCategory || c.classification || 'No Response';
      const key = cat.includes('Not') ? 'Not Interested' : cat.includes('Reschedule') ? 'Reschedule' : cat.includes('Interested') ? 'Interested' : 'No Response';
      counts[key]++;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [filteredContacts]);

  const responseCountData = useMemo(() => {
    const counts = {};
    filteredContacts.forEach(c => {
      if (c.response) counts[c.response] = (counts[c.response] || 0) + 1;
    });
    return Object.keys(counts).map(resp => ({ name: resp, count: counts[resp] }));
  }, [filteredContacts]);

  const COLORS = ['#4ade80', '#f87171', '#fbbf24', '#60a5fa'];

  const chartTheme = {
    text: 'rgba(255,255,255,0.5)',
    grid: 'rgba(255,255,255,0.05)',
    tooltip: {
      contentStyle: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' },
      itemStyle: { color: '#fff' }
    }
  };

  return (
    <div className="responses-view">
      <div className="analytics-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '24px' }}>
        <Panel label="Response Distribution">
          <div className="panel-body" style={{ height: '240px', paddingTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTheme.tooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel label="Detailed Response Count">
          <div className="panel-body" style={{ height: '240px', paddingTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseCountData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                <XAxis type="number" stroke={chartTheme.text} fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke={chartTheme.text} fontSize={10} width={80} tickLine={false} />
                <Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            Response Details Analysis
          </div>
          <DatePicker value={searchDate} onChange={setSearchDate} />
        </PanelHead>

        <div className="panel-body">
          <div className="details-tabs">
            {uniqueResponses.map(resp => (
              <button
                key={resp}
                className={`tab-btn ${responseTab === resp ? 'active' : ''}`}
                onClick={() => setResponseTab(resp)}
              >
                {resp.toUpperCase()}
              </button>
            ))}
            {uniqueResponses.length === 0 && (
              <div className="no-data">No responses captured for this date.</div>
            )}
          </div>

          {responseTab && (
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
                  {filteredContacts
                    .filter(c => c.response === responseTab)
                    .map((c, i) => (
                      <tr key={c.id}>
                        <td className="td-num">{i + 1}</td>
                        <td className="td-name">{c.name}</td>
                        <td className="td-phone">{c.phone}</td>
                        <td>
                          <StatusPill status={c.status} />
                        </td>
                        <td className="td-response">{c.response}</td>
                        <td className="td-phone" style={{ fontSize: '11px' }}>{c.date}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {filteredContacts.filter(c => c.response === responseTab).length === 0 && (
                <div className="no-data">No records found for the selected response and date.</div>
              )}
            </div>
          )}
          {!responseTab && uniqueResponses.length > 0 && (
            <div className="no-data">Select a response sheet above to view details.</div>
          )}
        </div>
      </Panel>
    </div>
  );
};

