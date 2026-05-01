import React from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { LEAD_CATEGORIES } from '../../utils/constants';
import { DatePicker } from '../ui/DatePicker';

export const LeadsView = ({ contacts, leadsStatusTab, setLeadsStatusTab, searchDate, setSearchDate }) => {
  const filteredContacts = contacts.filter(c => !searchDate || c.date === searchDate);
  const filteredLeads = filteredContacts.filter(c => c.leadCategory === leadsStatusTab);

  return (
    <div className="leads-view">
      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            AI Lead Analysis
          </div>
          <DatePicker value={searchDate} onChange={setSearchDate} />
        </PanelHead>

        <div className="details-tabs" style={{padding: '0 20px', marginTop: '20px'}}>
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

        <div className="table-wrap" style={{ marginTop: '20px', padding: '0 20px' }}>
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
          margin: '0 20px 20px',
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
      </Panel>
    </div>
  );
};

