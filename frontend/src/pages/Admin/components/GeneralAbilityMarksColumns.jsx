const getLabel = (mapping, key, fallback) => mapping[key] || fallback;
const percentileCell = (value) => (value != null ? Number(value).toFixed(4) : '-');

export const getGeneralAbilityMarksColumns = ({ columnMapping, selectedDistrict }) => [
  { name: 'S.No', selector: (row, index) => index + 1, sortable: false, width: '70px', center: true },
  { name: getLabel(columnMapping, 'Test_Code', 'Test Code'), selector: (row) => row.Test_Code, sortable: true, minWidth: '120px' },
  { name: getLabel(columnMapping, 'BATCHNAME', 'District Code'), selector: (row) => row.BATCHNAME, sortable: true, minWidth: '140px' },
  { name: 'District Name', selector: (row) => row.District_Name, sortable: true, minWidth: '150px' },
  { name: getLabel(columnMapping, 'ROLLNO', 'EMIS No'), selector: (row) => row.ROLLNO, sortable: true, minWidth: '110px' },
  { name: getLabel(columnMapping, 'Candidate_Name', 'Candidate Name'), selector: (row) => row.Candidate_Name, sortable: true, wrap: true, minWidth: '180px' },
  { name: getLabel(columnMapping, 'TOTAL', 'Overall Total'), selector: (row) => row.TOTAL, sortable: true, right: true, minWidth: '130px', cell: (row) => row.TOTAL ?? '-' },
  { name: getLabel(columnMapping, 'CORRECT', 'Overall Correct'), selector: (row) => row.CORRECT, sortable: true, right: true, minWidth: '130px', cell: (row) => row.CORRECT ?? '-' },
  { name: getLabel(columnMapping, 'WRONG', 'Overall Wrong'), selector: (row) => row.WRONG, sortable: true, right: true, minWidth: '130px', cell: (row) => row.WRONG ?? '-' },
  { name: getLabel(columnMapping, 'BLANK', 'Overall Blank'), selector: (row) => row.BLANK, sortable: true, right: true, minWidth: '130px', cell: (row) => row.BLANK ?? '-' },
  { name: getLabel(columnMapping, 'TOTAL1', 'Verbal Ability Total'), selector: (row) => row.TOTAL1, sortable: true, right: true, minWidth: '160px', cell: (row) => row.TOTAL1 ?? '-' },
  { name: getLabel(columnMapping, 'CORRECT1', 'Verbal Ability Correct'), selector: (row) => row.CORRECT1, sortable: true, right: true, minWidth: '170px', cell: (row) => row.CORRECT1 ?? '-' },
  { name: getLabel(columnMapping, 'WRONG1', 'Verbal Ability Wrong'), selector: (row) => row.WRONG1, sortable: true, right: true, minWidth: '160px', cell: (row) => row.WRONG1 ?? '-' },
  { name: getLabel(columnMapping, 'BLANK1', 'Verbal Ability Blank'), selector: (row) => row.BLANK1, sortable: true, right: true, minWidth: '160px', cell: (row) => row.BLANK1 ?? '-' },
  { name: getLabel(columnMapping, 'TOTAL2', 'Quants Total'), selector: (row) => row.TOTAL2, sortable: true, right: true, minWidth: '140px', cell: (row) => row.TOTAL2 ?? '-' },
  { name: getLabel(columnMapping, 'CORRECT2', 'Quants Correct'), selector: (row) => row.CORRECT2, sortable: true, right: true, minWidth: '150px', cell: (row) => row.CORRECT2 ?? '-' },
  { name: getLabel(columnMapping, 'WRONG2', 'Quants Wrong'), selector: (row) => row.WRONG2, sortable: true, right: true, minWidth: '140px', cell: (row) => row.WRONG2 ?? '-' },
  { name: getLabel(columnMapping, 'BLANK2', 'Quants Blank'), selector: (row) => row.BLANK2, sortable: true, right: true, minWidth: '140px', cell: (row) => row.BLANK2 ?? '-' },
  { name: getLabel(columnMapping, 'TOTAL3', 'Gk Current Affairs Total'), selector: (row) => row.TOTAL3, sortable: true, right: true, minWidth: '180px', cell: (row) => row.TOTAL3 ?? '-' },
  { name: getLabel(columnMapping, 'CORRECT3', 'Gk Current Affairs Correct'), selector: (row) => row.CORRECT3, sortable: true, right: true, minWidth: '190px', cell: (row) => row.CORRECT3 ?? '-' },
  { name: getLabel(columnMapping, 'WRONG3', 'Gk Current Affairs Wrong'), selector: (row) => row.WRONG3, sortable: true, right: true, minWidth: '180px', cell: (row) => row.WRONG3 ?? '-' },
  { name: getLabel(columnMapping, 'BLANK3', 'Gk Current Affairs Blank'), selector: (row) => row.BLANK3, sortable: true, right: true, minWidth: '180px', cell: (row) => row.BLANK3 ?? '-' },
  // { name: 'Total Percentile', selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.Total_Percentile) },
  // { name: 'Verbal Ability Percentile', selector: (row) => row.Verbal_Ability_Percentile, sortable: true, right: true, minWidth: '190px', cell: (row) => percentileCell(row.Verbal_Ability_Percentile) },
  // { name: 'Quants Percentile', selector: (row) => row.Quants_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.Quants_Percentile) },
  // { name: 'Gk Current Affairs Percentile', selector: (row) => row.Gk_Current_Affairs_Percentile, sortable: true, right: true, minWidth: '220px', cell: (row) => percentileCell(row.Gk_Current_Affairs_Percentile) },

  { name: 'Total Percentile', selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.Total_Percentile) },
  { name: 'Verbal Ability Percentile', selector: (row) => row.Verbal_Ability_Percentile, sortable: true, right: true, minWidth: '190px', cell: (row) => percentileCell(row.Verbal_Ability_Percentile) },
  { name: 'Quants Percentile', selector: (row) => row.Quants_Percentile, sortable: true, right: true, minWidth: '150px', cell: (row) => percentileCell(row.Quants_Percentile) },
  { name: 'Gk Current Affairs Percentile', selector: (row) => row.Gk_Current_Affairs_Percentile, sortable: true, right: true, minWidth: '220px', cell: (row) => percentileCell(row.Gk_Current_Affairs_Percentile) },

  ...(selectedDistrict ? [
    { name: 'District Total Percentile', selector: (row) => row.d_Total_Percentile, sortable: true, right: true, minWidth: '180px', cell: (row) => percentileCell(row.d_Total_Percentile) },
    { name: 'District Verbal Ability Percentile', selector: (row) => row.d_Verbal_Ability_Percentile, sortable: true, right: true, minWidth: '230px', cell: (row) => percentileCell(row.d_Verbal_Ability_Percentile) },
    { name: 'District Quants Percentile', selector: (row) => row.d_Quants_Percentile, sortable: true, right: true, minWidth: '180px', cell: (row) => percentileCell(row.d_Quants_Percentile) },
    { name: 'District Gk Current Affairs Percentile', selector: (row) => row.d_Gk_Current_Affairs_Percentile, sortable: true, right: true, minWidth: '260px', cell: (row) => percentileCell(row.d_Gk_Current_Affairs_Percentile) },
  ] : []),
];