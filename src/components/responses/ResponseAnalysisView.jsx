import React from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { DatePicker } from '../ui/DatePicker';

export const ResponseAnalysisView = ({ contacts, responseTab, setResponseTab, searchDate, setSearchDate }) => {
  const filteredContacts = contacts.filter(c => !searchDate || c.date === searchDate);
  const uniqueResponses = Array.from(new Set(filteredContacts.map(c => c.response).filter(r => r))).sort();

  return (
    <div className="responses-view">
      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            Response Details Analysis
          </div>
          <DatePicker value={searchDate} onChange={setSearchDate} />
        </PanelHead>

        <div className="details-tabs" style={{flexWrap: 'wrap', padding: '0 20px', marginTop: '20px'}}>
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
            <div className="no-data" style={{padding: '10px 0'}}>No responses captured for this date.</div>
          )}
        </div>

        {responseTab && (
          <div className="table-wrap" style={{marginTop: '20px', padding: '0 20px 20px'}}>
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
                      <td className="td-num">{i+1}</td>
                      <td className="td-name">{c.name}</td>
                      <td className="td-phone">{c.phone}</td>
                      <td>
                        <StatusPill status={c.status} />
                      </td>
                      <td className="td-response">{c.response}</td>
                      <td className="td-phone" style={{fontSize: '11px'}}>{c.date}</td>
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
          <div className="no-data" style={{padding: '0 20px 20px'}}>Select a response sheet above to view details.</div>
        )}
      </Panel>
    </div>
  );
};

