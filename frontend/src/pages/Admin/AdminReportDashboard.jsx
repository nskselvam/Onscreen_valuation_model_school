import React, { useState, useMemo } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Spinner,
  Badge,
  Alert,
  Button,
  Nav,
} from "react-bootstrap";
import DataTableBase from "react-data-table-component";
import {
  FaFileAlt,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaClipboardList,
  FaCalculator,
  FaListAlt,
  FaFileExcel,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { getJeeMarksColumns } from "./components/JeeMarksColumns";
import { getNeetMarksColumns } from "./components/NeetMarksColumns";
import { getCuetMarksColumns } from "./components/CuetMarksColumns";
import { getCurrentAffairsMarksColumns } from "./components/CurrentAffairsMarksColumns";
import { getGeneralAbilityMarksColumns } from "./components/GeneralAbilityMarksColumns";
import { getHumanitiesMarksColumns } from "./components/HumanitiesMarksColumns";
import { getQuantitativeMarksColumns } from "./components/QuantitativeMarksColumns";
import { getFoundationMarksColumns } from "./components/FoundationMarksColumns";
import { getSpokenEnglishMarksColumns } from "./components/SpokenEnglishMarksColumns";
import { clatSectionLabels, getClatMarksColumns } from "./components/ClatMarksColumns";
import JeeSubjectStatsSection from "./components/JeeSubjectStatsSection";
import NeetSubjectStatsSection from "./components/NeetSubjectStatsSection";
import CuetSubjectStatsSection from "./components/CuetSubjectStatsSection";
import CurrentAffairsSubjectStatsSection from "./components/CurrentAffairsSubjectStatsSection";
import GeneralAbilitySubjectStatsSection from "./components/GeneralAbilitySubjectStatsSection";
import HumanitiesSubjectStatsSection from "./components/HumanitiesSubjectStatsSection";
import QuantitativeSubjectStatsSection from "./components/QuantitativeSubjectStatsSection";
import FoundationSubjectStatsSection from "./components/FoundationSubjectStatsSection";
import SpokenEnglishSubjectStatsSection from "./components/SpokenEnglishSubjectStatsSection";
import {
  useGetTestCodesForReportQuery,
  useGetJeeMarksByTestCodeQuery,
  useGetFieldnamesQuery,
  useGetJeeQbDetailsByTestCodeQuery,
  useGetSubjectWiseStatsByTestCodeQuery,
  useGetQuestionStatisticsByTestCodeQuery,
} from "../../redux-slice/jeeReportApiSlice";
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetFieldnamesQuery,
  useGetNeetQbDetailsByTestCodeQuery,
  useGetNeetSubjectWiseStatsByTestCodeQuery,
  useGetNeetQuestionStatisticsByTestCodeQuery,
} from "../../redux-slice/neetReportApiSlice";
import {
  useGetCuetTestCodesForReportQuery,
  useGetCuetMarksByTestCodeQuery,
  useGetCuetFieldnamesQuery,
  useGetCuetQbDetailsByTestCodeQuery,
  useGetCuetSubjectWiseStatsByTestCodeQuery,
  useGetCuetQuestionStatisticsByTestCodeQuery,
} from "../../redux-slice/cuetReportApiSlice";
import {
  useGetCurrentAffairsTestCodesForReportQuery,
  useGetCurrentAffairsMarksByTestCodeQuery,
  useGetCurrentAffairsQbDetailsByTestCodeQuery,
  useGetCurrentAffairsSubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/currentAffairsReportApiSlice";
import {
  useGetGeneralAbilityTestCodesForReportQuery,
  useGetGeneralAbilityMarksByTestCodeQuery,
  useGetGeneralAbilityFieldnamesQuery,
  useGetGeneralAbilityQbDetailsByTestCodeQuery,
  useGetGeneralAbilitySubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/generalAbilityReportApiSlice";
import {
  useGetHumanitiesTestCodesForReportQuery,
  useGetHumanitiesMarksByTestCodeQuery,
  useGetHumanitiesQbDetailsByTestCodeQuery,
  useGetHumanitiesSubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/humanitiesReportApiSlice";
import {
  useGetQuantitativeTestCodesForReportQuery,
  useGetQuantitativeMarksByTestCodeQuery,
  useGetQuantitativeQbDetailsByTestCodeQuery,
  useGetQuantitativeSubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/quantitativeReportApiSlice";
import {
  useGetFoundationTestCodesForReportQuery,
  useGetFoundationMarksByTestCodeQuery,
  useGetFoundationQbDetailsByTestCodeQuery,
  useGetFoundationSubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/foundationReportApiSlice";
import {
  useGetSpokenEnglishTestCodesForReportQuery,
  useGetSpokenEnglishMarksByTestCodeQuery,
  useGetSpokenEnglishQbDetailsByTestCodeQuery,
  useGetSpokenEnglishSubjectWiseStatsByTestCodeQuery,
} from "../../redux-slice/spokenEnglishReportApiSlice";
import {
  useGetClatTestCodesForReportQuery,
  useGetClatMarksByTestCodeQuery,
  useGetClatQbDetailsByTestCodeQuery,
} from "../../redux-slice/clatReportApiSlice";
import "./AdminReportDashboard.css";

const DataTable = DataTableBase.default || DataTableBase;

const examOptions = [
  { value: "jee", label: "JEE Report" },
  { value: "neet", label: "NEET Report" },
  { value: "cuet", label: "CUET Report" },
  { value: "quantitative", label: "Quantitative Aptitude Report" },
  { value: "foundation", label: "Foundation Report" },
  { value: "spokenenglish", label: "Spoken English Report" },
  { value: "currentaffairs", label: "Current Affairs Report" },
  { value: "generalability", label: "General Ability Report" },
  { value: "humanities", label: "Humanities Report" },
  { value: "clat", label: "CLAT Report" },
];

const AdminReportDashboard = () => {
  const [examType, setExamType] = useState("jee"); // "jee" or "neet"
  const [selectedTestCode, setSelectedTestCode] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filterText, setFilterText] = useState("");
  const [showAnswerAnalysis, setShowAnswerAnalysis] = useState(false);
  const [selectedQbDistrict, setSelectedQbDistrict] = useState("");
  const [selectedMedium, setSelectedMedium] = useState("");
  const [selectedQsDistrict, setSelectedQsDistrict] = useState("");

  const addClatExportFields = (obj, row, includeDistrict) => {
    clatSectionLabels(selectedTestCode).forEach((label, index) => {
      const field = index + 1;
      obj[`${label} Total`] = row[`TOTAL${field}`];
      obj[`${label} Correct`] = row[`CORRECT${field}`];
      obj[`${label} Wrong`] = row[`WRONG${field}`];
      obj[`${label} Blank`] = row[`BLANK${field}`];
      obj[`${label} Percentile`] = row[`Total${field}_Percentile`];
      if (includeDistrict) obj[`District ${label} Percentile`] = row[`d_Total${field}_Percentile`];
    });
  };

  // Excel Export Function
  const exportToExcel = () => {
    if (!rankedMarks || rankedMarks.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data for export based on current view
    const exportData = rankedMarks.map((row, index) => {

      console.log("Exporting row:", examType); // Debugging log
      if (showAnswerAnalysis) {
        // Export answer analysis view
        const obj = {
          "S.No": index + 1,
          "EMIS No": row.ROLLNO,
          "Test Code": row.Test_Code,
          "Student Name": row.Candidate_Name,
          District: row.District_Name,
          "District Code": row.BATCHNAME,
        };

        // Add question-wise answers
        if (row.CORANS) {
          // Keep spaces - they indicate questions not conducted
          row.CORANS.split("").forEach((answer, idx) => {
            if (answer === " ") {
              obj[`Q${idx + 1}`] = "-";
            } else {
              const upperAnswer = answer.toUpperCase();
              obj[`Q${idx + 1}`] = upperAnswer === "C" ? "Correct" : upperAnswer === "W" ? "Wrong" : upperAnswer === "B" ? "Blank" : upperAnswer;
            }
          });
        }

        return obj;
      } else {
        // Export marks summary view
        const obj = {
          "S.No": index + 1,
          "Test Code": row.Test_Code,
          "District Code": row.BATCHNAME,
          "District Name": row.District_Name,
          "Candidate Name": row.Candidate_Name,
          "EMIS No": row.ROLLNO,
          "Overall Rank": row.overallRank,
        };

        if (selectedDistrict) {
          obj["District Rank"] = row.districtRank;
        }

        obj["Total"] = row.TOTAL;
        obj["Overall Correct"] = row.CORRECT;
        obj["Overall Wrong"] = row.WRONG;
        obj["Overall Blank"] = row.BLANK;
        if (examType === "jee") {
          obj["Physics Score"] = row.Phy_Tot;
          obj["Physics Correct"] = row.Phy_C;
          obj["Physics Wrong"] = row.Phy_W;
          obj["Physics Blank"] = row.Phy_B;
          obj["Physics Percentile"] = row.Phy_Percentile;
          obj["Chemistry Score"] = row.che_Tot;
          obj["Chemistry Correct"] = row.Che_C;
          obj["Chemistry Wrong"] = row.Che_W;
          obj["Chemistry Blank"] = row.Che_B;
          obj["Chemistry Percentile"] = row.Che_Percentile;
          obj["Maths Score"] = row.Mat_Tot;
          obj["Maths Correct"] = row.Mat_C;
          obj["Maths Wrong"] = row.Mat_W;
          obj["Maths Blank"] = row.Mat_B;
          obj["Maths Percentile"] = row.Mat_Percentile;
        } else if (examType === "neet") {
          obj["Physics Score"] = row.TOTAL1;
          obj["Physics Correct"] = row.CORRECT1;
          obj["Physics Wrong"] = row.WRONG1;
          obj["Physics Blank"] = row.BLANK1;
          obj["Physics Percentile"] = row.Phy_Percentile;
          obj["Chemistry Score"] = row.TOTAL2;
          obj["Chemistry Correct"] = row.CORRECT2;
          obj["Chemistry Wrong"] = row.WRONG2;
          obj["Chemistry Blank"] = row.BLANK2;
          obj["Chemistry Percentile"] = row.Che_Percentile;
          obj["Botany Score"] = row.TOTAL3;
          obj["Botany Correct"] = row.CORRECT3;
          obj["Botany Wrong"] = row.WRONG3;
          obj["Botany Blank"] = row.BLANK3;
          obj["Botany Percentile"] = row.Bot_Percentile;
          obj["Zoology Score"] = row.TOTAL4;
          obj["Zoology Correct"] = row.CORRECT4;
          obj["Zoology Wrong"] = row.WRONG4;
          obj["Zoology Blank"] = row.BLANK4;
          obj["Zoology Percentile"] = row.Zoo_Percentile;
        } else if (examType === "cuet") {
          obj["Accountancy Score"] = row.TOTAL1;
          obj["Accountancy Correct"] = row.CORRECT1;
          obj["Accountancy Wrong"] = row.WRONG1;
          obj["Accountancy Blank"] = row.BLANK1;
          obj["Accountancy Percentile"] = row.Accountancy_Percentile;
          obj["Economics Score"] = row.TOTAL2;
          obj["Economics Correct"] = row.CORRECT2;
          obj["Economics Wrong"] = row.WRONG2;
          obj["Economics Blank"] = row.BLANK2;
          obj["Economics Percentile"] = row.Economics_Percentile;
          obj["Business Studies and Commerce Score"] = row.TOTAL3;
          obj["Business Studies and Commerce Correct"] = row.CORRECT3;
          obj["Business Studies and Commerce Wrong"] = row.WRONG3;
          obj["Business Studies and Commerce Blank"] = row.BLANK3;
          obj["Business Studies and Commerce Percentile"] = row.Business_Studies_Commerce_Percentile;
          obj["Business Maths Score"] = row.TOTAL4;
          obj["Business Maths Correct"] = row.CORRECT4;
          obj["Business Maths Wrong"] = row.WRONG4;
          obj["Business Maths Blank"] = row.BLANK4;
          obj["Business Maths Percentile"] = row.Business_Maths_Percentile;
        } else if (examType === "quantitative") {
          const hasSection = row.CORRECT1 != null;
          obj[hasSection ? "Overall Total" : "Quantitative Aptitude Score"]   = row.TOTAL;
          obj[hasSection ? "Overall Correct" : "Quantitative Aptitude Correct"] = row.CORRECT;
          obj[hasSection ? "Overall Wrong" : "Quantitative Aptitude Wrong"]   = row.WRONG;
          obj[hasSection ? "Overall Blank" : "Quantitative Aptitude Blank"]   = row.BLANK;
          if (hasSection) {
            obj["Quants Score"] = row.TOTAL1;
            obj["Quants Correct"] = row.CORRECT1;
            obj["Quants Wrong"] = row.WRONG1;
            obj["Quants Blank"] = row.BLANK1;
            obj["Quants Percentile"] = row.quantsPercentile;
            obj["Logical Score"] = row.TOTAL2;
            obj["Logical Correct"] = row.CORRECT2;
            obj["Logical Wrong"] = row.WRONG2;
            obj["Logical Blank"] = row.BLANK2;
            obj["Logical Reasoning Percentile"] = row.logicalReasoningPercentile;
            obj["Curr Affairs Score"] = row.TOTAL3;
            obj["Curr Affairs Correct"] = row.CORRECT3;
            obj["Curr Affairs Wrong"] = row.WRONG3;
            obj["Curr Affairs Blank"] = row.BLANK3;
            obj["Curr Affairs Percentile"] = row.currentAffairsPercentile;
            if (selectedDistrict) {
              obj["District Quants Percentile"] = row.d_quantsPercentile;
              obj["District Logical Percentile"] = row.d_logicalReasoningPercentile;
              obj["District Curr Affairs Percentile"] = row.d_currentAffairsPercentile;
            }
          }
        } else if (examType === "foundation") {
          obj["Physics Score"] = row.TOTAL1;
          obj["Physics Correct"] = row.CORRECT1;
          obj["Physics Wrong"] = row.WRONG1;
          obj["Physics Blank"] = row.BLANK1;
          obj["Physics Percentile"] = row.Phy_Percentile;
          obj["Chemistry Score"] = row.TOTAL2;
          obj["Chemistry Correct"] = row.CORRECT2;
          obj["Chemistry Wrong"] = row.WRONG2;
          obj["Chemistry Blank"] = row.BLANK2;
          obj["Chemistry Percentile"] = row.Che_Percentile;
          obj["Biology Score"] = row.TOTAL3;
          obj["Biology Correct"] = row.CORRECT3;
          obj["Biology Wrong"] = row.WRONG3;
          obj["Biology Blank"] = row.BLANK3;
          obj["Biology Percentile"] = row.Bio_Percentile;
        } else if (examType === "spokenenglish") {
          obj["Listening Score"] = row.TOTAL1;
          obj["Listening Correct"] = row.CORRECT1;
          obj["Listening Wrong"] = row.WRONG1;
          obj["Listening Blank"] = row.BLANK1;
          obj["Listening Percentile"] = row.listeningPerecentile;
          obj["Speaking Score"] = row.TOTAL2;
          obj["Speaking Correct"] = row.CORRECT2;
          obj["Speaking Wrong"] = row.WRONG2;
          obj["Speaking Blank"] = row.BLANK2;
          obj["Speaking Percentile"] = row.speakingPerecentile;
          obj["Reading Score"] = row.TOTAL3;
          obj["Reading Correct"] = row.CORRECT3;
          obj["Reading Wrong"] = row.WRONG3;
          obj["Reading Blank"] = row.BLANK3;
          obj["Reading Percentile"] = row.readingPercentile;
          obj["Writing Score"] = row.TOTAL4;
          obj["Writing Correct"] = row.CORRECT4;
          obj["Writing Wrong"] = row.WRONG4;
          obj["Writing Blank"] = row.BLANK4;
          obj["Writing Percentile"] = row.writingPercetile;
        } else if (examType === "currentaffairs") {
          obj["Part 1 Score"] = row.TOTAL1;
          obj["Part 1 Correct"] = row.CORRECT1;
          obj["Part 1 Wrong"] = row.WRONG1;
          obj["Part 1 Blank"] = row.BLANK1;
          obj["Part 1 Percentile"] = row.Total1_Percentile;
          obj["Part 2 Score"] = row.TOTAL2;
          obj["Part 2 Correct"] = row.CORRECT2;
          obj["Part 2 Wrong"] = row.WRONG2;
          obj["Part 2 Blank"] = row.BLANK2;
          obj["Part 2 Percentile"] = row.Total2_Percentile;
          
        }else if (examType === "generalability") {
       obj["Verbal Ability Score"] = row.TOTAL1;
          obj["Verbal Ability Correct"] = row.CORRECT1;
          obj["Verbal Ability Wrong"] = row.WRONG1;
          obj["Verbal Ability Blank"] = row.BLANK1;
          obj["Verbal Ability Percentile"] = row.Verbal_Ability_Percentile;
          obj["Quantitative Ability Score"] = row.TOTAL2;
          obj["Quantitative Ability Correct"] = row.CORRECT2;
          obj["Quantitative Ability Wrong"] = row.WRONG2;
          obj["Quantitative Ability Blank"] = row.BLANK2;
          obj["Quantitative Ability Percentile"] = row.Quants_Percentile;
          obj["Current Affairs Ability Score"] = row.TOTAL3;
          obj["Current Affairs Ability Correct"] = row.CORRECT3;
          obj["Current Affairs Ability Wrong"] = row.WRONG3;
          obj["Current Affairs Ability Blank"] = row.BLANK3;
          obj["Current Affairs Ability Percentile"] = row.Gk_Current_Affairs_Percentile; 
        } else if (examType === "humanities") {
          obj["Economics Score"] = row.TOTAL1;
          obj["Economics Correct"] = row.CORRECT1;
          obj["Economics Wrong"] = row.WRONG1;
          obj["Economics Blank"] = row.BLANK1;
          obj["Economics Percentile"] = row.Economics_Percentile;
          obj["History Score"] = row.TOTAL2;
          obj["History Correct"] = row.CORRECT2;
          obj["History Wrong"] = row.WRONG2;
          obj["History Blank"] = row.BLANK2;
          obj["History Percentile"] = row.History_Percentile;
          obj["Political Science Score"] = row.TOTAL3;
          obj["Political Science Correct"] = row.CORRECT3;
          obj["Political Science Wrong"] = row.WRONG3;
          obj["Political Science Blank"] = row.BLANK3;
          obj["Political Science Percentile"] = row.Political_Science_Percentile;
          obj["Geography Score"] = row.TOTAL4;
          obj["Geography Correct"] = row.CORRECT4;
          obj["Geography Wrong"] = row.WRONG4;
          obj["Geography Blank"] = row.BLANK4;
          obj["Geography Percentile"] = row.Geography_Percentile;
        } else if (examType === "clat") {
          addClatExportFields(obj, row, Boolean(selectedDistrict));
        }
        obj["Total Percentile"] = row.Total_Percentile;

        if (selectedDistrict) {
          if (examType === "jee") {
            obj["District Physics Percentile"] = row.d_Phy_Percentile;
            obj["District Chemistry Percentile"] = row.d_Che_Percentile;
            obj["District Maths Percentile"] = row.d_Mat_Percentile;
          } else if (examType === "neet") {
            obj["District Physics Percentile"] = row.d_Phy_Percentile;
            obj["District Chemistry Percentile"] = row.d_Che_Percentile;
            obj["District Botany Percentile"] = row.d_Bot_Percentile;
            obj["District Zoology Percentile"] = row.d_Zoo_Percentile;
          } else if (examType === "cuet") {
            obj["District Accountancy Percentile"] = row.d_Accountancy_Percentile;
            obj["District Economics Percentile"] = row.d_Economics_Percentile;
            obj["District Business Studies and Commerce Percentile"] = row.d_Business_Studies_Commerce_Percentile;
            obj["District Business Maths Percentile"] = row.d_Business_Maths_Percentile;
          } else if (examType === "quantitative") {
            // Only total district percentile is available for quantitative aptitude.
          } else if (examType === "foundation") {
            obj["District Physics Percentile"] = row.d_Phy_Percentile;
            obj["District Chemistry Percentile"] = row.d_Che_Percentile;
            obj["District Biology Percentile"] = row.d_Bio_Percentile;
          } else if (examType === "spokenenglish") {
            obj["District Listening Percentile"] = row.d_listeningPerecentile;
            obj["District Speaking Percentile"] = row.d_speakingPerecentile;
            obj["District Reading Percentile"] = row.d_readingPercentile;
            obj["District Writing Percentile"] = row.d_writingPercetile;
          } else if (examType === "currentaffairs") {
            obj["District Part 1 Percentile"] = row.d_Total1_Percentile;
            obj["District Part 2 Percentile"] = row.d_Total2_Percentile;
          } else if (examType === "generalability") {
            obj["District Verbal Ability Percentile"] = row.d_Verbal_Ability_Percentile;
            obj["District Quantitative Ability Percentile"] = row.d_Quantitative_Ability_Percentile;
            obj["District Current Affairs Ability Percentile"] = row.d_Gk_Current_Affairs_Percentile;
          } else if (examType === "humanities") {
            obj["District Economics Percentile"] = row.d_Economics_Percentile;
            obj["District History Percentile"] = row.d_History_Percentile;
            obj["District Political Science Percentile"] = row.d_Political_Science_Percentile;
            obj["District Geography Percentile"] = row.d_Geography_Percentile;
          } else if (examType === "clat") {
            // CLAT district section percentiles are added with the section fields above.
          }
          obj["District Total Percentile"] = row.d_Total_Percentile;
        }

        return obj;
      }
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${examType.toUpperCase()} Marks Report`);

    // Generate filename with test code and timestamp
    const fileName = `${examType.toUpperCase()}_Marks_${selectedTestCode}_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  // Export District Statistics to Excel
  const exportDistrictStatistics = () => {
    if (!districtStatistics || districtStatistics.length === 0) {
      alert("No district statistics to export");
      return;
    }

    const exportData = districtStatistics.map((row, index) => ({
      "S.No": index + 1,
      "District Code": row.code,
      "District Name": row.name,
      "Total Students": row.count,
      "Median Score": row.median,
      "Average Score": row.average,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "District Statistics");

    const fileName = `District_Statistics_${selectedTestCode}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export Question Bank Details to Excel
  const exportQBDetails = () => {
    if (!filteredQbDetails || filteredQbDetails.length === 0) {
      alert("No QB details to export");
      return;
    }

    const exportData = filteredQbDetails.map((row, index) => ({
      "S.No": index + 1,
      "District Code": row.BATCHNAME,
      "District Name": row.District_Name,
      "Question No": row.Qno,
      Correct: row.Correct || 0,
      Wrong: row.Wrong || 0,
      Blank: row.Blank || 0,
      "Import Date": row.ImpDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QB Details");

    const districtInfo = selectedQbDistrict
      ? qbDistricts.find((d) => d.code === selectedQbDistrict)
      : null;
    const districtSuffix = districtInfo
      ? `_${districtInfo.code}_${districtInfo.name.replace(/\s+/g, "_")}`
      : "_All_Districts";
    const fileName = `QB_Details_${selectedTestCode}${districtSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export Question Statistics to Excel
  const exportQuestionStatistics = () => {
    if (!filteredQuestionStats || filteredQuestionStats.length === 0) {
      alert("No question statistics to export");
      return;
    }

    const exportData = filteredQuestionStats.map((row, index) => ({
      "S.No": index + 1,
      "District Code": row.D_CODE,
      "District Name": row.District_Name,
      "Medium": row.Medium === 'E' ? 'English' : row.Medium === 'T' ? 'Tamil' : row.Medium,
      "Question No": row.Qno,
      Correct: row.Correct || 0,
      Wrong: row.Wrong || 0,
      Blank: row.Blank || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Question Statistics");

    const districtInfo = selectedQsDistrict
      ? qsDistricts.find((d) => d.code === selectedQsDistrict)
      : null;
    const mediumSuffix = selectedMedium ? `_${selectedMedium === 'E' ? 'English' : 'Tamil'}` : '_All_Mediums';
    const districtSuffix = districtInfo
      ? `_${districtInfo.code}_${districtInfo.name.replace(/\s+/g, "_")}`
      : "_All_Districts";
    const fileName = `Question_Statistics_${selectedTestCode}${districtSuffix}${mediumSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Fetch field names for dynamic column mapping
  const { data: jeeFieldnamesData, isLoading: loadingJeeFieldnames } =
    useGetFieldnamesQuery();
  const { data: neetFieldnamesData, isLoading: loadingNeetFieldnames } =
    useGetNeetFieldnamesQuery();
  const { data: cuetFieldnamesData, isLoading: loadingCuetFieldnames } =
    useGetCuetFieldnamesQuery();
  const { data: gaFieldnamesData, isLoading: loadingGaFieldnames } =
    useGetGeneralAbilityFieldnamesQuery();
  const columnMapping = useMemo(
    () =>
      examType === "jee"
        ? jeeFieldnamesData?.data?.mapping || {}
        : examType === "neet"
          ? neetFieldnamesData?.data?.mapping || {}
          : examType === "cuet"
            ? cuetFieldnamesData?.data?.mapping || {}
            : examType === "generalability"
              ? gaFieldnamesData?.data?.mapping || {}
              : {},
    [examType, jeeFieldnamesData, neetFieldnamesData, cuetFieldnamesData, gaFieldnamesData],
  );
  const loadingFieldnames =
    examType === "jee"
      ? loadingJeeFieldnames
      : examType === "neet"
        ? loadingNeetFieldnames
        : examType === "cuet"
          ? loadingCuetFieldnames
          : loadingGaFieldnames;

  // Fetch test codes - data is cached for 5 minutes
  // Conditional API calls based on exam type
  // JEE Test Codes
  const { data: jeeTestCodesData, isLoading: jeeTestLoading } =
    useGetTestCodesForReportQuery();
  
  // NEET Test Codes
  const { data: neetTestCodesData, isLoading: neetTestLoading } =
    useGetNeetTestCodesForReportQuery();

  // CUET Test Codes
  const { data: cuetTestCodesData, isLoading: cuetTestLoading } =
    useGetCuetTestCodesForReportQuery();

  // Current Affairs Test Codes
  const { data: caTestCodesData, isLoading: caTestLoading } =
    useGetCurrentAffairsTestCodesForReportQuery();
  const { data: gaTestCodesData, isLoading: gaTestLoading } =
    useGetGeneralAbilityTestCodesForReportQuery();
  const { data: humanitiesTestCodesData, isLoading: humanitiesTestLoading } =
    useGetHumanitiesTestCodesForReportQuery();
  const { data: qaTestCodesData, isLoading: qaTestLoading } =
    useGetQuantitativeTestCodesForReportQuery();
  const { data: foundationTestCodesData, isLoading: foundationTestLoading } =
    useGetFoundationTestCodesForReportQuery();
  const { data: spokenEnglishTestCodesData, isLoading: spokenEnglishTestLoading } =
    useGetSpokenEnglishTestCodesForReportQuery();
  const { data: clatTestCodesData, isLoading: clatTestLoading } =
    useGetClatTestCodesForReportQuery();

  // Use appropriate test codes based on exam type
  const testCodesData =
    examType === "jee"
      ? jeeTestCodesData
      : examType === "neet"
        ? neetTestCodesData
        : examType === "cuet"
          ? cuetTestCodesData
          : examType === "quantitative"
            ? qaTestCodesData
          : examType === "foundation"
            ? foundationTestCodesData
          : examType === "spokenenglish"
            ? spokenEnglishTestCodesData
          : examType === "currentaffairs"
            ? caTestCodesData
          : examType === "generalability"
            ? gaTestCodesData
          : examType === "clat"
            ? clatTestCodesData
            : humanitiesTestCodesData;
  const loadingTests =
    examType === "jee"
      ? jeeTestLoading
      : examType === "neet"
        ? neetTestLoading
        : examType === "cuet"
          ? cuetTestLoading
          : examType === "quantitative"
            ? qaTestLoading
          : examType === "foundation"
            ? foundationTestLoading
          : examType === "spokenenglish"
            ? spokenEnglishTestLoading
          : examType === "currentaffairs"
            ? caTestLoading
          : examType === "generalability"
            ? gaTestLoading
          : examType === "clat"
            ? clatTestLoading
            : humanitiesTestLoading;
  const testError = null;
  
  const testCodes = useMemo(() => testCodesData?.data || [], [testCodesData]);

  // Fetch marks for selected test code - data is cached for 5 minutes
  // JEE Marks
  const { data: jeeMarksData, isLoading: jeeMarksLoading } =
    useGetJeeMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });

  // NEET Marks
  const { data: neetMarksData, isLoading: neetMarksLoading } =
    useGetNeetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });

  // CUET Marks
  const { data: cuetMarksData, isLoading: cuetMarksLoading } =
    useGetCuetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });

  // Current Affairs Marks
  const { data: caMarksData, isLoading: caMarksLoading } =
    useGetCurrentAffairsMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "currentaffairs",
    });
  const { data: gaMarksData, isLoading: gaMarksLoading } =
    useGetGeneralAbilityMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "generalability",
    });
  const { data: humanitiesMarksData, isLoading: humanitiesMarksLoading } =
    useGetHumanitiesMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "humanities",
    });
  const { data: qaMarksData, isLoading: qaMarksLoading } =
    useGetQuantitativeMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "quantitative",
    });
  const { data: foundationMarksData, isLoading: foundationMarksLoading } =
    useGetFoundationMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "foundation",
    });
  const { data: spokenEnglishMarksData, isLoading: spokenEnglishMarksLoading } =
    useGetSpokenEnglishMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "spokenenglish",
    });
  const { data: clatMarksData, isLoading: clatMarksLoading } =
    useGetClatMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "clat",
    });

  // Use appropriate marks data
  const marksData =
    examType === "jee"
      ? jeeMarksData
      : examType === "neet"
        ? neetMarksData
        : examType === "cuet"
          ? cuetMarksData
          : examType === "quantitative"
            ? qaMarksData
          : examType === "foundation"
            ? foundationMarksData
          : examType === "spokenenglish"
            ? spokenEnglishMarksData
          : examType === "currentaffairs"
            ? caMarksData
          : examType === "generalability"
            ? gaMarksData
          : examType === "clat"
            ? clatMarksData
            : humanitiesMarksData;
  const loadingMarks =
    examType === "jee"
      ? jeeMarksLoading
      : examType === "neet"
        ? neetMarksLoading
        : examType === "cuet"
          ? cuetMarksLoading
          : examType === "quantitative"
            ? qaMarksLoading
          : examType === "foundation"
            ? foundationMarksLoading
          : examType === "spokenenglish"
            ? spokenEnglishMarksLoading
          : examType === "currentaffairs"
            ? caMarksLoading
          : examType === "generalability"
            ? gaMarksLoading
          : examType === "clat"
            ? clatMarksLoading
            : humanitiesMarksLoading;
  const marksError = null;

  const testMaster = marksData?.data?.testMaster || null;
  const marks = useMemo(() => marksData?.data?.marks || [], [marksData]);

  // Fetch QB details for selected test code
  // JEE QB Details
  const { data: jeeQbDetailsData, isLoading: jeeQbLoading } =
    useGetJeeQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });

  // NEET QB Details
  const { data: neetQbDetailsData, isLoading: neetQbLoading } =
    useGetNeetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });

  // CUET QB Details
  const { data: cuetQbDetailsData, isLoading: cuetQbLoading } =
    useGetCuetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });

  // Current Affairs QB Details
  const { data: caQbDetailsData, isLoading: caQbLoading } =
    useGetCurrentAffairsQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "currentaffairs",
    });
  const { data: gaQbDetailsData, isLoading: gaQbLoading } =
    useGetGeneralAbilityQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "generalability",
    });
  const { data: humanitiesQbDetailsData, isLoading: humanitiesQbLoading } =
    useGetHumanitiesQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "humanities",
    });
  const { data: qaQbDetailsData, isLoading: qaQbLoading } =
    useGetQuantitativeQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "quantitative",
    });
  const { data: foundationQbDetailsData, isLoading: foundationQbLoading } =
    useGetFoundationQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "foundation",
    });
  const { data: spokenEnglishQbDetailsData, isLoading: spokenEnglishQbLoading } =
    useGetSpokenEnglishQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "spokenenglish",
    });
  const { data: clatQbDetailsData, isLoading: clatQbLoading } =
    useGetClatQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "clat",
    });

  const qbDetailsData =
    examType === "jee"
      ? jeeQbDetailsData
      : examType === "neet"
        ? neetQbDetailsData
        : examType === "cuet"
          ? cuetQbDetailsData
          : examType === "quantitative"
            ? qaQbDetailsData
          : examType === "foundation"
            ? foundationQbDetailsData
          : examType === "spokenenglish"
            ? spokenEnglishQbDetailsData
          : examType === "currentaffairs"
            ? caQbDetailsData
          : examType === "generalability"
            ? gaQbDetailsData
          : examType === "clat"
            ? clatQbDetailsData
            : humanitiesQbDetailsData;
  const loadingQbDetails =
    examType === "jee"
      ? jeeQbLoading
      : examType === "neet"
        ? neetQbLoading
        : examType === "cuet"
          ? cuetQbLoading
          : examType === "quantitative"
            ? qaQbLoading
          : examType === "foundation"
            ? foundationQbLoading
          : examType === "spokenenglish"
            ? spokenEnglishQbLoading
          : examType === "currentaffairs"
            ? caQbLoading
          : examType === "generalability"
            ? gaQbLoading
          : examType === "clat"
            ? clatQbLoading
            : humanitiesQbLoading;
  const qbDetails = useMemo(() => qbDetailsData?.data?.qbDetails || [], [qbDetailsData]);

  // Fetch subject-wise statistics
  // JEE Subject Stats
  const { data: jeeSubjectStatsData, isLoading: jeeSubjectStatsLoading } =
    useGetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "jee" }
    );

  // NEET Subject Stats
  const { data: neetSubjectStatsData, isLoading: neetSubjectStatsLoading } =
    useGetNeetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "neet" }
    );

  // CUET Subject Stats
  const { data: cuetSubjectStatsData, isLoading: cuetSubjectStatsLoading } =
    useGetCuetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "cuet" }
    );

  // Current Affairs Subject Stats
  const { data: caSubjectStatsData, isLoading: caSubjectStatsLoading } =
    useGetCurrentAffairsSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "currentaffairs" }
    );
  const { data: gaSubjectStatsData, isLoading: gaSubjectStatsLoading } =
    useGetGeneralAbilitySubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "generalability" }
    );
  const { data: humanitiesSubjectStatsData, isLoading: humanitiesSubjectStatsLoading } =
    useGetHumanitiesSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "humanities" }
    );
  const { data: qaSubjectStatsData, isLoading: qaSubjectStatsLoading } =
    useGetQuantitativeSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "quantitative" }
    );
  const { data: foundationSubjectStatsData, isLoading: foundationSubjectStatsLoading } =
    useGetFoundationSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: selectedDistrict },
      { skip: !selectedTestCode || examType !== "foundation" }
    );
  const {
    data: spokenEnglishSubjectStatsData,
    isLoading: spokenEnglishSubjectStatsLoading,
  } = useGetSpokenEnglishSubjectWiseStatsByTestCodeQuery(
    { testCode: selectedTestCode, districtCode: selectedDistrict },
    { skip: !selectedTestCode || examType !== "spokenenglish" }
  );

  const subjectStatsData =
    examType === "jee"
      ? jeeSubjectStatsData
      : examType === "neet"
        ? neetSubjectStatsData
        : examType === "cuet"
          ? cuetSubjectStatsData
          : examType === "quantitative"
            ? qaSubjectStatsData
          : examType === "foundation"
            ? foundationSubjectStatsData
          : examType === "spokenenglish"
            ? spokenEnglishSubjectStatsData
          : examType === "currentaffairs"
            ? caSubjectStatsData
          : examType === "generalability"
            ? gaSubjectStatsData
            : humanitiesSubjectStatsData;
  const loadingSubjectStats =
    examType === "jee"
      ? jeeSubjectStatsLoading
      : examType === "neet"
        ? neetSubjectStatsLoading
        : examType === "cuet"
          ? cuetSubjectStatsLoading
          : examType === "quantitative"
            ? qaSubjectStatsLoading
          : examType === "foundation"
            ? foundationSubjectStatsLoading
          : examType === "spokenenglish"
            ? spokenEnglishSubjectStatsLoading
          : examType === "currentaffairs"
            ? caSubjectStatsLoading
          : examType === "generalability"
            ? gaSubjectStatsLoading
            : humanitiesSubjectStatsLoading;

  const subjectStats = useMemo(
    () =>
      subjectStatsData?.data || {
        overall: null,
        byDistrict: [],
      },
    [subjectStatsData],
  );

  // Fetch question statistics for selected test code
  // JEE Question Statistics
  const { data: jeeQuestionStatsData, isLoading: jeeQuestionStatsLoading } =
    useGetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });

  // NEET Question Statistics
  const { data: neetQuestionStatsData, isLoading: neetQuestionStatsLoading } =
    useGetNeetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });

  // CUET Question Statistics
  const { data: cuetQuestionStatsData, isLoading: cuetQuestionStatsLoading } =
    useGetCuetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });

  const questionStatsData =
    examType === "jee"
      ? jeeQuestionStatsData
      : examType === "neet"
        ? neetQuestionStatsData
        : cuetQuestionStatsData;
  const loadingQuestionStats =
    examType === "jee"
      ? jeeQuestionStatsLoading
      : examType === "neet"
        ? neetQuestionStatsLoading
        : cuetQuestionStatsLoading;
  const questionStats = useMemo(
    () => questionStatsData?.data?.questionStatistics || [],
    [questionStatsData],
  );

  const hasSubjectStats = useMemo(() => {
    if (!selectedTestCode || !subjectStats?.overall) return false;
    if (examType === "currentaffairs") {
      return Boolean(subjectStats.overall.part1);
    }
    if (examType === "generalability") {
      return Boolean(subjectStats.overall.verbalAbility);
    }
    if (examType === "humanities") {
      return Boolean(subjectStats.overall.economics);
    }
    if (examType === "quantitative") {
      return Boolean(subjectStats.overall.quantitativeAptitude);
    }
    if (examType === "foundation") {
      return Boolean(subjectStats.overall.physics);
    }
    if (examType === "spokenenglish") {
      return Boolean(subjectStats.overall.listening);
    }
    const requiredSubjects =
      examType === "jee"
        ? ["physics", "chemistry", "maths"]
        : examType === "neet"
          ? ["physics", "chemistry", "botany", "zoology"]
          : ["accountancy", "economics", "businessStudiesCommerce", "businessMaths"];
    return requiredSubjects.every((key) => Boolean(subjectStats.overall[key]));
  }, [selectedTestCode, subjectStats, examType]);

  // Get unique districts from QB Details for filtering with names
  const qbDistricts = (() => {
    const districtMap = new Map();
    qbDetails.forEach((item) => {
      if (item.BATCHNAME && !districtMap.has(item.BATCHNAME)) {
        districtMap.set(item.BATCHNAME, item.District_Name || item.BATCHNAME);
      }
    });

    // Convert to array and sort by district code
    return Array.from(districtMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  })();

  // Filter QB Details by selected district
  const filteredQbDetails = (() => {
    if (!selectedQbDistrict) {
      return qbDetails; // Show all districts when no filter selected
    }
    return qbDetails.filter((item) => item.BATCHNAME === selectedQbDistrict);
  })();

  // Get unique districts from Question Statistics for filtering
  const qsDistricts = (() => {
    const districtMap = new Map();
    questionStats.forEach((item) => {
      if (item.D_CODE && !districtMap.has(item.D_CODE)) {
        districtMap.set(item.D_CODE, item.District_Name || item.D_CODE);
      }
    });

    // Convert to array and sort by district code
    return Array.from(districtMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  })();

  // Filter Question Statistics by selected medium and district
  const filteredQuestionStats = (() => {
    let filtered = questionStats;
    
    // Filter by district
    if (selectedQsDistrict) {
      filtered = filtered.filter((item) => item.D_CODE === selectedQsDistrict);
    }
    
    // Filter by medium
    if (selectedMedium) {
      filtered = filtered.filter((item) => item.Medium === selectedMedium);
    }
    
    return filtered;
  })();

  // Calculate district-wise median and average
  const districtStatistics = (() => {
    if (!marks || marks.length === 0) return [];

    // Group marks by district
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!district) return;

      if (!districtGroups[district]) {
        districtGroups[district] = {
          code: district,
          name: mark.District_Name,
          scores: [],
        };
      }

      if (mark.TOTAL !== null && mark.TOTAL !== undefined) {
        districtGroups[district].scores.push(parseFloat(mark.TOTAL));
      }
    });

    // Calculate median and average for each district
    const statistics = Object.values(districtGroups).map((district) => {
      const scores = district.scores.sort((a, b) => a - b);
      const count = scores.length;

      // Calculate median
      let median = 0;
      if (count > 0) {
        const mid = Math.floor(count / 2);
        median =
          count % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid];
      }

      // Calculate average
      const average =
        count > 0 ? scores.reduce((sum, score) => sum + score, 0) / count : 0;

      return {
        code: district.code,
        name: district.name,
        count,
        median: median.toFixed(2),
        average: average.toFixed(2),
      };
    });

    return statistics.sort((a, b) => a.code.localeCompare(b.code));
  })();

  // Get unique districts from marks data
  const districts = useMemo(() => {
    const uniqueDistricts = [
      ...new Set(marks.map((m) => m.BATCHNAME).filter(Boolean)),
    ];
    return uniqueDistricts.sort().map((code) => ({
      code,
      name: marks.find((m) => m.BATCHNAME === code)?.District_Name || code,
    }));
  }, [marks]);

  // Define columns for DataTable
  const columns = useMemo(() => {
    if (examType === "jee") {
      return getJeeMarksColumns({ columnMapping, selectedDistrict });
    }
    if (examType === "neet") {
      return getNeetMarksColumns({ columnMapping, selectedDistrict });
    }
    if (examType === "cuet") {
      return getCuetMarksColumns({ columnMapping, selectedDistrict });
    }
    if (examType === "generalability") {
      return getGeneralAbilityMarksColumns({ columnMapping, selectedDistrict });
    }
    if (examType === "humanities") {
      return getHumanitiesMarksColumns({ columnMapping, selectedDistrict });
    }
    if (examType === "clat") {
      return getClatMarksColumns({ selectedDistrict, testCode: selectedTestCode });
    }
    if (examType === "quantitative") {
      return getQuantitativeMarksColumns({ selectedDistrict, marks });
    }
    if (examType === "foundation") {
      return getFoundationMarksColumns({ selectedDistrict });
    }
    if (examType === "spokenenglish") {
      return getSpokenEnglishMarksColumns({ selectedDistrict });
    }
    return getCurrentAffairsMarksColumns({ selectedDistrict });
  }, [columnMapping, selectedDistrict, examType, marks, selectedTestCode]);

  // Parse CORANS to get max question count
  const maxQuestions = useMemo(() => {
    if (!marks || marks.length === 0) return 0;
    let max = 0;
    marks.forEach((mark) => {
      if (mark.CORANS) {
        // Do NOT remove spaces - spaces indicate questions not conducted
        max = Math.max(max, mark.CORANS.length);
      }
    });
    console.log("Max Questions Found:", max); // Debug log
    return max;
  }, [marks]);

  // Answer analysis columns
  const answerAnalysisColumns = useMemo(() => {
    const baseColumns = [
      {
        name: "EMIS No",
        selector: (row) => row.ROLLNO,
        sortable: true,
        width: "120px",
        wrap: true,
      },
      {
        name: "Test Code",
        selector: (row) => row.Test_Code,
        sortable: true,
        width: "120px",
      },
      {
        name: "Student Name",
        selector: (row) => row.Candidate_Name,
        sortable: true,
        width: "200px",
        wrap: true,
      },
      {
        name: "District",
        selector: (row) => row.District_Name,
        sortable: true,
        width: "150px",
        wrap: true,
      },
      {
        name: "District Code",
        selector: (row) => row.BATCHNAME,
        sortable: true,
        width: "130px",
      },
    ];

    // Add question columns
    const questionColumns = [];
    for (let i = 1; i <= maxQuestions; i++) {
      questionColumns.push({
        name: `Q${i}`,
        selector: (row) => {
          if (!row.CORANS) return "-";
          // Keep spaces - they indicate questions not conducted
          const answer = row.CORANS[i - 1];
          if (!answer || answer === " ") return "-";
          return answer.toUpperCase();
        },
        sortable: true,
        center: true,
        width: "170px",
        cell: (row) => {
          if (!row.CORANS) return <span>-</span>;
          // Keep spaces - they indicate questions not conducted
          const answer = row.CORANS[i - 1];
          if (!answer || answer === " ") return <span>Not Conducted</span>;

          const answerUpper = answer.toUpperCase();

          if (answerUpper === "C") {
            return "Correct";
          } else if (answerUpper === "W") {
            return "Wrong";
          } else if (answerUpper === "B") {
            return "Blank";
          } else {
            return answerUpper;
          }
        },
      });
    }

    return [...baseColumns, ...questionColumns];
  }, [maxQuestions]);

  // Filter marks based on search text and district
  const filteredMarks = useMemo(() => {
    let filtered = marks;

    // Filter by district
    if (selectedDistrict) {
      filtered = filtered.filter((item) => item.BATCHNAME === selectedDistrict);
    }

    // Filter by search text
    if (filterText) {
      const searchText = filterText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.Candidate_Name &&
            item.Candidate_Name.toLowerCase().includes(searchText)) ||
          (item.ROLLNO &&
            item.ROLLNO.toString().toLowerCase().includes(searchText)) ||
          (item.BATCHNAME &&
            item.BATCHNAME.toLowerCase().includes(searchText)) ||
          (item.District_Name &&
            item.District_Name.toLowerCase().includes(searchText)),
      );
    }

    return filtered;
  }, [marks, filterText, selectedDistrict]);

  // Calculate overall ranks for all marks (cached per test)
  const overallRanksMap = useMemo(() => {
    if (!marks || marks.length === 0) return new Map();

    const sorted = [...marks].sort((a, b) => {
      const totalA = parseFloat(a.TOTAL) || 0;
      const totalB = parseFloat(b.TOTAL) || 0;
      return totalB - totalA;
    });

    const rankMap = new Map();
    let currentRank = 1;
    sorted.forEach((item, index) => {
      if (index > 0) {
        const prevTotal = parseFloat(sorted[index - 1].TOTAL) || 0;
        const currentTotal = parseFloat(item.TOTAL) || 0;
        if (currentTotal < prevTotal) {
          currentRank = index + 1;
        }
      }
      rankMap.set(item.ROLLNO || item.id, currentRank);
    });
    return rankMap;
  }, [marks]);

  // Calculate district ranks when district is selected
  const districtRanksMap = useMemo(() => {
    if (!selectedDistrict || !marks || marks.length === 0) return new Map();

    const districtMarks = marks.filter(
      (item) => item.BATCHNAME === selectedDistrict,
    );
    const sorted = [...districtMarks].sort((a, b) => {
      const totalA = parseFloat(a.TOTAL) || 0;
      const totalB = parseFloat(b.TOTAL) || 0;
      return totalB - totalA;
    });

    const rankMap = new Map();
    let currentRank = 1;
    sorted.forEach((item, index) => {
      if (index > 0) {
        const prevTotal = parseFloat(sorted[index - 1].TOTAL) || 0;
        const currentTotal = parseFloat(item.TOTAL) || 0;
        if (currentTotal < prevTotal) {
          currentRank = index + 1;
        }
      }
      rankMap.set(item.ROLLNO || item.id, currentRank);
    });
    return rankMap;
  }, [marks, selectedDistrict]);

  // Apply ranks to filtered marks
  const rankedMarks = (() => {
    if (!filteredMarks || filteredMarks.length === 0) return [];

    return filteredMarks.map((item) => {
      const studentId = item.ROLLNO || item.id;
      return {
        ...item,
        overallRank: overallRanksMap.get(studentId),
        districtRank: selectedDistrict ? districtRanksMap.get(studentId) : null,
      };
    });
  })();

  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#2c5aa0",
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
        minHeight: "48px",
      },
    },
    rows: {
      style: {
        minHeight: "48px",
        "&:hover": {
          backgroundColor: "#f5f5f5",
        },
      },
      stripedStyle: {
        backgroundColor: "#fafafa",
      },
    },
    cells: {
      style: {
        fontSize: "13px",
        padding: "8px",
      },
    },
  };

  return (
    <Container fluid className="admin-report-dashboard py-4">
      {/* Loading fieldnames */}
      {loadingFieldnames && (
        <Card className="shadow-sm mb-4">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading field configurations...</p>
          </Card.Body>
        </Card>
      )}

      {/* Header Section */}
      <Card className="shadow-sm mb-4 header-card">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h3 className="mb-1">
                <FaFileAlt className="me-2 text-primary" />
                {examType === "jee" ? "JEE" : examType === "neet" ? "NEET" : examType === "cuet" ? "CUET" : examType === "quantitative" ? "QUANTITATIVE APTITUDE" : examType === "foundation" ? "FOUNDATION" : examType === "spokenenglish" ? "SPOKEN ENGLISH" : examType === "generalability" ? "GENERAL ABILITY" : examType === "humanities" ? "HUMANITIES" : "CURRENT AFFAIRS"} Marks Report
              </h3>
              <p className="text-muted mb-0">
                View and analyze {examType === "jee" ? "JEE" : examType === "neet" ? "NEET" : examType === "cuet" ? "CUET" : examType === "quantitative" ? "QUANTITATIVE APTITUDE" : examType === "foundation" ? "FOUNDATION" : examType === "spokenenglish" ? "SPOKEN ENGLISH" : examType === "generalability" ? "GENERAL ABILITY" : examType === "humanities" ? "HUMANITIES" : "CURRENT AFFAIRS"} examination marks data
              </p>
            </div>
            <div className="text-end">
              <FaChartLine size={48} className="text-primary opacity-25" />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form.Group className="mb-0">
            <Form.Label className="fw-semibold mb-2">Select Subject</Form.Label>
            <Form.Select
              value={examType}
              onChange={(e) => {
                setExamType(e.target.value);
                setSelectedTestCode("");
                setSelectedDistrict("");
                setFilterText("");
              }}
              className="w-auto min-w-250px"
            >
              {examOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Test Selection */}
      <Card className="shadow-sm mb-4">
        <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
          <h5 className="mb-0">Select Test</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={12}>
              <Form.Group>
                {loadingTests ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading test codes...</span>
                  </div>
                ) : testError ? (
                  <Alert variant="danger">Error loading test codes</Alert>
                ) : (
                  <Form.Select
                    value={selectedTestCode}
                    onChange={(e) => {
                      setSelectedTestCode(e.target.value);
                      setSelectedDistrict("");
                      setFilterText("");
                    }}
                    size="lg"
                  >
                    <option value="">-- Select Test Code --</option>
                    {testCodes.map((test) => (
                      <option key={test.testcode} value={test.testcode}>
                        {test.testcode} - {test.Test_Name} - Std: {test.std}th
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Test Details Header */}
          {testMaster && (
            <Card className="mt-4 test-info-card">
              <Card.Body className="py-3">
                <Row className="align-items-center mb-3">
                  <Col md={12}>
                    <h5 className="mb-2 text-primary">
                      {testMaster.Test_Name}
                    </h5>
                    <div className="d-flex gap-3 flex-wrap">
                      <Badge bg="info" className="px-3 py-2">
                        Standard: {testMaster.std}th
                      </Badge>
                      <Badge bg="success" className="px-3 py-2">
                        Test Date: {testMaster.testdate}
                      </Badge>
                      <Badge bg="warning" text="dark" className="px-3 py-2">
                        Total Students: {marks.length}
                      </Badge>
                      {selectedDistrict && (
                        <Badge bg="secondary" className="px-3 py-2">
                          Filtered: {rankedMarks.length}
                        </Badge>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                      >
                        <option value="">-- All Districts --</option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.code} - {district.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        placeholder="Search by name, EMIS no, or district..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid #dee2e6" }}
                >
                  <Col md={12}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <FaClipboardList className="text-primary" size={20} />
                        <Form.Check
                          type="switch"
                          id="answer-analysis-switch"
                          label={
                            <strong>
                              Show Answer Analysis (Question-wise C/W/B)
                            </strong>
                          }
                          checked={showAnswerAnalysis}
                          onChange={(e) =>
                            setShowAnswerAnalysis(e.target.checked)
                          }
                          style={{ fontSize: "15px" }}
                        />
                      </div>
                      {showAnswerAnalysis && (
                        <div className="d-flex gap-2">
                          <Badge bg="success">C = Correct</Badge>
                          <Badge bg="danger">W = Wrong</Badge>
                          <Badge bg="warning" text="dark">
                            B = Blank
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Data Table */}
      {selectedTestCode && (
        <Card className="shadow-sm mb-4">
          <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt />
                <h5 className="mb-0">{examType.toUpperCase()} Marks Report</h5>
              </div>
              <Button
                variant="light"
                size="sm"
                onClick={exportToExcel}
                className="d-flex align-items-center gap-2"
              >
                <FaFileExcel /> Export to Excel
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loadingMarks ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading marks data...</p>
              </div>
            ) : marksError ? (
              <Alert variant="danger" className="m-3">
                Error loading marks data
              </Alert>
            ) : marks.length === 0 ? (
              <Alert variant="warning" className="m-3">
                No marks data available for this test code
              </Alert>
            ) : (
              <DataTable
                columns={showAnswerAnalysis ? answerAnalysisColumns : columns}
                data={rankedMarks}
                pagination
                paginationPerPage={50}
                paginationRowsPerPageOptions={[25, 50, 100, 200]}
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                fixedHeader
                fixedHeaderScrollHeight="600px"
                noDataComponent={
                  <div className="text-center py-5">
                    <p className="text-muted">No records match your search</p>
                  </div>
                }
              />
            )}
          </Card.Body>
        </Card>
      )}

      {/* Subject-wise Average and Median Report */}
      {hasSubjectStats &&
        (examType === "jee" ? (
          <JeeSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "neet" ? (
          <NeetSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "cuet" ? (
          <CuetSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "generalability" ? (
          <GeneralAbilitySubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "humanities" ? (
          <HumanitiesSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "quantitative" ? (
          <QuantitativeSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "foundation" ? (
          <FoundationSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "spokenenglish" ? (
          <SpokenEnglishSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : (
          <CurrentAffairsSubjectStatsSection
            selectedDistrict={selectedDistrict}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ))}

      {/* District Statistics and QB Details - Two Cards Side by Side */}
      {selectedTestCode && marks.length > 0 && (
        <Row className="mt-4">
          {/* District-wise Statistics Card */}
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header
                style={{ backgroundColor: "#2c5aa0", color: "white" }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <FaCalculator />
                    <h5 className="mb-0">District-wise Statistics</h5>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={exportDistrictStatistics}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileExcel /> Export
                  </Button>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {districtStatistics.length === 0 ? (
                  <Alert variant="info" className="m-3">
                    No district data available
                  </Alert>
                ) : (
                  <DataTable
                    columns={[
                      {
                        name: "District Code",
                        selector: (row) => row.code,
                        sortable: true,
                        width: "120px",
                      },
                      {
                        name: "District Name",
                        selector: (row) => row.name,
                        sortable: true,
                        width: "200px",
                        wrap: true,
                      },
                      {
                        name: "Students",
                        selector: (row) => row.count,
                        sortable: true,
                        right: true,
                        width: "200px",
                      },
                      {
                        name: "Median",
                        selector: (row) => row.median,
                        sortable: true,
                        right: true,
                        width: "200px",
                      },
                      {
                        name: "Average",
                        selector: (row) => row.average,
                        sortable: true,
                        right: true,
                        width: "200px",
                      },
                    ]}
                    data={districtStatistics}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50]}
                    highlightOnHover
                    striped
                    customStyles={{
                      header: {
                        style: {
                          backgroundColor: "transparent",
                          padding: 0,
                          minHeight: 0,
                        },
                      },
                      subHeader: {
                        style: {
                          backgroundColor: "transparent",
                          padding: 0,
                          minHeight: 0,
                        },
                      },
                      table: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                      tableWrapper: {
                        style: {
                          backgroundColor: "transparent",
                          display: "table",
                        },
                      },
                      responsiveWrapper: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                      headRow: {
                        style: {
                          backgroundColor: "#f8f9fa",
                          minHeight: "48px",
                          borderBottomWidth: "2px",
                          borderBottomColor: "#dee2e600",
                          borderBottomStyle: "solid",
                        },
                      },
                      headCells: {
                        style: {
                          backgroundColor: "#f8f9fa00",
                          fontWeight: "bold",
                          fontSize: "14px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                        },
                      },
                      cells: {
                        style: {
                          fontSize: "14px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                        },
                      },
                      pagination: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                    }}
                  />
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* JEE QB Details Card */}
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header
                style={{ backgroundColor: "#2c5aa0", color: "white" }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaListAlt />
                    <h5 className="mb-0">Question Bank Details</h5>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={exportQBDetails}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileExcel /> Export
                  </Button>
                </div>
                <Row className="align-items-center">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Select
                        value={selectedQbDistrict}
                        onChange={(e) => setSelectedQbDistrict(e.target.value)}
                        size="sm"
                        style={{
                          backgroundColor: "white",
                          border: "2px solid #fff",
                        }}
                      >
                        <option value="">
                          All Districts ({qbDistricts.length})
                        </option>
                        {qbDistricts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.code} - {district.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="text-end">
                    <small className="text-white">
                      Showing: {filteredQbDetails.length} records
                    </small>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                {loadingQbDetails ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" size="sm" />
                    <p className="mt-3">Loading QB details...</p>
                  </div>
                ) : filteredQbDetails.length === 0 ? (
                  <Alert variant="info" className="m-3">
                    {selectedQbDistrict
                      ? `No QB details available for district: ${qbDistricts.find((d) => d.code === selectedQbDistrict)?.name || selectedQbDistrict}`
                      : "No QB details available for this test"}
                  </Alert>
                ) : (
                  <DataTable
                    data={filteredQbDetails}
                    columns={[
                      {
                        name: "District Code",
                        selector: (row) => row.BATCHNAME,
                        sortable: true,
                        width: "120px",
                      },
                      {
                        name: "District Name",
                        selector: (row) => row.District_Name,
                        sortable: true,
                        width: "200px",
                      },
                      {
                        name: "Q.No",
                        selector: (row) => row.Qno,
                        sortable: true,
                        center: true,
                        width: "100px",
                      },
                      {
                        name: "Correct",
                        selector: (row) => row.Correct,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                      {
                        name: "Wrong",
                        selector: (row) => row.Wrong,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                      {
                        name: "Blank",
                        selector: (row) => row.Blank,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                    ]}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    highlightOnHover
                    striped
                    customStyles={{
                      header: {
                        style: {
                          backgroundColor: "transparent",
                          padding: 0,
                          minHeight: 0,
                        },
                      },
                      subHeader: {
                        style: {
                          backgroundColor: "transparent",
                          padding: 0,
                          minHeight: 0,
                        },
                      },
                      table: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                      tableWrapper: {
                        style: {
                          backgroundColor: "transparent",
                          display: "table",
                        },
                      },
                      responsiveWrapper: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                      headRow: {
                        style: {
                          backgroundColor: "#f8f9fa00",
                          minHeight: "48px",
                          borderBottomWidth: "2px",
                          borderBottomColor: "#dee2e6",
                          borderBottomStyle: "solid",
                        },
                      },
                      headCells: {
                        style: {
                          backgroundColor: "#f8f9fa00",
                          fontWeight: "bold",
                          fontSize: "14px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                        },
                      },
                      cells: {
                        style: {
                          fontSize: "14px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                        },
                      },
                      pagination: {
                        style: {
                          backgroundColor: "transparent",
                        },
                      },
                    }}
                  />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Question Bank Statistics Card */}
      {selectedTestCode && questionStats.length > 0 && (
        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header
                style={{ backgroundColor: "#2c5aa0", color: "white" }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <FaClipboardList />
                    <h5 className="mb-0">
                      Question Bank Statistics - Medium wise
                      {examType === "jee" ? "JEE" : examType === "neet" ? "NEET" : examType === "cuet" ? "CUET" : examType === "quantitative" ? "QUANTITATIVE APTITUDE" : examType === "generalability" ? "GENERAL ABILITY" : "Current Affairs"} Marks Report
                    </h5>
                  </div>
                  <Button
                    size="sm"
                    onClick={exportQuestionStatistics}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaFileExcel /> Export
                  </Button>
                </div>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <div className="p-3 pb-0">
                  <Row className="mb-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          Filter by District
                        </Form.Label>
                        <Form.Select
                          value={selectedQsDistrict}
                          onChange={(e) => setSelectedQsDistrict(e.target.value)}
                        >
                          <option value="">
                            All Districts ({qsDistricts.length})
                          </option>
                          {qsDistricts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.code} - {district.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          Filter by Medium
                        </Form.Label>
                        <Form.Select
                          value={selectedMedium}
                          onChange={(e) => setSelectedMedium(e.target.value)}
                        >
                          <option value="">-- All Mediums --</option>
                          <option value="E">English</option>
                          <option value="T">Tamil</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end">
                      <div className="text-muted">
                        <small>
                          Total Records:{" "}
                          <Badge bg="info">
                            {filteredQuestionStats.length}
                          </Badge>
                        </small>
                      </div>
                    </Col>
                  </Row>
                </div>

                {loadingQuestionStats ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading question statistics...</p>
                  </div>
                ) : filteredQuestionStats.length === 0 ? (
                  <Alert variant="warning">
                    No question statistics available{" "}
                    {selectedMedium &&
                      `for ${selectedMedium === "E" ? "English" : "Tamil"}`}
                  </Alert>
                ) : (
                  <DataTable
                    columns={[
                      {
                        name: "District Code",
                        selector: (row) => row.D_CODE,
                        sortable: true,
                        width: "120px",
                      },
                      {
                        name: "District Name",
                        selector: (row) => row.District_Name,
                        sortable: true,
                        width: "200px",
                      },
                      {
                        name: "Medium",
                        selector: (row) =>
                          row.Medium === "E"
                            ? "English"
                            : row.Medium === "T"
                              ? "Tamil"
                              : "-",
                        sortable: true,
                        width: "100px",
                      },
                      {
                        name: "Q.No",
                        selector: (row) => row.Qno,
                        sortable: true,
                        center: true,
                        width: "80px",
                      },
                      {
                        name: "Correct",
                        selector: (row) => row.Correct,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                      {
                        name: "Wrong",
                        selector: (row) => row.Wrong,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                      {
                        name: "Blank",
                        selector: (row) => row.Blank,
                        sortable: true,
                        right: true,
                        width: "100px",
                      },
                    ]}
                    data={filteredQuestionStats}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50]}
                    highlightOnHover
                    striped
                  />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Initial State */}
      {!selectedTestCode && !loadingTests && (
        <Card className="text-center py-5">
          <Card.Body>
            <FaChartLine size={64} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">
              Select a test code to view marks report
            </h5>
            <p className="text-muted mb-0">
              Choose a test from the dropdown above to display student marks
              data
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AdminReportDashboard;
