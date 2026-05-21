const { Client } = require('pg');

async function testConnection(uri, label) {
  const client = new Client({ connectionString: uri, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`[THÀNH CÔNG] ${label}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`[THẤT BẠI] ${label}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Đang thử kiểm tra kết nối với Supabase...\n');
  
  const password = encodeURIComponent('@LightHuman213');
  const projectRef = 'ldbygnoleppszcjoxjyv';
  const poolerHost = 'aws-0-ap-southeast-1.pooler.supabase.com';

  const urlsToTest = [
    {
      label: '1. Pooler (Port 6543) - Có Project Ref',
      uri: `postgresql://postgres.${projectRef}:${password}@${poolerHost}:6543/postgres`
    },
    {
      label: '2. Pooler (Port 5432) - Có Project Ref',
      uri: `postgresql://postgres.${projectRef}:${password}@${poolerHost}:5432/postgres`
    },
    {
      label: '3. Pooler (Port 5432) - KHÔNG Có Project Ref',
      uri: `postgresql://postgres:${password}@${poolerHost}:5432/postgres`
    },
    {
      label: '4. Direct URL (Port 5432)',
      uri: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`
    }
  ];

  for (const test of urlsToTest) {
    await testConnection(test.uri, test.label);
  }
}

runTests();
