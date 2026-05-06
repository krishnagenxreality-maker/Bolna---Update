import React, { useState } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';

export const ContactsTable = ({ contacts }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 5;

  const isEmpty = contacts.length === 0;
  const totalPages = isEmpty ? 0 : Math.ceil(contacts.length / ROWS_PER_PAGE);
  const startIndex = currentPage * ROWS_PER_PAGE;
  const visibleContacts = isEmpty ? [] : contacts.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <Panel>
      <PanelHead>
        <div className="panel-label" style={{ marginBottom: 0 }}>
          <span className="label-dot" />
          Contacts
        </div>
        <div className="count-chip">
          {startIndex + 1}-{Math.min(startIndex + ROWS_PER_PAGE, contacts.length)} of {contacts.length}
        </div>
      </PanelHead>
      <div className="panel-body">
        <div className="table-wrap">
          <table className="ct">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {isEmpty ? (
                <tr>
                  <td colSpan="5" className="no-data" style={{ padding: '40px', background: 'transparent' }}>
                    No contacts uploaded yet. Please upload a sheet to begin.
                  </td>
                </tr>
              ) : (
                visibleContacts.map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-num">{startIndex + i + 1}</td>
                    <td className="td-name">{c.name}</td>
                    <td className="td-phone">{c.phone}</td>
                    <td>
                      <StatusPill status={c.status} />
                    </td>
                    <td className="td-response">{c.response || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="pagination-footer" style={{ padding: '16px', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            className="nav-btn active" 
            onClick={handleNext}
            style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '600' }}
          >
            Next →
          </button>
        </div>
      )}
    </Panel>
  );
};
