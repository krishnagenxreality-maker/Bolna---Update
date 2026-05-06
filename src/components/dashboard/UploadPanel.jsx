import React, { useRef, useState } from 'react';
import { Panel } from '../ui/Panel';

export const UploadPanel = ({ handleFile }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <Panel label="Upload Contact Sheet">
      <div className="panel-body">
        <div
          className={`dropzone ${dragOver ? "dz-over" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { 
            e.preventDefault(); 
            setDragOver(false); 
            const f = e.dataTransfer.files[0]; 
            if(f) handleFile(f); 
          }}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            style={{display:"none"}} 
            onChange={e => { 
              if(e.target.files[0]) handleFile(e.target.files[0]); 
            }} 
          />
          <div className="dz-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
              <path d="M16 22V14M12 18l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dz-title">Drop your Excel file here</div>
          <div className="dz-sub">Supports .xlsx, .xls, .csv · needs "Name" and "Phone Number" columns</div>
        </div>
      </div>
    </Panel>
  );
};
