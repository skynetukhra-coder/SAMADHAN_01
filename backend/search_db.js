const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: '1234', database: 'samadhan_db'});
  const [rows] = await conn.query("SELECT TOKEN_NO AS token_number, 'Pension' AS category, PSA_NAME AS psa_name FROM details WHERE SERVICE_PENSION = 'Pending' AND TABLE_PENSION IS NULL");
  console.log('Pension active tokens:', rows);
  
  const [rows2] = await conn.query("SELECT TOKEN_NO AS token_number, 'Accounts' AS category, PSA_NAME AS psa_name FROM details WHERE SERVICE_ACCOUNTS = 'Pending' AND TABLE_ACCOUNTS IS NULL");
  console.log('Accounts active tokens:', rows2);

  const [rows3] = await conn.query("SELECT TOKEN_NO AS token_number, 'GPF' AS category, PSA_NAME AS psa_name FROM details WHERE SERVICE_GPF = 'Pending' AND TABLE_GPF IS NULL");
  console.log('GPF active tokens:', rows3);
  await conn.end();
}

run().catch(console.error);
