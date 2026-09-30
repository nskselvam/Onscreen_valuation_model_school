const formatToIST = (utcDateString) => {
  const date = new Date(utcDateString);
  const options = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);
  
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const dayPeriod = parts.find(p => p.type === 'dayPeriod').value.toLowerCase();
  
  return `${day}-${month}-${year}, ${hour}:${minute} ${dayPeriod}`;
};

const formatDateOnly = (utcDateString) => {
  const date = new Date(utcDateString);
  const options = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);
  
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  
  return `${day}-${month}-${year}`;
};

const getCurrentISTDateTime = () => {
  const date = new Date();
  const options = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);
  
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const dayPeriod = parts.find(p => p.type === 'dayPeriod').value.toLowerCase();
  
  // Format: "16-03-2026 10:30am" — fits within STRING(25)
  return `${day}-${month}-${year} ${hour}:${minute}${dayPeriod}`;
};

// PDF-specific format: DD/MM/YYYY HH:MM:SS (24-hour format)
const getCurrentISTDateTimeForPDF = () => {
  const date = new Date();
  const options = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);
  
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const second = parts.find(p => p.type === 'second').value;
  
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};

const getClientIP = (req) => {
  // Check various headers that might contain the client IP
  // Priority order: x-forwarded-for (most reliable behind proxy), x-real-ip, then direct connection
  let ip = 
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.ip || // Express provides this when trust proxy is enabled
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null);
  
  if (!ip) {
    return '127.0.0.1'; // Default fallback
  }
  
  // Clean up IP address in a single chain
  ip = ip
    .split(',')[0]              // Take first IP from comma-separated list (x-forwarded-for)
    .replace(/^::ffff:/, '')    // Remove IPv6 mapping prefix
    .split('%')[0]              // Remove zone identifier (%1, %eth0, etc.)
    .trim();                    // Remove whitespace
  
  // Convert IPv6 localhost to IPv4
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  return ip || '127.0.0.1';
};


const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero Rupees Only';
  
  const convert = (n) => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    return '';
  };
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;
  
  let result = '';
  if (crore > 0) result += convert(crore) + ' Crore ';
  if (lakh > 0) result += convert(lakh) + ' Lakh ';
  if (thousand > 0) result += convert(thousand) + ' Thousand ';
  if (hundred > 0) result += convert(hundred);
  
  return result.trim() + ' Rupees Only';
};

// Calculate difference between two dates in hours and minutes
const calculateTimeDifference = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }

  try {
    // Parse IST formatted dates if they are strings in DD-MM-YYYY HH:MMam/pm format
    let start = typeof startDate === 'string' && startDate.match(/^\d{2}-\d{2}-\d{4} \d{1,2}:\d{2}(am|pm)$/i) 
      ? parseISTDateTime(startDate) 
      : new Date(startDate);
    
    let end = typeof endDate === 'string' && endDate.match(/^\d{2}-\d{2}-\d{4} \d{1,2}:\d{2}(am|pm)$/i)
      ? parseISTDateTime(endDate)
      : new Date(endDate);
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return {
      hours: diffHours,
      minutes: diffMinutes,
      seconds: diffSeconds,
      totalMinutes: Math.floor(diffMs / (1000 * 60)),
      totalSeconds: Math.floor(diffMs / 1000),
      formatted: `${diffHours}h ${diffMinutes}m ${diffSeconds}s`
    };
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return null;
  }
};

// Parses IST formatted string "DD-MM-YYYY HH:MMam/pm" back to a Date object
const parseISTDateTime = (dateStr) => {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return null;
  let [, day, month, year, hour, minute, period] = match;
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, minute);
};

module.exports = { formatToIST, formatDateOnly, getCurrentISTDateTime, getCurrentISTDateTimeForPDF, getClientIP, numberToWords, calculateTimeDifference, parseISTDateTime };