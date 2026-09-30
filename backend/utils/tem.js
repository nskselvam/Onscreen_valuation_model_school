const axios = require('axios');
const http = require('http');
const https = require('https');

// Use NEW connection for each request (no keep-alive)
// This prevents socket hang up errors from stale connections
const httpAgent = new http.Agent({
    keepAlive: false,
    timeout: 60000,
    family: 4 // Force IPv4
});

const httpsAgent = new https.Agent({
    keepAlive: false,
    timeout: 60000,
    family: 4
});

/**
 * Send SMS using bulksmsgateway.in
 * SENDS ONLY ONCE - NO RETRIES to prevent duplicate SMS
 *
 * @param {string} mobileNumber - Mobile number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<Object>} Response from SMS gateway
 */
const sendSMS = async (mobileNumber, message) => {
    const SMS_API_URL = process.env.SMS_API_URL || 'http://bulksmsgateway.in/sendmessage.php';
    const SMS_USER_ID = process.env.SMS_USER_ID || 'SVN IMAGING PVT LTD';
    const SMS_PASSWORD = process.env.SMS_PASSWORD || 'Imaging@123';
    const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'SRMIST';

    if (!SMS_USER_ID || !SMS_PASSWORD) {
        return { success: false, message: 'SMS credentials not configured' };
    }

    const cleanedMobile = String(mobileNumber).replace(/[^\d]/g, '');

    if (!cleanedMobile || cleanedMobile.length < 10) {
        return { success: false, message: 'Invalid mobile number' };
    }

    const params = {
        user: SMS_USER_ID,
        password: SMS_PASSWORD,
        mobile: cleanedMobile,
        sender: SMS_SENDER_ID,
        message: message,
        type: '3',
        template_id: '1107170151381029713'
    };

    try {
        // SEND ONLY ONCE - NO RETRY
        const response = await axios({
            method: 'GET',
            url: SMS_API_URL,
            params: params,
            timeout: 30000,
            httpAgent: httpAgent,
            httpsAgent: httpsAgent,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
                'Connection': 'close',
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const responseText = response.data ? response.data.toString() : '';

        if (response.status === 200 && (responseText.includes('success') || responseText.length > 0)) {
            console.log(`✅ SMS sent to ${cleanedMobile}: ${responseText.substring(0, 100)}`);
            return {
                success: true,
                message: 'SMS sent successfully',
                data: responseText
            };
        } else {
            console.warn(`⚠️ SMS gateway returned status ${response.status}: ${responseText}`);
            return {
                success: false,
                message: 'SMS gateway returned error',
                data: responseText
            };
        }

    } catch (error) {
        // NO RETRY - just return failure
        const isSocketError =
            error.code === 'ECONNRESET' ||
            error.message.includes('socket hang up');

        if (isSocketError) {
            console.warn(`⚠️ Socket hang up for ${cleanedMobile} - SMS may have been delivered. NOT retrying.`);
            return {
                success: false,
                message: 'Connection closed by server (SMS may have been sent)',
                error: error.message,
                errorCode: error.code,
                possiblyDelivered: true
            };
        }

        console.error(`❌ SMS send failed for ${cleanedMobile}:`, error.message, `(${error.code})`);
        return {
            success: false,
            message: 'Failed to send SMS',
            error: error.message,
            errorCode: error.code
        };
    }
};

module.exports = sendSMS;
