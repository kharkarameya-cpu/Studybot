require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function initDb() {
  const schemaPath = path.join(__dirname, '../../schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DATABASE_ID}/query`;
  const headers = {
    'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  console.log('Pushing schema to Cloudflare D1...');

  // Split schema into individual statements to ensure compatibility
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of statements) {
    try {
      const response = await axios.post(url, { sql: sql + ';' }, { headers });
      if (response.data.success) {
        console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
      } else {
        console.error(`❌ Error: ${response.data.errors[0].message}`);
      }
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
      if (error.response) console.error(JSON.stringify(error.response.data));
    }
  }

  console.log('Schema update complete!');
}

initDb();
