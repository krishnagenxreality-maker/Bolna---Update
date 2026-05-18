export function sleep(ms) { 
  return new Promise(r => setTimeout(r, ms)); 
}

export function escHtml(s) { 
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); 
}

export function cleanPhoneNumber(phone) {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) return "+91" + cleaned;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return "+" + cleaned;
    if (cleaned.length > 5) return "+91" + cleaned;
  }
  return cleaned;
}

export function normalizeDate(d) {
  if (!d) return "";
  try {
    if (typeof d === "string") {
      const trimmed = d.trim();
      // YYYY-MM-DD exactly (zero timezone shift)
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ]/);
      if (dateOnlyMatch) {
        // If it does not contain a timezone indicator (Z or +/- offset), treat it as local date
        if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !/-\d{2}:\d{2}$/.test(trimmed)) {
          return dateOnlyMatch[1];
        }
      }
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const dVal = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${dVal}`;
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}

