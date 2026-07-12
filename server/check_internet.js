const https = require('https');

console.log('Checking internet connectivity...');
https.get('https://www.google.com', (res) => {
  console.log(`✅ Internet connection is active. Status Code: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`❌ Internet connection failed: ${e.message}`);
});
