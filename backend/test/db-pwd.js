require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

// Inspect the exact password being used
const pw = config.password;
console.log('password length  :', pw ? pw.length : 0);
console.log('password charCodes:', pw ? [...pw].map(c => c.charCodeAt(0)) : []);
console.log('password repr     :', JSON.stringify(pw));
