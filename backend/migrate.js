require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DB_PATH = path.join(__dirname, 'db.json');

async function migrate() {
    if (!fs.existsSync(DB_PATH)) {
        console.log('db.json not found, skipping migration.');
        return;
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    
    console.log('Migrating users...');
    for (const user of db.users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const { error } = await supabase.from('users').upsert({
            user_id: user.userId,
            password: hashedPassword,
            role: user.role || 'user',
            organization: user.organization,
            bolna_api_key: user.bolnaApiKey,
            bolna_agent_id: user.bolnaAgentId
        }, { onConflict: 'user_id' });

        if (error) console.error(`Error migrating user ${user.userId}:`, error.message);
        else console.log(`User ${user.userId} migrated.`);
    }

    console.log('Migrating requests...');
    if (db.requests) {
        for (const req of db.requests) {
            const { error } = await supabase.from('requests').upsert({
                id: req.id.toString(),
                name: req.name,
                organization_name: req.organizationName,
                purpose: req.purpose,
                script_content: req.scriptContent,
                credits_selected: req.creditsSelected,
                status: req.status || 'pending',
                created_at: req.createdAt || new Date().toISOString()
            }, { onConflict: 'id' });

            if (error) console.error(`Error migrating request ${req.id}:`, error.message);
            else console.log(`Request ${req.id} migrated.`);
        }
    }

    console.log('Migration complete.');
}

migrate();
