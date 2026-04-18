const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');

console.log('--- Environment Diagnostic ---');
console.log('Directory:', __dirname);
console.log('Checking for .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('[SUCCESS] .env file found.');
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
        console.error('[ERROR] Failed to load .env:', result.error);
    } else {
        console.log('[SUCCESS] .env loaded successfully.');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'PRESENT (' + process.env.EMAIL_USER + ')' : 'MISSING');
        console.log('EMAIL_APP_PASS:', process.env.EMAIL_APP_PASS ? 'PRESENT (HIDDEN)' : 'MISSING');
    }
} else {
    console.error('[ERROR] .env file NOT FOUND at the expected path.');
}
console.log('------------------------------');
