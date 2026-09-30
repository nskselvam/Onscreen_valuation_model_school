const percentileCell = (value) => (value != null ? Number(value).toFixed(4) : '-');

// hasSections: true when any record in the loaded data has a non-null CORRECT1
const sectionCols = (selectedDistrict) => [
  { name: 'Quants Score',    selector: (row) => row.TOTAL1,   sortable: true, right: true, minWidth: '130px', cell: (row) => row.TOTAL1   ?? '-' },
  { name: 'Quants Correct',  selector: (row) => row.CORRECT1, sortable: true, right: true, minWidth: '120px', cell: (row) => row.CORRECT1 ?? '-' },
  { name: 'Quants Wrong',    selector: (row) => row.WRONG1,   sortable: true, right: true, minWidth: '110px', cell: (row) => row.WRONG1   ?? '-' },
  { name: 'Quants Blank',    selector: (row) => row.BLANK1,   sortable: true, right: true, minWidth: '110px', cell: (row) => row.BLANK1   ?? '-' },
  { name: 'Quants Percentile', selector: (row) => row.quantsPercentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.quantsPercentile) },
  { name: 'Logical Score',   selector: (row) => row.TOTAL2,   sortable: true, right: true, minWidth: '130px', cell: (row) => row.TOTAL2   ?? '-' },
  { name: 'Logical Correct', selector: (row) => row.CORRECT2, sortable: true, right: true, minWidth: '120px', cell: (row) => row.CORRECT2 ?? '-' },
  { name: 'Logical Wrong',   selector: (row) => row.WRONG2,   sortable: true, right: true, minWidth: '110px', cell: (row) => row.WRONG2   ?? '-' },
  { name: 'Logical Blank',   selector: (row) => row.BLANK2,   sortable: true, right: true, minWidth: '110px', cell: (row) => row.BLANK2   ?? '-' },
  { name: 'Logical Reasoning Percentile', selector: (row) => row.logicalReasoningPercentile, sortable: true, right: true, minWidth: '190px', cell: (row) => percentileCell(row.logicalReasoningPercentile) },
  { name: 'Curr Affairs Score',   selector: (row) => row.TOTAL3,   sortable: true, right: true, minWidth: '150px', cell: (row) => row.TOTAL3   ?? '-' },
  { name: 'Curr Affairs Correct', selector: (row) => row.CORRECT3, sortable: true, right: true, minWidth: '150px', cell: (row) => row.CORRECT3 ?? '-' },
  { name: 'Curr Affairs Wrong',   selector: (row) => row.WRONG3,   sortable: true, right: true, minWidth: '140px', cell: (row) => row.WRONG3   ?? '-' },
  { name: 'Curr Affairs Blank',   selector: (row) => row.BLANK3,   sortable: true, right: true, minWidth: '140px', cell: (row) => row.BLANK3   ?? '-' },
  { name: 'Curr Affairs Percentile', selector: (row) => row.currentAffairsPercentile, sortable: true, right: true, minWidth: '180px', cell: (row) => percentileCell(row.currentAffairsPercentile) },
  ...(selectedDistrict ? [
    { name: 'District Quants Percentile',          selector: (row) => row.d_quantsPercentile,           sortable: true, right: true, minWidth: '200px', cell: (row) => percentileCell(row.d_quantsPercentile) },
    { name: 'District Logical Percentile',         selector: (row) => row.d_logicalReasoningPercentile, sortable: true, right: true, minWidth: '200px', cell: (row) => percentileCell(row.d_logicalReasoningPercentile) },
    { name: 'District Curr Affairs Percentile',    selector: (row) => row.d_currentAffairsPercentile,  sortable: true, right: true, minWidth: '210px', cell: (row) => percentileCell(row.d_currentAffairsPercentile) },
  ] : []),
];

export const getQuantitativeMarksColumns = ({ selectedDistrict, marks = [] }) => {
  const hasSections = marks.some((r) => r.CORRECT1 != null);
  return [
    { name: 'S.No', selector: (row, index) => index + 1, sortable: false, width: '70px', center: true },
    { name: 'Test Code', selector: (row) => row.Test_Code, sortable: true, minWidth: '120px' },
    { name: 'District Code', selector: (row) => row.BATCHNAME, sortable: true, minWidth: '140px' },
    { name: 'District Name', selector: (row) => row.District_Name, sortable: true, minWidth: '140px' },
    { name: 'EMIS No', selector: (row) => row.ROLLNO, sortable: true, minWidth: '110px' },
    { name: 'Candidate Name', selector: (row) => row.Candidate_Name, sortable: true, wrap: true, minWidth: '180px' },
    { name: 'Total Score', selector: (row) => row.TOTAL, sortable: true, right: true, minWidth: '130px', cell: (row) => row.TOTAL ?? '-' },
    { name: 'Correct', selector: (row) => row.CORRECT, sortable: true, right: true, minWidth: '110px', cell: (row) => row.CORRECT ?? '-' },
    { name: 'Wrong', selector: (row) => row.WRONG, sortable: true, right: true, minWidth: '110px', cell: (row) => row.WRONG ?? '-' },
    { name: 'Blank', selector: (row) => row.BLANK, sortable: true, right: true, minWidth: '110px', cell: (row) => row.BLANK ?? '-' },
    { name: 'Total Percentile', selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.Total_Percentile) },
    ...(selectedDistrict ? [{ name: 'District Total Percentile', selector: (row) => row.d_Total_Percentile, sortable: true, right: true, minWidth: '180px', cell: (row) => percentileCell(row.d_Total_Percentile) }] : []),
    ...(hasSections ? sectionCols(selectedDistrict) : []),
  ];
};
