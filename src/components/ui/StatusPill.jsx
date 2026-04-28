import React from 'react';
import { STATUS_META } from '../../utils/constants';

export const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, cls: "s-pending" };
  return (
    <span className={`spill ${meta.cls}`}>
      {meta.label}
    </span>
  );
};
