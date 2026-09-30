const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter using AWS SES SMTP credentials (same as drb_payment_reminder.php)
const transporter = nodemailer.createTransport({
  host: process.env.AWS_SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port: parseInt(process.env.AWS_SMTP_PORT || '587'),
  secure: false, // false for 587 (uses STARTTLS)
  auth: {
    user: process.env.AWS_ACCESS_KEY_ID, // SMTP username (AKIAUNMUTDBFRUJNI67U)
    pass: process.env.AWS_SECRET_ACCESS_KEY // SMTP password
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // Return original if invalid
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Generate email body HTML template (same format as sms_gate.php)
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

  // Generate subject rows
  const subjectRows = subjectDetails.map((subject, index) => `
    <tr style="border: 1px solid black;">
      <td style="border: 1px solid black;">${index + 1}</td>
      <td style="border: 1px solid black;">${facultyName}</td>
      <td style="border: 1px solid black;">${subject.subcode}</td>
      <td style="border: 1px solid black;">${formatDate(subject.evaDate)}</td>
    </tr>
  `).join('');

  return `
    <head>
      <style>
        #testid{
          font-family: "Times New Roman", Times, serif;
          font-size: 16px;
          font-color: black;
        }
      </style>
    </head>
    <body style="margin: 0px;">
      <div id="testid" align="center">
        <b><span style="font-size: 36px;">${InstitutionName }</span></b><br>
        <span>(A Govt. Aided Autonomous Institution Affiliated to Anna University)</span><br>
        <span>Madurai 625 015</span><br>
        <span style="font-size: 26px;"><b>Office of the Controller of Examinations</b></span>
      </div>
      <br><hr>
      <p align="left" style="padding-left: 48.5px;">${referenceNo }
      <span style="float:right;">${formatDate(currentDate)}</span></p>
      <div align="center"><p>CONFIDENTIAL</p></div>
      <div style="margin-left:4%"> 
        To<br>${facultyName}<br>${InstitutionName}.<br>
        Sir,<br>
        <b>Sub.:</b> APRIL 2026 Terminal Examinations – Phase 1 – Digital Valuation – Order - Reg.<br>
        <div style="margin-left: 43%;">------------- x ------------- </div>
        I am glad to appoint you as an Examiner for the valuation of the Course<br>
        <br>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 16px;">
          <thead style="border: 1px solid black;">
            <tr>
              <th style="border: 1px solid black;">SNO</th>
              <th style="border: 1px solid black;">EXAMINER</th>
              <th style="border: 1px solid black;">COURSE CODE</th>
              <th style="border: 1px solid black;">EVALUATION START DATE</th>
            </tr>
          </thead>
          <tbody style="text-align: center;">
            ${subjectRows}
          </tbody>
        </table>
        <br>Kindly keep the confidentiality and do not disclose this offer with any staff/students. If any of your ward/relative appeared for this course, kindly decline this offer immediately.<br>
        The details of the Valuation Schedule:<br>
        <div style="margin-left:25%">
          <ul>
            <li>Login Credentials : <span style="padding-left: 23px;"> User id</span><span style="padding-left: 21px;">: ${evaId}</span></li>
            <span style="padding-left: 151.5px;">Password : ${tempPassword}</span><br>
            <li>Venue               <span style="padding-left: 156px;">: DIGITAL VALUATION CENTRE</span></li>
            <li>Valuation Sessions  <span style="padding-left: 83px;">: FN - 09.15 A.M to 12.45 P.M</span></li>
            <span style="padding-left: 219px;">AN - 01.15 P.M to 04.45 P.M</span><br>
            <li>Maximum Answer Scripts per day : <b>60 Approximately</b>.</li>
          </ul>
        </div>
        <div style="margin-left:0%"> Kindly adhere to the above schedule and complete the valuation.</div><br>
        <div align="right">
          <br>Dr.N.KAMARAJ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
          Controller of Examinations
        </div>
      </div>
    </body>
  `;
};

/**
 * Sends an email with PDF attachment using AWS SES SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Plain text or HTML email body
 * @param {string|Array} attachments - PDF file path(s) to attach
 * @returns {Promise} - Promise resolving to email send result
 */
const sendEmail = async (to, subject, body, attachments = null) => {
  // Validate SMTP credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️ AWS SMTP credentials not configured - skipping email');
    return {
      success: false,
      message: 'AWS SMTP credentials not configured',
      skipped: true
    };
  }

  const mailOptions = {
    from: process.env.EMAIL_SENDER || 'info@tnexams.net',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: subject || 'Paper Review Report',
    html: body || '<p>Please find attached your paper review report.</p>'
  };

  // Add attachments if provided
  if (attachments) {
    const attachmentList = Array.isArray(attachments) ? attachments : [attachments];
    mailOptions.attachments = attachmentList.map(filePath => {
      if (typeof filePath === 'string') {
        return {
          filename: require('path').basename(filePath),
          path: filePath
        };
      }
      return filePath; // Already in nodemailer format
    });
  }

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
  generateEmailBody,
  formatDate
};
