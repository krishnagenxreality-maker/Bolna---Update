import React, { useEffect, useRef } from 'react';

export const LogBox = ({ logs }) => {
  const logBoxRef = useRef(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-box" ref={logBoxRef}>
      {logs.map(l => (
        <div key={l.id} className={`log-row log-${l.type}`}>
          <span className="log-ts">{l.ts}</span>
          <span className="log-msg">{l.msg}</span>
        </div>
      ))}
    </div>
  );
};
