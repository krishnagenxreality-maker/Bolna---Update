import React from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';

export const CallDetailsView = ({ contacts, searchDate, setSearchDate, detailsStatusTab, setDetailsStatusTab }) => {
  return (
    <div className="details-view">
      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            Call Details Search
          </div>
          <div className="search-box">
            <span className="search-icon">📅</span>
            <input
              type="date"
              className="search-input"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
            />
          </div>
        </PanelHead>

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

        <div className="table-wrap" style={{marginTop: '20px'}}>
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
              {contacts
                .filter(c => {
                  const statusMatch = detailsStatusTab === 'all' || c.status === detailsStatusTab;
                  const dateMatch = !searchDate || c.date === searchDate;
                  return statusMatch && dateMatch;
                })
                .map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-num">{i+1}</td>
                    <td className="td-name">{c.name}</td>
                    <td className="td-phone">{c.phone}</td>
                    <td>
                      <StatusPill status={c.status} />
                    </td>
                    <td className="td-response">{c.response || "-"}</td>
                    <td className="td-phone" style={{fontSize: '11px'}}>{c.date}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          {contacts.filter(c => {
            const statusMatch = detailsStatusTab === 'all' || c.status === detailsStatusTab;
            const dateMatch = !searchDate || c.date === searchDate;
            return statusMatch && dateMatch;
          }).length === 0 && (
            <div className="no-data">No records found for the selected date and status.</div>
          )}
        </div>
      </Panel>
    </div>
  );
};
