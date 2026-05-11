const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./schema_dump.json', 'utf8'));

let md = '# Supabase Database Schema\n\n';

for (const [tableName, tableSchema] of Object.entries(data.definitions)) {
  md += `## Table: \`${tableName}\`\n\n`;
  md += `| Column | Type | Format | Default | Description |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  
  if (tableSchema.properties) {
    for (const [colName, colSchema] of Object.entries(tableSchema.properties)) {
      const type = colSchema.type || 'N/A';
      const format = colSchema.format || 'N/A';
      const def = colSchema.default ? `\`${colSchema.default}\`` : '';
      let desc = colSchema.description ? colSchema.description.replace(/\n/g, ' ') : '';
      md += `| \`${colName}\` | ${type} | ${format} | ${def} | ${desc} |\n`;
    }
  }
  md += '\n';
}

fs.writeFileSync('../artifacts/supabase_schema.md', md);
console.log('Schema docs generated at artifacts/supabase_schema.md');
