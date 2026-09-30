import React from "react";
import { Badge } from "react-bootstrap";

export const getCurrentAffairsMarksColumns = ({ selectedDistrict }) => [
  { name: "S.No", selector: (row, index) => index + 1, sortable: false, width: "70px", center: true },
  { name: "Test Code", selector: (row) => row.Test_Code, sortable: true, minWidth: "120px" },
  { name: "District Code", selector: (row) => row.BATCHNAME, sortable: true, minWidth: "140px" },
  { name: "District Name", selector: (row) => row.District_Name, sortable: true, minWidth: "140px" },
  { name: "EMIS No", selector: (row) => row.ROLLNO, sortable: true, minWidth: "110px" },
  { name: "Candidate Name", selector: (row) => row.Candidate_Name, sortable: true, wrap: true, minWidth: "180px" },
  { name: "Overall Total", selector: (row) => row.TOTAL, sortable: true, right: true, minWidth: "130px", cell: (row) => row.TOTAL ?? "-" },
  { name: "Overall Correct", selector: (row) => row.CORRECT, sortable: true, right: true, minWidth: "130px", cell: (row) => row.CORRECT ?? "-" },
  { name: "Overall Wrong", selector: (row) => row.WRONG, sortable: true, right: true, minWidth: "130px", cell: (row) => row.WRONG ?? "-" },
  { name: "Overall Blank", selector: (row) => row.BLANK, sortable: true, right: true, minWidth: "130px", cell: (row) => row.BLANK ?? "-" },
  { name: "Part 1 Score", selector: (row) => row.TOTAL1, sortable: true, right: true, minWidth: "120px", cell: (row) => row.TOTAL1 ?? "-" },
  { name: "Part 1 Correct", selector: (row) => row.CORRECT1, sortable: true, right: true, minWidth: "130px", cell: (row) => row.CORRECT1 ?? "-" },
  { name: "Part 1 Wrong", selector: (row) => row.WRONG1, sortable: true, right: true, minWidth: "120px", cell: (row) => row.WRONG1 ?? "-" },
  { name: "Part 1 Blank", selector: (row) => row.BLANK1, sortable: true, right: true, minWidth: "120px", cell: (row) => row.BLANK1 ?? "-" },
  { name: "Part 2 Score", selector: (row) => row.TOTAL2, sortable: true, right: true, minWidth: "120px", cell: (row) => row.TOTAL2 ?? "-" },
  { name: "Part 2 Correct", selector: (row) => row.CORRECT2, sortable: true, right: true, minWidth: "130px", cell: (row) => row.CORRECT2 ?? "-" },
  { name: "Part 2 Wrong", selector: (row) => row.WRONG2, sortable: true, right: true, minWidth: "120px", cell: (row) => row.WRONG2 ?? "-" },
  { name: "Part 2 Blank", selector: (row) => row.BLANK2, sortable: true, right: true, minWidth: "120px", cell: (row) => row.BLANK2 ?? "-" },
  { name: "Total Percentile", selector: (row) => row.Total_Percentile, sortable: true, right: true, minWidth: "150px", cell: (row) => row.Total_Percentile != null ? Number(row.Total_Percentile).toFixed(4) : "-" },
  { name: "Part 1 Percentile", selector: (row) => row.Total1_Percentile, sortable: true, right: true, minWidth: "150px", cell: (row) => row.Total1_Percentile != null ? Number(row.Total1_Percentile).toFixed(4) : "-" },
  { name: "Part 2 Percentile", selector: (row) => row.Total2_Percentile, sortable: true, right: true, minWidth: "150px", cell: (row) => row.Total2_Percentile != null ? Number(row.Total2_Percentile).toFixed(4) : "-" },
  ...(selectedDistrict ? [
    { name: "District Total Percentile", selector: (row) => row.d_Total_Percentile, sortable: true, right: true, minWidth: "180px", cell: (row) => row.d_Total_Percentile != null ? Number(row.d_Total_Percentile).toFixed(4) : "-" },
    { name: "District Part 1 Percentile", selector: (row) => row.d_Total1_Percentile, sortable: true, right: true, minWidth: "190px", cell: (row) => row.d_Total1_Percentile != null ? Number(row.d_Total1_Percentile).toFixed(4) : "-" },
    { name: "District Part 2 Percentile", selector: (row) => row.d_Total2_Percentile, sortable: true, right: true, minWidth: "190px", cell: (row) => row.d_Total2_Percentile != null ? Number(row.d_Total2_Percentile).toFixed(4) : "-" },
  ] : []),
];
