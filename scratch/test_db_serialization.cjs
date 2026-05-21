require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Inline helpers copied from our server code to test directly
const mapContact = (c) => {
  if (!c) return null;
  const { lead_category, call_date, created_at, execution_id, user_id, classification, recording_url, ...rest } = c;
  
  let summaryText = c.summary || "";
  let duration = null;
  
  try {
    if (c.summary && c.summary.startsWith('{') && c.summary.endsWith('}')) {
      const parsed = JSON.parse(c.summary);
      if (parsed && typeof parsed === 'object') {
        summaryText = parsed.text || "";
        duration = parsed.duration !== undefined ? parsed.duration : null;
      }
    }
  } catch (e) {
    // not JSON
  }

  return {
    ...rest,
    summary: summaryText,
    duration: duration,
    leadCategory: lead_category || classification,
    classification: classification,
    date: call_date,
    executionId: execution_id,
    userId: user_id,
    recordingUrl: recording_url || "",
    createdAt: created_at
  };
};

async function test() {
  console.log("Starting DB serialization tests...");
  
  const testContactId = "test_serialization_id_" + Math.random().toString(36).substring(7);
  const testSummary = "This is a beautiful test call summary description.";
  const testDuration = 345; // 345 seconds
  
  const payloadToInsert = {
    id: testContactId,
    user_id: 'Demo',
    name: 'Serialization Tester',
    phone: '+15551234567',
    status: 'completed',
    response: 'completed',
    summary: JSON.stringify({
      text: testSummary,
      duration: testDuration
    }),
    lead_category: 'Warm Lead',
    execution_id: 'mock-exec-id-12345',
    call_date: new Date().toISOString().split('T')[0]
  };

  console.log("1. Upserting test serialized contact into Supabase...");
  const { error: upsertErr } = await supabase
    .from('contacts')
    .upsert(payloadToInsert);
    
  if (upsertErr) {
    console.error("Upsert failed:", upsertErr.message);
    return;
  }
  console.log("✓ Contact upserted successfully!");

  console.log("2. Querying inserted contact back from Supabase...");
  const { data, error: selectErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', testContactId);

  if (selectErr) {
    console.error("Select failed:", selectErr.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.error("No record retrieved.");
    return;
  }
  
  const rawRecord = data[0];
  console.log("✓ Raw record retrieved. Summary in DB is:", rawRecord.summary);

  console.log("3. Mapping record using mapContact helper...");
  const mapped = mapContact(rawRecord);
  console.log("Mapped fields:", {
    id: mapped.id,
    summary: mapped.summary,
    duration: mapped.duration,
    leadCategory: mapped.leadCategory
  });
  
  if (mapped.summary === testSummary && mapped.duration === testDuration) {
    console.log("🎉 SUCCESS! Call duration and summary successfully serialized, persisted, and mapped!");
  } else {
    console.error("❌ FAILURE! Values do not match.");
  }
  
  console.log("4. Cleaning up test record...");
  const { error: deleteErr } = await supabase.from('contacts').delete().eq('id', testContactId);
  if (deleteErr) {
    console.error("Cleanup failed:", deleteErr.message);
  } else {
    console.log("✓ Test record cleaned up.");
  }
}

test();
