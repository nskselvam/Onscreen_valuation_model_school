const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter using AWS SES SMTP credentials (same as drb_payment_reminder.php)
const transporter = nodemailer.createTransport({
  host: process.env.AWS_SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port: parseInt(process.env.AWS_SMTP_PORT || '587'),
  secure: false, // false for 587 (uses STARTTLS)
  auth: {
    user: process.env.AWS_ACCESS_KEY_ID_EMAIL, // SMTP username (AKIAUNMUTDBFRUJNI67U)
    pass: process.env.AWS_SECRET_ACCESS_KEY_EMAIL // SMTP password
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Generate email body HTML template
 * @param {Object} data - Email data
 * @returns {string} - HTML body
 */
const generateEmailBody = (data) => {
  const {
    facultyName,
    evaId,
    tempPassword,
    subjectDetails, // Array of {subcode, subname, evaDate}
    currentDate,
    referenceNo,
    InstitutionName
  } = data;

  // Check if this is a password reset email (no subject details)
  if (!subjectDetails || subjectDetails.length === 0) {
    return `
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 0 0 10px 10px;
          }
          .credentials {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
            border-radius: 5px;
          }
          .credential-item {
            margin: 10px 0;
            font-size: 16px;
          }
          .credential-label {
            font-weight: bold;
            color: #667eea;
          }
          .credential-value {
            font-family: monospace;
            background: #f0f0f0;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Model School Admin</p>
        </div>
        <div class="content">
          <div class="credentials">
            <div class="credential-item">
              <span class="credential-label">User Name:</span>
              <span class="credential-value">${evaId}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${tempPassword}</span>
              <span style="display:block; margin-top:10px; font-size:14px; color:#555;">https://examination.tnexams.net/login</span>
            </div>
          </div>
        </div>
      </body>
    `;
  }

  // If subject details provided, use the same simple template
  return `
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 0 0 10px 10px;
        }
        .credentials {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
          border-radius: 5px;
        }
        .credential-item {
          margin: 10px 0;
          font-size: 16px;
        }
        .credential-label {
          font-weight: bold;
          color: #667eea;
        }
        .credential-value {
          font-family: monospace;
          background: #f0f0f0;
          padding: 5px 10px;
          border-radius: 3px;
          display: inline-block;
          margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Cooperative Union</p>
      </div>
      <div class="content">
        <div class="credentials">
          <div class="credential-item">
            <span class="credential-label">User Name:</span>
            <span class="credential-value">${evaId}</span>
          </div>
          <div class="credential-item">
            <span class="credential-label">Password:</span>
            <span class="credential-value">${tempPassword}</span>
          </div>
        </div>
      </div>
    </body>
  `;
};

/**
 * Sends an email using AWS SES SMTP (same method as drb_payment_reminder.php and sms_gate.php)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject (default: "APRIL 2025 Terminal Examinations - Phase 2 - Digital Valuation - Appointment Order - Reg.")
 * @param {string|Object} body - HTML email body string OR data object for template generation
 * @returns {Promise} - Promise resolving to email send result
 */
const sendEmail = async (to, subject, body) => {
  // Validate SMTP credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️ AWS SMTP credentials not configured - skipping email');
    return {
      success: false,
      message: 'AWS SMTP credentials not configured',
      skipped: true
    };
  }

  // Default subject
  const defaultSubject = "Password Reset - Model School";
  
  // If body is an object with template data, generate HTML
  let htmlBody = body;
  if (typeof body === 'object' && !Array.isArray(body)) {
    htmlBody = generateEmailBody(body);
  }

  const mailOptions = {
    from: process.env.EMAIL_SENDER || 'info@tnexams.net',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: subject || defaultSubject,
    html: htmlBody
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`, result.messageId);
    return {
      success: true,
      result,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);

    // Handle specific SMTP errors
    if (error.code === 'EAUTH') {
      console.error('SMTP authentication failed. Check credentials in .env');
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
};

module.exports = {
  sendEmail,
  generateEmailBody
};
