const parseCSVFromString = (csvString) => {
  if (!csvString) return [];
  const lines = csvString.split(/\r?\n/);
  const results = [];

  lines.forEach((line) => {
    if (!line.trim()) return; // Skip empty lines
    results.push(line);
  });

  return results;
};

export { parseCSVFromString };
