const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

require('dotenv').config();
//
// AWS SDK v3 SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

console.log('AWS SES Client initialized with region:', sesClient);
/**
 * Sends an email using AWS SES (SDK v3)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - HTML email body
 * @returns {Promise} - Promise resolving to SES send result
 */
const sendEmail = async (to, subject, body) => {
  // Validate AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️ AWS credentials not configured - skipping email');
    return { 
      success: false, 
      message: 'AWS credentials not configured',
      skipped: true 
    };
  }

  const params = {
    Source: process.env.EMAIL_SENDER,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: body,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    const result = await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Email sent to ${to}`);
    return { success: true, result, messageId: result.MessageId };
  } catch (error) {
    console.error('❌ SES Error:', error.message);
    
    // Handle specific AWS errors
    if (error.Code === 'InvalidClientTokenId') {
      console.error('AWS credentials are invalid or expired. Please update .env file.');
    }
    
    return { 
      success: false, 
      error: error.message,
      errorCode: error.Code 
    };
  }
};

module.exports = {
  sendEmail
};