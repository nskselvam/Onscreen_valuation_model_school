const percentile = (value) => value != null ? Number(value).toFixed(4) : '-';

export const clatSectionLabels = (testCode) => testCode === '26L1185002'
  ? ['English Lang', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques']
  : ['English Lang', 'Logical Reasoning', 'Current Affairs & GK', 'Quantitative Techniques'];

export const getClatMarksColumns = ({ selectedDistrict, testCode }) => {
  const labels = clatSectionLabels(testCode);
  const columns = [
    { name: 'S.No', selector: (row, index) => index + 1, width: '70px', center: true },
    { name: 'Test Code', selector: (row) => row.Test_Code, sortable: true, minWidth: '120px' },
    { name: 'District Code', selector: (row) => row.BATCHNAME, sortable: true, minWidth: '120px' },
    { name: 'District Name', selector: (row) => row.District_Name, sortable: true, minWidth: '150px' },
    { name: 'EMIS No', selector: (row) => row.ROLLNO, sortable: true, minWidth: '120px' },
    { name: 'Candidate Name', selector: (row) => row.Candidate_Name, sortable: true, wrap: true, minWidth: '180px' },
    { name: 'Overall Total', selector: (row) => row.TOTAL, sortable: true, right: true, minWidth: '130px' },
    { name: 'Overall Correct', selector: (row) => row.CORRECT, sortable: true, right: true, minWidth: '140px' },
    { name: 'Overall Wrong', selector: (row) => row.WRONG, sortable: true, right: true, minWidth: '130px' },
    { name: 'Overall Blank', selector: (row) => row.BLANK, sortable: true, right: true, minWidth: '130px' },
  ];
  labels.forEach((label, index) => {
    const field = index + 1;
    columns.push(
      { name: `${label} Total`, selector: (row) => row[`TOTAL${field}`], sortable: true, right: true, minWidth: '160px' },
      { name: `${label} Correct`, selector: (row) => row[`CORRECT${field}`], sortable: true, right: true, minWidth: '170px' },
      { name: `${label} Wrong`, selector: (row) => row[`WRONG${field}`], sortable: true, right: true, minWidth: '160px' },
      { name: `${label} Blank`, selector: (row) => row[`BLANK${field}`], sortable: true, right: true, minWidth: '160px' },
      { name: `${label} Percentile`, selector: (row) => row[`Total${field}_Percentile`], sortable: true, right: true, minWidth: '190px', cell: (row) => percentile(row[`Total${field}_Percentile`]) },
    );
    if (selectedDistrict) columns.push({ name: `District ${label} Percentile`, selector: (row) => row[`d_Total${field}_Percentile`], sortable: true, right: true, minWidth: '230px', cell: (row) => percentile(row[`d_Total${field}_Percentile`]) });
  });
  columns.push({ name: 'Total Percentile', selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentile(row.Total_Percentile) });
  if (selectedDistrict) columns.push({ name: 'District Total Percentile', selector: (row) => row.d_Total_Percentile, sortable: true, right: true, minWidth: '190px', cell: (row) => percentile(row.d_Total_Percentile) });
  return columns;
};
