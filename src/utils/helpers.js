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
