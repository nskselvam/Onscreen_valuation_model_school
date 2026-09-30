import React, { useMemo, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Spinner,
  Alert,
  Badge,
  Button,
} from "react-bootstrap";
import DataTableBase from "react-data-table-component";
import { FaImages, FaSearch, FaFileExcel, FaClipboardList } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useGetAllTestMastersQuery } from "../../../redux-slice/testMasterApiSlice";
import { useGetDistrictDataQuery } from "../../../redux-slice/GeneralGetSqlOperationApiSlice";
import { useGetImageCountsByDistrictQuery } from "../../../redux-slice/imageUploadApiSlice";
import "../../Admin/AdminReportDashboard.css";

const DataTable = DataTableBase.default || DataTableBase;

const DistrictWiseImage = () => {
  const [selectedTestCode, setSelectedTestCode] = useState("");
  const [filterText, setFilterText] = useState("");

  const {
    data: testMasterData,
    isLoading: loadingTests,
    error: testError,
  } = useGetAllTestMastersQuery({ page: 1, limit: 1000, search: "" });

  const {
    data: districtData,
    isLoading: loadingDistricts,
    error: districtError,
  } = useGetDistrictDataQuery();

  const {
    data: imageCountsData,
    isLoading: loadingImageCounts,
    error: imageCountError,
  } = useGetImageCountsByDistrictQuery(selectedTestCode, {
    skip: !selectedTestCode,
  });

  const tests = useMemo(() => testMasterData?.data || [], [testMasterData]);
  const districts = useMemo(() => districtData?.data || [], [districtData]);

  const selectedTest = useMemo(
    () => tests.find((item) => item.testcode === selectedTestCode) || null,
    [tests, selectedTestCode],
  );

  const districtRows = useMemo(() => {
    if (!selectedTest?.test_districts) return [];

    const districtMap = new Map(
      districts.map((district) => [district.DCODE, district.DNAME]),
    );

    const districtCodes = selectedTest.test_districts
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);

    const imageStatuses = selectedTest.image_upload_districts
      ? selectedTest.image_upload_districts.split(",").map((status) => status.trim())
      : districtCodes.map(() => "N");

    const districtCounts = imageCountsData?.data?.districtCounts || [];

    return districtCodes.map((districtCode, index) => {
      const matchedCount = districtCounts.find((item) => {
        const apiCode = String(item.districtCode || "").trim();
        return (
          apiCode === districtCode ||
          apiCode === districtCode.slice(0, 2) ||
          districtCode.startsWith(apiCode)
        );
      });

      return {
        districtCode,
        districtName: districtMap.get(districtCode) || districtCode,
        imageCount: Number(matchedCount?.count || 0),
        uploadStatus: imageStatuses[index] === "Y" ? "Uploaded" : "Not Uploaded",
      };
    });
  }, [selectedTest, districts, imageCountsData]);

  const filteredRows = useMemo(() => {
    const keyword = filterText.trim().toLowerCase();
    if (!keyword) return districtRows;

    return districtRows.filter((row) => {
      return (
        row.districtCode.toLowerCase().includes(keyword) ||
        row.districtName.toLowerCase().includes(keyword) ||
        row.uploadStatus.toLowerCase().includes(keyword)
      );
    });
  }, [districtRows, filterText]);

  const totals = useMemo(() => {
    const totalDistricts = districtRows.length;
    const uploadedDistricts = districtRows.filter(
      (row) => row.uploadStatus === "Uploaded",
    ).length;
    const totalImages = districtRows.reduce(
      (sum, row) => sum + Number(row.imageCount || 0),
      0,
    );

    return { totalDistricts, uploadedDistricts, totalImages };
  }, [districtRows]);

  const exportToExcel = () => {
    if (!filteredRows.length) {
      return;
    }

    const exportData = filteredRows.map((row, index) => ({
      "S.No": index + 1,
      "District Code": row.districtCode,
      "District Name": row.districtName,
      "Image Count": row.imageCount,
      "Upload Status": row.uploadStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "District Image Count");
    const fileName = `District_Image_Count_${selectedTestCode || "All"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const columns = useMemo(
    () => [
      {
        name: "S.No",
        selector: (row, index) => index + 1,
        width: "80px",
        center: true,
      },
      {
        name: "District Code",
        selector: (row) => row.districtCode,
        sortable: true,
        minWidth: "160px",
      },
      {
        name: "District Name",
        selector: (row) => row.districtName,
        sortable: true,
        minWidth: "220px",
        wrap: true,
      },
      {
        name: "Image Count",
        selector: (row) => row.imageCount,
        sortable: true,
        right: true,
        minWidth: "150px",
      },
      {
        name: "Upload Status",
        selector: (row) => row.uploadStatus,
        sortable: true,
        minWidth: "180px",
        cell: (row) => (
          <Badge bg={row.uploadStatus === "Uploaded" ? "success" : "secondary"}>
            {row.uploadStatus}
          </Badge>
        ),
      },
    ],
    [],
  );

  const loading = loadingTests || loadingDistricts || (selectedTestCode && loadingImageCounts);
  const errorMessage =
    testError?.data?.message ||
    districtError?.data?.message ||
    imageCountError?.data?.message ||
    "";

  return (
    <Container fluid className="p-4 admin-report-dashboard">
      <Card className="mb-4 shadow-sm header-card">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col md={8}>
              <h3 className="mb-1 d-flex align-items-center gap-2">
                <FaImages />
                District Wise Image Count
              </h3>
              <p className="text-muted mb-0">
                View district-wise image count and upload status for each test.
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                variant="success"
                onClick={exportToExcel}
                disabled={!filteredRows.length}
              >
                <FaFileExcel className="me-2" />
                Export Excel
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={6}>
              <Form.Label>Select Test</Form.Label>
              <Form.Select
                value={selectedTestCode}
                onChange={(e) => setSelectedTestCode(e.target.value)}
              >
                <option value="">Choose test code</option>
                {tests.map((item) => (
                  <option key={item.testcode} value={item.testcode}>
                    {item.testcode} - {item.Test_Name || "Unnamed Test"}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={6}>
              <Form.Label>Search District</Form.Label>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Search by district code, district name or status"
                  style={{ paddingLeft: "2.3rem" }}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {errorMessage ? (
        <Alert variant="danger">{errorMessage}</Alert>
      ) : null}

      {selectedTestCode ? (
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="test-info-card h-100 shadow-sm">
              <Card.Body>
                <div className="text-muted small mb-1">Total Districts</div>
                <div className="stat-value">{totals.totalDistricts}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="test-info-card h-100 shadow-sm">
              <Card.Body>
                <div className="text-muted small mb-1">Uploaded Districts</div>
                <div className="stat-value">{totals.uploadedDistricts}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="test-info-card h-100 shadow-sm">
              <Card.Body>
                <div className="text-muted small mb-1">Total Images</div>
                <div className="stat-value">{totals.totalImages}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}

      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center gap-2 mb-3">
            <FaClipboardList className="text-primary" />
            <h5 className="mb-0">District Image Status</h5>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 mb-0">Loading district image counts...</p>
            </div>
          ) : !selectedTestCode ? (
            <Alert variant="info" className="mb-0">
              Select a test code to view district-wise image count.
            </Alert>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              pagination
              responsive
              striped
              highlightOnHover
              noDataComponent="No district-wise image data found for the selected test."
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DistrictWiseImage;
