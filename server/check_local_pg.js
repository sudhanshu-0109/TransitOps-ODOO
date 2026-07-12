const net = require('net');

console.log('Checking if a local PostgreSQL database is running on localhost:5432...');
const client = new net.Socket();

client.setTimeout(2000);
client.connect(5432, '127.0.0.1', () => {
  console.log('✅ A service is running on localhost:5432! A local database is likely available.');
  client.destroy();
});

client.on('error', (err) => {
  console.log('❌ No service running on localhost:5432 (Local PostgreSQL is not running or on a different port).');
  client.destroy();
});

client.on('timeout', () => {
  console.log('❌ Connection timed out on localhost:5432.');
  client.destroy();
});
