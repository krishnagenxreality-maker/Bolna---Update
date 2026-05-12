import { cleanPhoneNumber } from "../utils/helpers";

export function parseContacts(rows) {
  const nameKeys  = ["name","full name","full_name"];
  const phoneKeys = ["phone","phone number","phone_number","mobile","contact"];

  let nameKey = null, phoneKey = null;
  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    nameKey  = keys.find(k => nameKeys.some(n  => k.toLowerCase().includes(n)));
    phoneKey = keys.find(k => phoneKeys.some(n => k.toLowerCase().includes(n)));
  }

  if (!nameKey || !phoneKey) {
    throw new Error(`Could not find Name/Phone columns.\nFound: ${Object.keys(rows[0]||{}).join(", ")}`);
  }

  return rows.map((r, i) => {
    let phone = String(r[phoneKey] || "").trim();
    phone = cleanPhoneNumber(phone);
    
    return { 
      id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`, 
      name: String(r[nameKey]||"").trim(), 
      phone, 
      status: "pending", 
      executionId: null, 
      date: new Date().toISOString().split('T')[0] 
    };
  }).filter(c => c.phone);
}
