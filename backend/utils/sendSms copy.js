const axios = require('axios');
const http = require('http');
const https = require('https');

// Create persistent HTTP agent with aggressive keep-alive and socket management
const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 60000, // Keep connections alive for 60 seconds
    maxSockets: 100,
    maxFreeSockets: 20,
    timeout: 90000, // Socket timeout 90 seconds
    scheduling: 'fifo',
    freeSocketTimeout: 30000 // Free socket timeout
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxSockets: 100,
    maxFreeSockets: 20,
    timeout: 90000,
    scheduling: 'fifo',
    freeSocketTimeout: 30000
});

// Prevent socket hang up errors globally
httpAgent.on('error', (err) => {
    console.error('HTTP Agent error:', err.message);
});

/**
 * Retry helper with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 2000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorMsg = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('socket hang up');
            
            if (attempt < maxRetries && errorMsg) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`SMS attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (attempt === maxRetries) {
                console.error(`SMS failed after ${maxRetries} attempts:`, error.message);
                throw lastError;
            } else {
                throw error; // Non-retryable error
            }
        }
    }
    throw lastError;
};

/**
 * Send SMS using bulksmsgateway.in
 * @param {string} mobileNumber - Mobile number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<Object>} Response from SMS gateway
 */
const sendSMS = async (mobileNumber, message) => {
    try {
        // bulksmsgateway.in Configuration
        const SMS_API_URL = process.env.SMS_API_URL || 'http://bulksmsgateway.in/sendmessage.php';
        const SMS_USER_ID = process.env.SMS_USER_ID || 'SVN IMAGING PVT LTD';
        const SMS_PASSWORD = process.env.SMS_PASSWORD || 'Imaging@123';
        const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'SRMIST';

        // If credentials are not configured, log and skip SMS
        if (!SMS_USER_ID || !SMS_PASSWORD) {
            return { success: false, message: 'SMS credentials not configured' };
        }

        // Clean mobile number (remove any spaces, +, -, etc.)
        const cleanedMobile = mobileNumber.replace(/[^\d]/g, '');

        // Prepare SMS parameters for bulksmsgateway.in
        const params = {
            user: SMS_USER_ID,
            password: SMS_PASSWORD,
            mobile: cleanedMobile,
            sender: SMS_SENDER_ID,
            message: message,
            type: '3', // Unicode type, use '0' for normal text
            template_id: '1107170151381029713' // Optional: Use if you have a template set up
        };

        // Send SMS request with retry logic
        const response = await retryWithBackoff(async () => {
            return await axios({
                method: 'GET',
                url: SMS_API_URL,
                params: params,
                timeout: 60000, // 60 seconds timeout
                httpAgent: httpAgent,
                httpsAgent: httpsAgent,
                maxRedirects: 5,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: (status) => status < 500,
                headers: {
                    'Connection': 'keep-alive',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'User-Agent': 'Mozilla/5.0 (compatible; SRMIST-SMS/1.0)',
                    'Cache-Control': 'no-cache'
                },
                decompress: true,
                // Socket-level options
                socketPath: undefined,
                family: 4, // Force IPv4
                insecureHTTPParser: true
            });
        }, 5, 3000); // 5 retries, starting with 3 second delay


        // Check if response indicates success
        const responseText = response.data.toString();
        if (responseText.includes('success') || response.status === 200) {
            console.log(`✅ SMS sent successfully to ${cleanedMobile}`);
            return {
                success: true,
                message: 'SMS sent successfully',
                data: response.data
            };
        } else {
            console.warn(`⚠️ SMS gateway returned non-success: ${responseText}`);
            return {
                success: false,
                message: 'SMS gateway returned error',
                data: response.data
            };
        }

    } catch (error) {
        console.error('❌ Error sending SMS after all retries:', error.message);
        console.error('Error details:', {
            code: error.code,
            syscall: error.syscall,
            hostname: error.hostname
        });
        
        return {
            success: false,
            message: 'Failed to send SMS after multiple retries',
            error: error.message,
            errorCode: error.code
        };
    }
};

module.exports = sendSMS;
