export const BATCH_SIZE = 10;
export const BATCH_DELAY_MS = 10 * 60 * 1000;
export const POLL_INTERVAL_MS = 10000;

export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

export const STATUS_META = {
  pending:   { label: "Pending",    cls: "s-pending"   },
  queued:    { label: "Queued",     cls: "s-queued"    },
  calling:   { label: "Calling…",  cls: "s-calling"   },
  completed: { label: "Completed", cls: "s-done"      },
  called:    { label: "Called",    cls: "s-done"      },
  failed:    { label: "Failed",    cls: "s-failed"    },
};


