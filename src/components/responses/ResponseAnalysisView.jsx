import React from 'react';
import { Panel } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';

export const ResponseAnalysisView = ({ contacts, responseTab, setResponseTab }) => {
  const uniqueResponses = Array.from(new Set(contacts.map(c => c.response).filter(r => r))).sort();

  return (
    <div className="responses-view">
      <Panel label="Response Details Analysis">
        <div className="details-tabs" style={{flexWrap: 'wrap'}}>
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
            <div className="no-data" style={{padding: '10px 0'}}>No responses captured yet.</div>
          )}
        </div>

        {responseTab && (
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
          </div>
        )}
        {!responseTab && uniqueResponses.length > 0 && (
          <div className="no-data">Select a response sheet above to view details.</div>
        )}
      </Panel>
    </div>
  );
};
