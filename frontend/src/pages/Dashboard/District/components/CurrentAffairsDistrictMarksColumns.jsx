import React from "react";

export const getCurrentAffairsDistrictMarksColumns = (columnMapping) => [
  { name: "S.No", selector: (row, index) => index + 1, sortable: false, width: "70px", center: true },
  { name: "Test Code", selector: (row) => row.Test_Code, sortable: true, minWidth: "120px" },
  { name: "District Code", selector: (row) => row.BATCHNAME, sortable: true, minWidth: "130px" },
  { name: "District Name", selector: (row) => row.District_Name, sortable: true, minWidth: "140px" },
  { name: "EMIS No", selector: (row) => row.ROLLNO, sortable: true, minWidth: "110px" },
  { name: "Candidate Name", selector: (row) => row.Candidate_Name, sortable: true, wrap: true, minWidth: "180px" },
  { name: "Overall Total", selector: (row) => row.TOTAL, sortable: true, right: true, minWidth: "130px" },
  { name: "Overall Correct", selector: (row) => row.CORRECT, sortable: true, right: true, minWidth: "130px" },
  { name: "Overall Wrong", selector: (row) => row.WRONG, sortable: true, right: true, minWidth: "130px" },
  { name: "Overall Blank", selector: (row) => row.BLANK, sortable: true, right: true, minWidth: "130px" },
  { name: "Current Affairs Score", selector: (row) => row.TOTAL1, sortable: true, right: true, minWidth: "120px" },
  { name: "Current Affairs Correct", selector: (row) => row.CORRECT1, sortable: true, right: true, minWidth: "130px" },
  { name: "Current Affairs Wrong", selector: (row) => row.WRONG1, sortable: true, right: true, minWidth: "120px" },
  { name: "Current Affairs Blank", selector: (row) => row.BLANK1, sortable: true, right: true, minWidth: "120px" },
  { name: "Integrated English Score", selector: (row) => row.TOTAL2, sortable: true, right: true, minWidth: "120px" },
  { name: "Integrated English Correct", selector: (row) => row.CORRECT2, sortable: true, right: true, minWidth: "130px" },
  { name: "Integrated English Wrong", selector: (row) => row.WRONG2, sortable: true, right: true, minWidth: "120px" },
  { name: "Integrated English Blank", selector: (row) => row.BLANK2, sortable: true, right: true, minWidth: "120px" },
  { name: "Total Percentile", selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: "150px", cell: (row) => row.Total_Percentile != null ? Number(row.Total_Percentile).toFixed(4) : "-" },
  { name: "District Total Percentile", selector: (row) => row.d_Total_Percentile, sortable: true, right: true, minWidth: "180px", cell: (row) => row.d_Total_Percentile != null ? Number(row.d_Total_Percentile).toFixed(4) : "-" },
];
