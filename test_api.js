const http = require('http');
const fs = require('fs');

const results = [];

function log(msg) {
  results.push(msg);
  fs.writeFileSync('e:\\QB_CM\\test_results.txt', results.join('\n'));
}

// Test 1: Health check
function testHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/health', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        log(`HEALTH CHECK: Status ${res.statusCode}, Body: ${body}`);
        resolve();
      });
    });
    req.on('error', (e) => {
      log(`HEALTH CHECK ERROR: ${e.message}`);
      resolve();
    });
    req.setTimeout(5000, () => {
      log('HEALTH CHECK: TIMEOUT');
      req.destroy();
      resolve();
    });
  });
}

// Test 2: Login
function testLogin() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: 'admin@comqb.local', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        log(`LOGIN: Status ${res.statusCode}, Body: ${body}`);
        resolve();
      });
    });
    req.on('error', (e) => {
      log(`LOGIN ERROR: ${e.message}`);
      resolve();
    });
    req.setTimeout(10000, () => {
      log('LOGIN: TIMEOUT');
      req.destroy();
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  log('=== Testing Backend API ===');
  log('Time: ' + new Date().toISOString());
  await testHealth();
  await testLogin();
  log('=== Done ===');
}

main().catch(e => log('FATAL: ' + e.message));
