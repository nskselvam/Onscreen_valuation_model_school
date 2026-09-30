/**
 * Test script to diagnose SMS gateway connectivity issues
 * Run with: node backend/test/test-sms-connection.js
 */

const axios = require('axios');
const http = require('http');
const dns = require('dns').promises;

const SMS_GATEWAY = 'bulksmsgateway.in';
const SMS_API_URL = 'http://bulksmsgateway.in/sendmessage.php';

console.log('🔍 SMS Gateway Connectivity Diagnostics');
console.log('=' .repeat(50));

async function testDNS() {
    console.log('\n1️⃣  Testing DNS Resolution...');
    try {
        const addresses = await dns.resolve4(SMS_GATEWAY);
        console.log('✅ DNS resolved successfully:', addresses);
        return true;
    } catch (error) {
        console.error('❌ DNS resolution failed:', error.message);
        return false;
    }
}

async function testPing() {
    console.log('\n2️⃣  Testing HTTP Connection...');
    return new Promise((resolve) => {
        const req = http.get(SMS_API_URL, {
            timeout: 10000,
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0'
            }
        }, (res) => {
            console.log('✅ HTTP connection successful');
            console.log('   Status:', res.statusCode);
            console.log('   Headers:', res.headers);
            res.resume();
            resolve(true);
        });

        req.on('error', (error) => {
            console.error('❌ HTTP connection failed:', error.message);
            resolve(false);
        });

        req.on('timeout', () => {
            console.error('❌ HTTP connection timeout');
            req.destroy();
            resolve(false);
        });
    });
}

async function testAxios() {
    console.log('\n3️⃣  Testing Axios Request...');
    try {
        const response = await axios.get(SMS_API_URL, {
            timeout: 10000,
            params: { test: 'connection' },
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0'
            },
            validateStatus: () => true
        });
        console.log('✅ Axios request successful');
        console.log('   Status:', response.status);
        console.log('   Data:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Axios request failed:', error.message);
        console.error('   Code:', error.code);
        return false;
    }
}

async function testWithRetry() {
    console.log('\n4️⃣  Testing with Retry Logic (3 attempts)...');
    
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            console.log(`   Attempt ${attempt + 1}...`);
            const response = await axios.get(SMS_API_URL, {
                timeout: 15000,
                params: { test: 'retry' },
                headers: {
                    'Connection': 'close'
                },
                httpAgent: new http.Agent({ 
                    keepAlive: false,
                    timeout: 20000
                })
            });
            console.log(`✅ Success on attempt ${attempt + 1}`);
            return true;
        } catch (error) {
            console.log(`   ❌ Attempt ${attempt + 1} failed: ${error.message}`);
            if (attempt < 2) {
                const waitTime = 2000 * (attempt + 1);
                console.log(`   ⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    console.error('❌ All retry attempts failed');
    return false;
}

async function checkNetworkSettings() {
    console.log('\n5️⃣  Checking Network Settings...');
    console.log('   Node version:', process.version);
    console.log('   Platform:', process.platform);
    console.log('   Axios version:', require('axios/package.json').version);
    
    // Check if running behind proxy
    if (process.env.HTTP_PROXY || process.env.http_proxy) {
        console.log('   ⚠️  HTTP Proxy detected:', process.env.HTTP_PROXY || process.env.http_proxy);
    } else {
        console.log('   ✅ No HTTP proxy configured');
    }
}

async function runTests() {
    console.log('\n🚀 Starting diagnostics...\n');
    
    await checkNetworkSettings();
    await testDNS();
    await testPing();
    await testAxios();
    await testWithRetry();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostics complete');
    console.log('\nIf all tests fail, possible issues:');
    console.log('  • Firewall blocking outbound HTTP connections');
    console.log('  • Network connectivity issues');
    console.log('  • SMS gateway server is down');
    console.log('  • DNS resolution problems');
}

runTests().catch(console.error);
