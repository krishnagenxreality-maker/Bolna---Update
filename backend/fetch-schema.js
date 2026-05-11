const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

fetch(`${url}/rest/v1/?apikey=${key}`)
  .then(res => res.json())
  .then(data => {
    const fs = require('fs');
    fs.writeFileSync('schema_dump.json', JSON.stringify(data, null, 2));
    console.log('Schema dumped to schema_dump.json');
  })
  .catch(err => console.error(err));
