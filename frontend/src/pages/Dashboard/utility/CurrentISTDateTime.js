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
  
  return `${day}-${month}-${year}, ${hour}:${minute} ${dayPeriod}`;
};
export default getCurrentISTDateTime;