// This script will restore AdminPages.jsx by extracting content and reformatting
const fs = require('fs');
const content = fs.readFileSync('E:/QB_CM/frontend/src/pages/AdminPages.jsx', 'utf8');

// The file has literal \n in it - we need to convert them
const normalized = content.replace(/\\n/g, '\n');

fs.writeFileSync('E:/QB_CM/frontend/src/pages/AdminPages.jsx', normalized);
console.log('Normalized file written');