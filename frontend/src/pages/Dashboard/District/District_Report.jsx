import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
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
  FaClipboardList,
  FaCalculator,
  FaListAlt,
  FaFileExcel,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { getJeeDistrictMarksColumns } from "./components/JeeDistrictMarksColumns";
import { getNeetDistrictMarksColumns } from "./components/NeetDistrictMarksColumns";
import { getCuetDistrictMarksColumns } from "./components/CuetDistrictMarksColumns";
import { getCurrentAffairsDistrictMarksColumns } from "./components/CurrentAffairsDistrictMarksColumns";
import { getGeneralAbilityDistrictMarksColumns } from "./components/GeneralAbilityDistrictMarksColumns";
import { getHumanitiesDistrictMarksColumns } from "./components/HumanitiesDistrictMarksColumns";
import { getQuantitativeDistrictMarksColumns } from "./components/QuantitativeDistrictMarksColumns";
import { getFoundationDistrictMarksColumns } from "./components/FoundationDistrictMarksColumns";
import { getSpokenEnglishDistrictMarksColumns } from "./components/SpokenEnglishDistrictMarksColumns";
import { clatSectionLabels, getClatMarksColumns } from "../../Admin/components/ClatMarksColumns";
import JeeDistrictSubjectStatsSection from "./components/JeeDistrictSubjectStatsSection";
import NeetDistrictSubjectStatsSection from "./components/NeetDistrictSubjectStatsSection";
import CuetDistrictSubjectStatsSection from "./components/CuetDistrictSubjectStatsSection";
import CurrentAffairsDistrictSubjectStatsSection from "./components/CurrentAffairsDistrictSubjectStatsSection";
import GeneralAbilityDistrictSubjectStatsSection from "./components/GeneralAbilityDistrictSubjectStatsSection";
import HumanitiesDistrictSubjectStatsSection from "./components/HumanitiesDistrictSubjectStatsSection";
import QuantitativeDistrictSubjectStatsSection from "./components/QuantitativeDistrictSubjectStatsSection";
import FoundationDistrictSubjectStatsSection from "./components/FoundationDistrictSubjectStatsSection";
import SpokenEnglishDistrictSubjectStatsSection from "./components/SpokenEnglishDistrictSubjectStatsSection";
import {
  useGetTestCodesForReportQuery,
  useGetJeeMarksByTestCodeQuery,
  useGetFieldnamesQuery,
  useGetJeeQbDetailsByTestCodeQuery,
  useGetSubjectWiseStatsByTestCodeQuery,
  useGetQuestionStatisticsByTestCodeQuery,
} from "../../../redux-slice/jeeReportApiSlice";
import {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetFieldnamesQuery,
  useGetNeetQbDetailsByTestCodeQuery,
  useGetNeetSubjectWiseStatsByTestCodeQuery,
  useGetNeetQuestionStatisticsByTestCodeQuery,
} from "../../../redux-slice/neetReportApiSlice";
import {
  useGetCuetTestCodesForReportQuery,
  useGetCuetMarksByTestCodeQuery,
  useGetCuetFieldnamesQuery,
  useGetCuetQbDetailsByTestCodeQuery,
  useGetCuetSubjectWiseStatsByTestCodeQuery,
  useGetCuetQuestionStatisticsByTestCodeQuery,
} from "../../../redux-slice/cuetReportApiSlice";
import {
  useGetCurrentAffairsTestCodesForReportQuery,
  useGetCurrentAffairsMarksByTestCodeQuery,
  useGetCurrentAffairsQbDetailsByTestCodeQuery,
  useGetCurrentAffairsSubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/currentAffairsReportApiSlice";
import {
  useGetGeneralAbilityTestCodesForReportQuery,
  useGetGeneralAbilityMarksByTestCodeQuery,
  useGetGeneralAbilityFieldnamesQuery,
  useGetGeneralAbilityQbDetailsByTestCodeQuery,
  useGetGeneralAbilitySubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/generalAbilityReportApiSlice";
import {
  useGetHumanitiesTestCodesForReportQuery,
  useGetHumanitiesMarksByTestCodeQuery,
  useGetHumanitiesQbDetailsByTestCodeQuery,
  useGetHumanitiesSubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/humanitiesReportApiSlice";
import {
  useGetQuantitativeTestCodesForReportQuery,
  useGetQuantitativeMarksByTestCodeQuery,
  useGetQuantitativeQbDetailsByTestCodeQuery,
  useGetQuantitativeSubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/quantitativeReportApiSlice";
import {
  useGetFoundationTestCodesForReportQuery,
  useGetFoundationMarksByTestCodeQuery,
  useGetFoundationQbDetailsByTestCodeQuery,
  useGetFoundationSubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/foundationReportApiSlice";
import {
  useGetSpokenEnglishTestCodesForReportQuery,
  useGetSpokenEnglishMarksByTestCodeQuery,
  useGetSpokenEnglishQbDetailsByTestCodeQuery,
  useGetSpokenEnglishSubjectWiseStatsByTestCodeQuery,
} from "../../../redux-slice/spokenEnglishReportApiSlice";
import {
  useGetClatTestCodesForReportQuery,
  useGetClatMarksByTestCodeQuery,
  useGetClatQbDetailsByTestCodeQuery,
} from "../../../redux-slice/clatReportApiSlice";
import "../../Admin/AdminReportDashboard.css";

const DataTable = DataTableBase.default || DataTableBase;

const normalizeDistrictCodeForCompare = (value) => {
  const token = String(value ?? "").trim();
  if (!token) return "";
  if (/^\d+$/.test(token)) return token.padStart(2, "0");
  return token;
};

// Sanitize sheet names for Excel (max 31 chars, no invalid chars)
const sanitizeSheetName = (name) => {
  if (!name) return "Sheet1";
  const cleaned = String(name).replace(/[[\]*/\\?:]/g, "");
  return cleaned.length > 31 ? cleaned.substring(0, 31) : cleaned;
};

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

const District_Report = () => {
  const [examType, setExamType] = useState("jee");
  const [selectedTestCode, setSelectedTestCode] = useState("");
  const [filterText, setFilterText] = useState("");
  const [showAnswerAnalysis, setShowAnswerAnalysis] = useState(false);
  const [selectedMedium, setSelectedMedium] = useState("");

  const getClatExportFields = (row) => clatSectionLabels(selectedTestCode).reduce((fields, label, index) => {
    const field = index + 1;
    return {
      ...fields,
      [`${label} Total`]: row[`TOTAL${field}`],
      [`${label} Correct`]: row[`CORRECT${field}`],
      [`${label} Wrong`]: row[`WRONG${field}`],
      [`${label} Blank`]: row[`BLANK${field}`],
      [`${label} Percentile`]: row[`Total${field}_Percentile`],
      [`District ${label} Percentile`]: row[`d_Total${field}_Percentile`],
    };
  }, {});

  const { userInfo } = useSelector((state) => state.auth);
  const districtCode = String(userInfo?.D_Code ?? "").trim();
  const examDisplayLabel =
    examType === "jee"
      ? "JEE"
      : examType === "neet"
        ? "NEET"
        : examType === "cuet"
          ? "CUET"
          : examType === "quantitative"
            ? "QUANTITATIVE APTITUDE"
          : examType === "foundation"
            ? "FOUNDATION"
          : examType === "spokenenglish"
            ? "SPOKEN ENGLISH"
          : examType === "generalability"
            ? "GENERAL ABILITY"
          : examType === "humanities"
            ? "HUMANITIES"
            : "CURRENT AFFAIRS";
  const examFileLabel =
    examType === "currentaffairs" ? "CURRENT_AFFAIRS" : examType === "generalability" ? "GENERAL_ABILITY" : examType === "humanities" ? "HUMANITIES" : examType === "quantitative" ? "QUANTITATIVE_APTITUDE" : examType === "foundation" ? "FOUNDATION" : examType === "spokenenglish" ? "SPOKEN_ENGLISH" : examDisplayLabel;

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
    examType === "jee" ? loadingJeeFieldnames : examType === "neet" ? loadingNeetFieldnames : examType === "cuet" ? loadingCuetFieldnames : loadingGaFieldnames;

  // Conditional test code fetch
  const { data: jeeTestCodesData, isLoading: jeeTestLoading } =
    useGetTestCodesForReportQuery();
  const { data: neetTestCodesData, isLoading: neetTestLoading } =
    useGetNeetTestCodesForReportQuery();
  const { data: cuetTestCodesData, isLoading: cuetTestLoading } =
    useGetCuetTestCodesForReportQuery();
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

  const testCodesData = examType === "jee" ? jeeTestCodesData : examType === "neet" ? neetTestCodesData : examType === "cuet" ? cuetTestCodesData : examType === "quantitative" ? qaTestCodesData : examType === "foundation" ? foundationTestCodesData : examType === "spokenenglish" ? spokenEnglishTestCodesData : examType === "currentaffairs" ? caTestCodesData : examType === "generalability" ? gaTestCodesData : examType === "clat" ? clatTestCodesData : humanitiesTestCodesData;
  const loadingTests = examType === "jee" ? jeeTestLoading : examType === "neet" ? neetTestLoading : examType === "cuet" ? cuetTestLoading : examType === "quantitative" ? qaTestLoading : examType === "foundation" ? foundationTestLoading : examType === "spokenenglish" ? spokenEnglishTestLoading : examType === "currentaffairs" ? caTestLoading : examType === "generalability" ? gaTestLoading : examType === "clat" ? clatTestLoading : humanitiesTestLoading;
  const testError = null;
  const testCodes = testCodesData?.data || [];

  // Conditional marks fetch
  const { data: jeeMarksData, isLoading: jeeMarksLoading } =
    useGetJeeMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });
  const { data: neetMarksData, isLoading: neetMarksLoading } =
    useGetNeetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });
  const { data: cuetMarksData, isLoading: cuetMarksLoading } =
    useGetCuetMarksByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });
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

  const marksData = examType === "jee" ? jeeMarksData : examType === "neet" ? neetMarksData : examType === "cuet" ? cuetMarksData : examType === "quantitative" ? qaMarksData : examType === "foundation" ? foundationMarksData : examType === "spokenenglish" ? spokenEnglishMarksData : examType === "currentaffairs" ? caMarksData : examType === "generalability" ? gaMarksData : examType === "clat" ? clatMarksData : humanitiesMarksData;
  const loadingMarks = examType === "jee" ? jeeMarksLoading : examType === "neet" ? neetMarksLoading : examType === "cuet" ? cuetMarksLoading : examType === "quantitative" ? qaMarksLoading : examType === "foundation" ? foundationMarksLoading : examType === "spokenenglish" ? spokenEnglishMarksLoading : examType === "currentaffairs" ? caMarksLoading : examType === "generalability" ? gaMarksLoading : examType === "clat" ? clatMarksLoading : humanitiesMarksLoading;
  const marksError = null;

  const testMaster = marksData?.data?.testMaster || null;
  const marks = useMemo(() => marksData?.data?.marks || [], [marksData]);

  // Conditional QB details fetch
  const { data: jeeQbDetailsData, isLoading: jeeQbLoading } =
    useGetJeeQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });
  const { data: neetQbDetailsData, isLoading: neetQbLoading } =
    useGetNeetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });
  const { data: cuetQbDetailsData, isLoading: cuetQbLoading } =
    useGetCuetQbDetailsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });
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

  const qbDetailsData = examType === "jee" ? jeeQbDetailsData : examType === "neet" ? neetQbDetailsData : examType === "cuet" ? cuetQbDetailsData : examType === "quantitative" ? qaQbDetailsData : examType === "foundation" ? foundationQbDetailsData : examType === "spokenenglish" ? spokenEnglishQbDetailsData : examType === "currentaffairs" ? caQbDetailsData : examType === "generalability" ? gaQbDetailsData : examType === "clat" ? clatQbDetailsData : humanitiesQbDetailsData;
  const loadingQbDetails = examType === "jee" ? jeeQbLoading : examType === "neet" ? neetQbLoading : examType === "cuet" ? cuetQbLoading : examType === "quantitative" ? qaQbLoading : examType === "foundation" ? foundationQbLoading : examType === "spokenenglish" ? spokenEnglishQbLoading : examType === "currentaffairs" ? caQbLoading : examType === "generalability" ? gaQbLoading : examType === "clat" ? clatQbLoading : humanitiesQbLoading;
  const qbDetails = useMemo(
    () => qbDetailsData?.data?.qbDetails || [],
    [qbDetailsData],
  );

  // Conditional subject stats fetch
  const { data: jeeSubjectStatsData, isLoading: jeeSubjectStatsLoading } =
    useGetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "jee" },
    );
  const { data: neetSubjectStatsData, isLoading: neetSubjectStatsLoading } =
    useGetNeetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "neet" },
    );
  const { data: cuetSubjectStatsData, isLoading: cuetSubjectStatsLoading } =
    useGetCuetSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "cuet" },
    );
  const { data: caSubjectStatsData, isLoading: caSubjectStatsLoading } =
    useGetCurrentAffairsSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "currentaffairs" },
    );
  const { data: gaSubjectStatsData, isLoading: gaSubjectStatsLoading } =
    useGetGeneralAbilitySubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "generalability" },
    );
  const { data: humanitiesSubjectStatsData, isLoading: humanitiesSubjectStatsLoading } =
    useGetHumanitiesSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "humanities" },
    );
  const { data: qaSubjectStatsData, isLoading: qaSubjectStatsLoading } =
    useGetQuantitativeSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "quantitative" },
    );
  const { data: foundationSubjectStatsData, isLoading: foundationSubjectStatsLoading } =
    useGetFoundationSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "foundation" },
    );
  const { data: spokenEnglishSubjectStatsData, isLoading: spokenEnglishSubjectStatsLoading } =
    useGetSpokenEnglishSubjectWiseStatsByTestCodeQuery(
      { testCode: selectedTestCode, districtCode: districtCode },
      { skip: !selectedTestCode || !districtCode || examType !== "spokenenglish" },
    );

  const subjectStatsData = examType === "jee" ? jeeSubjectStatsData : examType === "neet" ? neetSubjectStatsData : examType === "cuet" ? cuetSubjectStatsData : examType === "quantitative" ? qaSubjectStatsData : examType === "foundation" ? foundationSubjectStatsData : examType === "spokenenglish" ? spokenEnglishSubjectStatsData : examType === "currentaffairs" ? caSubjectStatsData : examType === "generalability" ? gaSubjectStatsData : humanitiesSubjectStatsData;
  const loadingSubjectStats = examType === "jee" ? jeeSubjectStatsLoading : examType === "neet" ? neetSubjectStatsLoading : examType === "cuet" ? cuetSubjectStatsLoading : examType === "quantitative" ? qaSubjectStatsLoading : examType === "foundation" ? foundationSubjectStatsLoading : examType === "spokenenglish" ? spokenEnglishSubjectStatsLoading : examType === "currentaffairs" ? caSubjectStatsLoading : examType === "generalability" ? gaSubjectStatsLoading : humanitiesSubjectStatsLoading;

  const subjectStats = subjectStatsData?.data || {
    overall: null,
    byDistrict: [],
  };

  // Conditional question stats fetch
  const { data: jeeQuestionStatsData, isLoading: jeeQuestionStatsLoading } =
    useGetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "jee",
    });
  const { data: neetQuestionStatsData, isLoading: neetQuestionStatsLoading } =
    useGetNeetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "neet",
    });
  const { data: cuetQuestionStatsData, isLoading: cuetQuestionStatsLoading } =
    useGetCuetQuestionStatisticsByTestCodeQuery(selectedTestCode, {
      skip: !selectedTestCode || examType !== "cuet",
    });

  const questionStatsData = examType === "jee" ? jeeQuestionStatsData : examType === "neet" ? neetQuestionStatsData : cuetQuestionStatsData;
  const loadingQuestionStats = examType === "jee" ? jeeQuestionStatsLoading : examType === "neet" ? neetQuestionStatsLoading : cuetQuestionStatsLoading;
  const questionStats = useMemo(
    () => questionStatsData?.data?.questionStatistics || [],
    [questionStatsData],
  );

  const districtMarks = useMemo(() => {
    if (!districtCode) return [];
    const normalizedDistrictCode = normalizeDistrictCodeForCompare(districtCode);
    return marks.filter(
      (item) =>
        normalizeDistrictCodeForCompare(item.BATCHNAME) === normalizedDistrictCode,
    );
  }, [marks, districtCode]);

  const filteredQbDetails = useMemo(() => {
    if (!districtCode) return [];
    const normalizedDistrictCode = normalizeDistrictCodeForCompare(districtCode);
    return qbDetails.filter(
      (item) =>
        normalizeDistrictCodeForCompare(item.BATCHNAME) === normalizedDistrictCode,
    );
  }, [qbDetails, districtCode]);

  const districtStatistics = useMemo(() => {
    if (!districtMarks || districtMarks.length === 0) return [];
    const scores = districtMarks
      .map((item) => parseFloat(item.TOTAL))
      .filter((score) => !Number.isNaN(score))
      .sort((a, b) => a - b);

    const count = scores.length;
    let median = 0;
    if (count > 0) {
      const mid = Math.floor(count / 2);
      median =
        count % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid];
    }

    const average =
      count > 0 ? scores.reduce((sum, score) => sum + score, 0) / count : 0;
    const districtName = districtMarks[0]?.District_Name || districtCode;

    return [
      {
        code: districtCode,
        name: districtName,
        count,
        median: median.toFixed(2),
        average: average.toFixed(2),
      },
    ];
  }, [districtMarks, districtCode]);

  // Filter Question Statistics by district and selected medium
  const filteredQuestionStats = useMemo(() => {
    if (!districtCode) return [];
    const normalizedDistrictCode = normalizeDistrictCodeForCompare(districtCode);
    let filtered = questionStats.filter(
      (item) =>
        normalizeDistrictCodeForCompare(item.D_CODE) === normalizedDistrictCode,
    );

    if (selectedMedium) {
      filtered = filtered.filter((item) => item.Medium === selectedMedium);
    }

    return filtered;
  }, [questionStats, districtCode, selectedMedium]);

  const exportToExcel = () => {
    if (!rankedMarks || rankedMarks.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = rankedMarks.map((row, index) => {
      if (showAnswerAnalysis) {
        const obj = {
          "S.No": index + 1,
          "EMIS No": row.ROLLNO,
          "Test Code": row.Test_Code,
          "Student Name": row.Candidate_Name,
          District: row.District_Name,
          "District Code": row.BATCHNAME,
        };

        if (row.CORANS) {
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
      }

      return {
        "S.No": index + 1,
        "Test Code": row.Test_Code,
        "District Code": row.BATCHNAME,
        "District Name": row.District_Name,
        "Candidate Name": row.Candidate_Name,
        "EMIS No": row.ROLLNO,
        "Overall Rank": row.overallRank,
        "District Rank": row.districtRank,
        Total: row.TOTAL,
        "Overall Correct": row.CORRECT,
        "Overall Wrong": row.WRONG,
        "Overall Blank": row.BLANK,
        ...(examType === "jee"
          ? {
              "Physics Score": row.Phy_Tot,
              "Physics Correct": row.Phy_C,
              "Physics Wrong": row.Phy_W,
              "Physics Blank": row.Phy_B,
              "Physics Percentile": row.Phy_Percentile,
              "Chemistry Score": row.che_Tot,
              "Chemistry Correct": row.Che_C,
              "Chemistry Wrong": row.Che_W,
              "Chemistry Blank": row.Che_B,
              "Chemistry Percentile": row.Che_Percentile,
              "Maths Score": row.Mat_Tot,
              "Maths Correct": row.Mat_C,
              "Maths Wrong": row.Mat_W,
              "Maths Blank": row.Mat_B,
              "Maths Percentile": row.Mat_Percentile,
              "District Physics Percentile": row.d_Phy_Percentile,
              "District Chemistry Percentile": row.d_Che_Percentile,
              "District Maths Percentile": row.d_Mat_Percentile,
            }
          : examType === "neet"
            ? {
                "Physics Score": row.TOTAL1,
                "Physics Correct": row.CORRECT1,
                "Physics Wrong": row.WRONG1,
                "Physics Blank": row.BLANK1,
                "Chemistry Score": row.TOTAL2,
                "Chemistry Correct": row.CORRECT2,
                "Chemistry Wrong": row.WRONG2,
                "Chemistry Blank": row.BLANK2,
                "Botany Score": row.TOTAL3,
                "Botany Correct": row.CORRECT3,
                "Botany Wrong": row.WRONG3,
                "Botany Blank": row.BLANK3,
                "Zoology Score": row.TOTAL4,
                "Zoology Correct": row.CORRECT4,
                "Zoology Wrong": row.WRONG4,
                "Zoology Blank": row.BLANK4,
                "Physics Percentile": row.Phy_Percentile,
                "Chemistry Percentile": row.Che_Percentile,
                "Botany Percentile": row.Bot_Percentile,
                "Zoology Percentile": row.Zoo_Percentile,
                "District Physics Percentile": row.d_Phy_Percentile,
                "District Chemistry Percentile": row.d_Che_Percentile,
                "District Botany Percentile": row.d_Bot_Percentile,
                "District Zoology Percentile": row.d_Zoo_Percentile,
              }
            : examType === "cuet"
              ? {
                  "Accountancy Score": row.TOTAL1,
                  "Accountancy Correct": row.CORRECT1,
                  "Accountancy Wrong": row.WRONG1,
                  "Accountancy Blank": row.BLANK1,
                  "Economics Score": row.TOTAL2,
                  "Economics Correct": row.CORRECT2,
                  "Economics Wrong": row.WRONG2,
                  "Economics Blank": row.BLANK2,
                  "Business Studies and Commerce Score": row.TOTAL3,
                  "Business Studies and Commerce Correct": row.CORRECT3,
                  "Business Studies and Commerce Wrong": row.WRONG3,
                  "Business Studies and Commerce Blank": row.BLANK3,
                  "Business Maths Score": row.TOTAL4,
                  "Business Maths Correct": row.CORRECT4,
                  "Business Maths Wrong": row.WRONG4,
                  "Business Maths Blank": row.BLANK4,
                  "Accountancy Percentile": row.Accountancy_Percentile,
                  "Economics Percentile": row.Economics_Percentile,
                  "Business Studies and Commerce Percentile":
                    row.Business_Studies_Commerce_Percentile,
                  "Business Maths Percentile": row.Business_Maths_Percentile,
                  "District Accountancy Percentile": row.d_Accountancy_Percentile,
                  "District Economics Percentile": row.d_Economics_Percentile,
                  "District Business Studies and Commerce Percentile":
                    row.d_Business_Studies_Commerce_Percentile,
                  "District Business Maths Percentile": row.d_Business_Maths_Percentile,
                }
              : examType === "generalability"
                ? {
                    "Verbal Ability Total": row.TOTAL1,
                    "Verbal Ability Correct": row.CORRECT1,
                    "Verbal Ability Wrong": row.WRONG1,
                    "Verbal Ability Blank": row.BLANK1,
                    "Quants Total": row.TOTAL2,
                    "Quants Correct": row.CORRECT2,
                    "Quants Wrong": row.WRONG2,
                    "Quants Blank": row.BLANK2,
                    "Gk Current Affairs Total": row.TOTAL3,
                    "Gk Current Affairs Correct": row.CORRECT3,
                    "Gk Current Affairs Wrong": row.WRONG3,
                    "Gk Current Affairs Blank": row.BLANK3,
                    "District Verbal Ability Percentile": row.d_Verbal_Ability_Percentile,
                    "District Quants Percentile": row.d_Quants_Percentile,
                    "District Gk Current Affairs Percentile": row.d_Gk_Current_Affairs_Percentile,
                  }
                : examType === "quantitative"
                  ? {
                      ...(row.CORRECT1 != null
                        ? { "Overall Total": row.TOTAL, "Overall Correct": row.CORRECT, "Overall Wrong": row.WRONG, "Overall Blank": row.BLANK }
                        : { "Quantitative Aptitude Score": row.TOTAL, "Quantitative Aptitude Correct": row.CORRECT, "Quantitative Aptitude Wrong": row.WRONG, "Quantitative Aptitude Blank": row.BLANK }
                      ),
                      ...(row.CORRECT1 != null ? {
                        "Quants Score": row.TOTAL1,
                        "Quants Correct": row.CORRECT1,
                        "Quants Wrong": row.WRONG1,
                        "Quants Blank": row.BLANK1,
                        "Quants Percentile": row.quantsPercentile,
                        "District Quants Percentile": row.d_quantsPercentile,
                        "Logical Score": row.TOTAL2,
                        "Logical Correct": row.CORRECT2,
                        "Logical Wrong": row.WRONG2,
                        "Logical Blank": row.BLANK2,
                        "Logical Reasoning Percentile": row.logicalReasoningPercentile,
                        "District Logical Percentile": row.d_logicalReasoningPercentile,
                        "Curr Affairs Score": row.TOTAL3,
                        "Curr Affairs Correct": row.CORRECT3,
                        "Curr Affairs Wrong": row.WRONG3,
                        "Curr Affairs Blank": row.BLANK3,
                        "Curr Affairs Percentile": row.currentAffairsPercentile,
                        "District Curr Affairs Percentile": row.d_currentAffairsPercentile,
                      } : {}),
                    }
                : examType === "foundation"
                  ? {
                      "Physics Score": row.TOTAL1,
                      "Physics Correct": row.CORRECT1,
                      "Physics Wrong": row.WRONG1,
                      "Physics Blank": row.BLANK1,
                      "Chemistry Score": row.TOTAL2,
                      "Chemistry Correct": row.CORRECT2,
                      "Chemistry Wrong": row.WRONG2,
                      "Chemistry Blank": row.BLANK2,
                      "Biology Score": row.TOTAL3,
                      "Biology Correct": row.CORRECT3,
                      "Biology Wrong": row.WRONG3,
                      "Biology Blank": row.BLANK3,
                      "Physics Percentile": row.Phy_Percentile,
                      "Chemistry Percentile": row.Che_Percentile,
                      "Biology Percentile": row.Bio_Percentile,
                      "District Physics Percentile": row.d_Phy_Percentile,
                      "District Chemistry Percentile": row.d_Che_Percentile,
                      "District Biology Percentile": row.d_Bio_Percentile,
                    }
                : examType === "spokenenglish"
                  ? {
                      "Listening Score": row.TOTAL1,
                      "Listening Correct": row.CORRECT1,
                      "Listening Wrong": row.WRONG1,
                      "Listening Blank": row.BLANK1,
                      "Speaking Score": row.TOTAL2,
                      "Speaking Correct": row.CORRECT2,
                      "Speaking Wrong": row.WRONG2,
                      "Speaking Blank": row.BLANK2,
                      "Reading Score": row.TOTAL3,
                      "Reading Correct": row.CORRECT3,
                      "Reading Wrong": row.WRONG3,
                      "Reading Blank": row.BLANK3,
                      "Writing Score": row.TOTAL4,
                      "Writing Correct": row.CORRECT4,
                      "Writing Wrong": row.WRONG4,
                      "Writing Blank": row.BLANK4,
                      "Listening Percentile": row.listeningPerecentile,
                      "Speaking Percentile": row.speakingPerecentile,
                      "Reading Percentile": row.readingPercentile,
                      "Writing Percentile": row.writingPercetile,
                      "District Listening Percentile": row.d_listeningPerecentile,
                      "District Speaking Percentile": row.d_speakingPerecentile,
                      "District Reading Percentile": row.d_readingPercentile,
                      "District Writing Percentile": row.d_writingPercetile,
                    }
                : examType === "humanities"
                  ? {
                      "Economics Score": row.TOTAL1,
                      "Economics Correct": row.CORRECT1,
                      "Economics Wrong": row.WRONG1,
                      "Economics Blank": row.BLANK1,
                      "Economics Percentile": row.Economics_Percentile,
                      "History Score": row.TOTAL2,
                      "History Correct": row.CORRECT2,
                      "History Wrong": row.WRONG2,
                      "History Blank": row.BLANK2,
                      "History Percentile": row.History_Percentile,
                      "Political Science Score": row.TOTAL3,
                      "Political Science Correct": row.CORRECT3,
                      "Political Science Wrong": row.WRONG3,
                      "Political Science Blank": row.BLANK3,
                      "Political Science Percentile": row.Political_Science_Percentile,
                      "Geography Score": row.TOTAL4,
                      "Geography Correct": row.CORRECT4,
                      "Geography Wrong": row.WRONG4,
                      "Geography Blank": row.BLANK4,
                      "Geography Percentile": row.Geography_Percentile,
                      "District Economics Percentile": row.d_Economics_Percentile,
                      "District History Percentile": row.d_History_Percentile,
                      "District Political Science Percentile": row.d_Political_Science_Percentile,
                      "District Geography Percentile": row.d_Geography_Percentile,
                    }
                : examType === "clat"
                  ? getClatExportFields(row)
                : {
                    "Current Affairs Score": row.TOTAL1,
                    "Current Affairs Correct": row.CORRECT1,
                    "Current Affairs Wrong": row.WRONG1,
                    "Current Affairs Blank": row.BLANK1,
                    "Integrated English Score": row.TOTAL2,
                    "Integrated English Correct": row.CORRECT2,
                    "Integrated English Wrong": row.WRONG2,
                    "Integrated English Blank": row.BLANK2,
                  }),
        "Total Percentile": row.Total_Percentile,
        "District Total Percentile": row.d_Total_Percentile,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const sheetName = sanitizeSheetName(`District ${examDisplayLabel} Report`);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const fileName = `District_${districtCode}_${examFileLabel}_Marks_${selectedTestCode}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

    const fileName = `District_${districtCode}_Statistics_${selectedTestCode}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

    const fileName = `District_${districtCode}_QB_Details_${selectedTestCode}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

    const mediumSuffix = selectedMedium ? `_${selectedMedium === 'E' ? 'English' : 'Tamil'}` : '_All_Mediums';
    const fileName = `District_${districtCode}_Question_Statistics_${selectedTestCode}${mediumSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const maxQuestions = useMemo(() => {
    if (!districtMarks || districtMarks.length === 0) return 0;
    let max = 0;
    districtMarks.forEach((mark) => {
      if (mark.CORANS) {
        max = Math.max(max, mark.CORANS.length);
      }
    });
    return max;
  }, [districtMarks]);

  const columns = useMemo(() => {
    if (examType === "jee") {
      return getJeeDistrictMarksColumns(columnMapping);
    }
    if (examType === "neet") {
      return getNeetDistrictMarksColumns(columnMapping);
    }
    if (examType === "cuet") {
      return getCuetDistrictMarksColumns(columnMapping);
    }
    if (examType === "generalability") {
      return getGeneralAbilityDistrictMarksColumns(columnMapping);
    }
    if (examType === "humanities") {
      return getHumanitiesDistrictMarksColumns({ columnMapping });
    }
    if (examType === "clat") {
      return getClatMarksColumns({ selectedDistrict: true, testCode: selectedTestCode });
    }
    if (examType === "quantitative") {
      return getQuantitativeDistrictMarksColumns({ marks: districtMarks });
    }
    if (examType === "foundation") {
      return getFoundationDistrictMarksColumns();
    }
    if (examType === "spokenenglish") {
      return getSpokenEnglishDistrictMarksColumns();
    }
    return getCurrentAffairsDistrictMarksColumns(columnMapping);
  }, [columnMapping, examType, districtMarks, selectedTestCode]);

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

    const questionColumns = [];
    for (let i = 1; i <= maxQuestions; i++) {
      questionColumns.push({
        name: `Q${i}`,
        selector: (row) => {
          if (!row.CORANS) return "-";
          const answer = row.CORANS[i - 1];
          if (!answer || answer === " ") return "-";
          return answer.toUpperCase();
        },
        sortable: true,
        center: true,
        width: "170px",
        cell: (row) => {
          if (!row.CORANS) return <span>-</span>;
          const answer = row.CORANS[i - 1];
          if (!answer || answer === " ") return <span>Not Conducted</span>;
          const answerUpper = answer.toUpperCase();
          if (answerUpper === "C") return "Correct";
          if (answerUpper === "W") return "Wrong";
          if (answerUpper === "B") return "Blank";
          return answerUpper;
        },
      });
    }

    return [...baseColumns, ...questionColumns];
  }, [maxQuestions]);

  const filteredMarks = useMemo(() => {
    let filtered = districtMarks;
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
  }, [districtMarks, filterText]);

  const overallRanksMap = useMemo(() => {
    if (!marks || marks.length === 0) return new Map();
    const sorted = [...marks].sort(
      (a, b) => (parseFloat(b.TOTAL) || 0) - (parseFloat(a.TOTAL) || 0),
    );
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

  const districtRanksMap = useMemo(() => {
    if (!districtMarks || districtMarks.length === 0) return new Map();
    const sorted = [...districtMarks].sort(
      (a, b) => (parseFloat(b.TOTAL) || 0) - (parseFloat(a.TOTAL) || 0),
    );
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
  }, [districtMarks]);

  const rankedMarks = filteredMarks.map((item) => {
    const studentId = item.ROLLNO || item.id;
    return {
      ...item,
      overallRank: overallRanksMap.get(studentId),
      districtRank: districtRanksMap.get(studentId),
    };
  });

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

  // if (role !== "1") {
  //   return (
  //     <Container fluid className="py-4">
  //       <Alert variant="danger">
  //         Access denied. This page is only for district users (Role 1).
  //       </Alert>
  //     </Container>
  //   );
  // }

  if (!districtCode) {
    return (
      <Container fluid className="py-4">
        <Alert variant="warning">
          District code is missing for this user. Please contact administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-report-dashboard py-4">
      {loadingFieldnames && (
        <Card className="shadow-sm mb-4">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading field configurations...</p>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-sm mb-4 header-card">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h3 className="mb-1">
                <FaFileAlt className="me-2 text-primary" />
                District {examDisplayLabel} Marks Report
              </h3>
              <p className="text-muted mb-0">
                View district-level {examDisplayLabel} performance data
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

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <p className="text-muted mb-0">
            Showing data only for district code: {districtCode}
          </p>
        </Card.Body>
      </Card>

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
                        District Students: {districtMarks.length}
                      </Badge>
                      <Badge bg="secondary" className="px-3 py-2">
                        Filtered: {rankedMarks.length}
                      </Badge>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
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
                          id="district-answer-analysis-switch"
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

      {selectedTestCode && (
        <Card className="shadow-sm mb-4">
          <Card.Header style={{ backgroundColor: "#2c5aa0", color: "white" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt />
                <h5 className="mb-0">District {examDisplayLabel} Marks Report</h5>
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
            ) : districtMarks.length === 0 ? (
              <Alert variant="warning" className="m-3">
                No district marks data available for this test code
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
      {selectedTestCode &&
        subjectStats.overall &&
        (examType === "jee"
          ? subjectStats.overall.physics &&
            subjectStats.overall.chemistry &&
            subjectStats.overall.maths
          : examType === "neet"
            ? subjectStats.overall.physics &&
              subjectStats.overall.chemistry &&
              subjectStats.overall.botany &&
              subjectStats.overall.zoology
            : examType === "cuet"
              ? subjectStats.overall.accountancy &&
                subjectStats.overall.economics &&
                subjectStats.overall.businessStudiesCommerce &&
                subjectStats.overall.businessMaths
              : examType === "quantitative"
                ? subjectStats.overall.quantitativeAptitude
              : examType === "foundation"
                ? subjectStats.overall.physics &&
                  subjectStats.overall.chemistry &&
                  subjectStats.overall.biology
              : examType === "spokenenglish"
                ? subjectStats.overall.listening &&
                  subjectStats.overall.speaking &&
                  subjectStats.overall.reading &&
                  subjectStats.overall.writing
              : subjectStats.overall.part1) &&
        (examType === "jee" ? (
          <JeeDistrictSubjectStatsSection
            districtCode={districtCode}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "neet" ? (
          <NeetDistrictSubjectStatsSection
            districtCode={districtCode}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "cuet" ? (
          <CuetDistrictSubjectStatsSection
            districtCode={districtCode}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "generalability" ? (
          <GeneralAbilityDistrictSubjectStatsSection
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "humanities" ? (
          <HumanitiesDistrictSubjectStatsSection
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "quantitative" ? (
          <QuantitativeDistrictSubjectStatsSection
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "foundation" ? (
          <FoundationDistrictSubjectStatsSection
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : examType === "spokenenglish" ? (
          <SpokenEnglishDistrictSubjectStatsSection
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ) : (
          <CurrentAffairsDistrictSubjectStatsSection
            districtCode={districtCode}
            subjectStats={subjectStats}
            loadingSubjectStats={loadingSubjectStats}
          />
        ))}

      {selectedTestCode && districtMarks.length > 0 && (
        <Row className="mt-4">
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header
                style={{ backgroundColor: "#2c5aa0", color: "white" }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <FaCalculator />
                    <h5 className="mb-0">District Statistics</h5>
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
                  />
                )}
              </Card.Body>
            </Card>
          </Col>

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
                    <small className="text-white">
                      District: {districtCode}
                    </small>
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
                    No QB details available for district: {districtCode}
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
                  />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Question Bank Statistics Card */}
      {selectedTestCode && filteredQuestionStats.length > 0 && (
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
                    </h5>
                  </div>
                  <Button
                    variant="light"
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
                    <Col md={9} className="d-flex align-items-end">
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

      {!selectedTestCode && !loadingTests && (
        <Card className="text-center py-5">
          <Card.Body>
            <FaChartLine size={64} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">
              Select a test code to view district marks report
            </h5>
            <p className="text-muted mb-0">
              Choose a test from the dropdown above to display your district
              data
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default District_Report;
