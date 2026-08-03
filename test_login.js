const http = require('http');

const data = JSON.stringify({
  email: 'admin@comqb.local',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
