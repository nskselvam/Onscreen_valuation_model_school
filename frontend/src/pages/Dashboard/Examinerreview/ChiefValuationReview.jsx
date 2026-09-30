import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Badge,
  Form,
  InputGroup,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import DataTableBase from "react-data-table-component";
import UploadPageLayout from "../../../components/DashboardComponents/UploadPageLayout";
import { useGetChiefValuationReviewDataQuery } from "../../../redux-slice/valuationApiSlice";
import {
  setChiefValuationBarcodeData,
  clearChiefValuationBarcodeData,
} from "../../../redux-slice/valuationSlice";

import DashBoard from "../Common/userDetails.json";
import { Navigate } from "react-router-dom";

const DataTable = DataTableBase.default || DataTableBase;

const ChiefValuationReview = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const chiefValuationData = useSelector(
    (state) => state.valuaton_Data_basic.chiefValuationData
  );

  const userHeader =
    DashBoard.users.find((u) => u.id === userInfo.selected_role)?.Header ||
    "Dashboard";

  const Cheif_Camp_Id = chiefValuationData
    ? chiefValuationData.camp_id_chief
    : null;
  const Cheif_Camp_Office_Id = chiefValuationData
    ? chiefValuationData.camp_office_id_chief
    : null;
  const Chief_Eva_subject_dashboard = chiefValuationData
    ? chiefValuationData.Chief_Eva_subject_dashboard
    : null;

  const Examiner_Id = userInfo ? userInfo.username : null;

  const Chief_Valuation_Type = chiefValuationData
    ? chiefValuationData.Examiner_type
    : null;

  const {
    data: chiefValuationReview,
    isLoading: isLoadingChiefValuationData,
    error: errorChiefValuationData,
    refetch,
  } = useGetChiefValuationReviewDataQuery({
    subcode: chiefValuationData?.chief_sub_code,
    camp_id: chiefValuationData?.camp_id_chief,
    camp_office_id: chiefValuationData?.camp_office_id_chief,
    Examiner_type: userInfo.selected_role,
    valuation_type: chiefValuationData?.Chief_Eva_subject_dashboard,
    Eva_Id: chiefValuationData?.chief_examiner,
    Eva_Mon_Year: userInfo.eva_month_year,
    RevieWFlag: "E",
    chiefValuationtype: Chief_Valuation_Type,
    Evaluator_Id: chiefValuationData?.Evaluator_Id
  }, {
    skip: !chiefValuationData,
    refetchOnMountOrArgChange: true,
  });

  // Refetch data whenever component mounts or becomes visible
  useEffect(() => {
    if (chiefValuationData) refetch();
  }, [refetch, chiefValuationData]);

  // Refetch data when navigating back from accept/reject actions
  useEffect(() => {
    if (location.state?.refreshData && chiefValuationData) {
      refetch();
      // Clear the state to prevent refetch on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refetch, chiefValuationData]);
  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search term and sort rejected records to top
  const filteredData = useMemo(() => {
    if (!chiefValuationReview?.data) return [];

    const filtered = chiefValuationReview.data.filter(
      (item) =>
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Evaluator_Id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Eva_Mon_Year?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort: 1) Chief_Flg='E' AND Checked='Yes' (green) at top, 2) tot_round=0 (red) next, 3) rest
    return filtered.sort((a, b) => {
      const aIsRejected = a.Chief_Flg === 'E' && a.Checked === 'Yes';
      const bIsRejected = b.Chief_Flg === 'E' && b.Checked === 'Yes';
      const aIsZero = a.tot_round === 0 || a.tot_round === '0';
      const bIsZero = b.tot_round === 0 || b.tot_round === '0';
      
      // Rejected records (green) come first
      if (aIsRejected && !bIsRejected) return -1;
      if (!aIsRejected && bIsRejected) return 1;
      
      // If neither is rejected, zero tot_round records come next
      if (!aIsRejected && !bIsRejected) {
        if (aIsZero && !bIsZero) return -1;
        if (!aIsZero && bIsZero) return 1;
      }
      
      return 0;
    });
  }, [chiefValuationReview?.data, searchTerm]);

  // Custom styles for DataTable
  const customTableStyles = {
    headRow: {
      style: {
        backgroundColor: '#0d6efd',
        color: '#fff',
        fontWeight: '700',
        fontSize: '0.9rem',
        borderRadius: '6px 6px 0 0',
      },
    },
    headCells: { 
      style: { 
        color: '#fff', 
        fontWeight: '700',
        justifyContent: 'center',
      } 
    },
    rows: {
      style: { 
        fontSize: '0.85rem', 
        borderBottom: '1px solid #e9ecef',
      },
      highlightOnHoverStyle: { 
        backgroundColor: '#f8f9fa', 
        cursor: 'pointer',
      },
    },
    cells: {
      style: {
        justifyContent: 'center',
      }
    },
    pagination: { 
      style: { 
        borderTop: '1px solid #dee2e6', 
        fontSize: '0.85rem',
      } 
    },
  };

  // DataTable columns
  const columns = [
    {
      name: 'Sl.No',
      selector: (row, index) => index + 1,
      center: true,
      grow: 0.5,
      cell: (row, index) => {
        const isZeroMark = row.tot_round === 0 || row.tot_round === '0';
        const content = <div className="fw-semibold">{index + 1}</div>;
        
        if (isZeroMark) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>⚠️ Zero Mark - Requires Attention</Tooltip>}
            >
              {content}
            </OverlayTrigger>
          );
        }
        return content;
      },
    },
    {
      name: 'Barcode',
      selector: row => row.barcode,
      sortable: true,
      center: true,
      grow: 1,
      cell: row => {
        const isZeroMark = row.tot_round === 0 || row.tot_round === '0';
        const content = (
          <Badge bg="secondary" className="fs-6 fw-normal">
            {row.barcode}
          </Badge>
        );
        
        if (isZeroMark) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>⚠️ Zero Mark - Requires Attention</Tooltip>}
            >
              {content}
            </OverlayTrigger>
          );
        }
        return content;
      },
    },
    {
      name: 'Subcode',
      selector: row => row.subcode,
      sortable: true,
      center: true,
      grow: 0.8,
      cell: row => {
        const isZeroMark = row.tot_round === 0 || row.tot_round === '0';
        const content = <span className="fw-semibold text-primary">{row.subcode}</span>;
        
        if (isZeroMark) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>⚠️ Zero Mark - Requires Attention</Tooltip>}
            >
              {content}
            </OverlayTrigger>
          );
        }
        return content;
      },
    },
    {
      name: 'Evaluator ID',
      selector: row => row.Evaluator_Id,
      sortable: true,
      center: true,
      grow: 1,
      cell: row => {
        const isZeroMark = row.tot_round === 0 || row.tot_round === '0';
        const content = <span>{row.Evaluator_Id}</span>;
        
        if (isZeroMark) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>⚠️ Zero Mark - Requires Attention</Tooltip>}
            >
              {content}
            </OverlayTrigger>
          );
        }
        return content;
      },
    },
    {
      name: 'Evaluation Date',
      selector: row => row.checkdate,
      sortable: true,
      center: true,
      grow: 1,
      cell: row => {
        const isZeroMark = row.tot_round === 0 || row.tot_round === '0';
        const content = (
          <span className="text-muted">
            {row.checkdate.toString().substring(0, 10)}
          </span>
        );
        
        if (isZeroMark) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>⚠️ Zero Mark - Requires Attention</Tooltip>}
            >
              {content}
            </OverlayTrigger>
          );
        }
        return content;
      },
    },
    {
      name: 'Remarks',
      center: true,
      grow: 1.2,
      cell: row => (
        <Button
          variant="outline-primary"
          size="sm"
          className="px-3"
          onClick={() =>
            handleChiefValuationViewDetails(
              row.barcode,
              row.subcode,
              row.Evaluator_Id,
              row.Eva_Mon_Year,
              row.tot_round,
              row.checkdate,
              Cheif_Camp_Id,
              Cheif_Camp_Office_Id,
              Chief_Eva_subject_dashboard,
              Examiner_Id,
              Chief_Valuation_Type
            )
          }
        >
          {Chief_Valuation_Type == 1
            ? "Chief Valuation"
            : "Chief Review"}
        </Button>
      ),
    },
  ];

  // Conditional row styles based on data
  const conditionalRowStyles = [
    {
      when: row => row.Chief_Flg === 'E' && row.Checked === 'Yes',
      style: {
        backgroundColor: '#d4edda',
        borderLeft: '4px solid #28a745',
      },
    },
    {
      when: row => row.tot_round === 0 || row.tot_round === '0',
      style: {
        backgroundColor: '#f8d7da',
        borderLeft: '4px solid #dc3545',
      },
    },
  ];

  // Guard: if chiefValuationData was cleared (e.g. user navigated back), redirect to dashboard
  if (!chiefValuationData) {
    return <Navigate to="/examiner/valuation-review" replace />;
  }

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChiefValuationViewDetails = (
    barcode,
    subcode,
    Evaluator_Id,
    Eva_Mon_Year,
    tot_round,
    checkdate,
    camp_id_chief,
    camp_offcer_id_examiner,
    Chief_Eva_subject_dashboard,
    Examiner_Id,
    Chief_Valuation_Type
  ) => {
    const paperData = {
      barcode,
      subcode,
      Evaluator_Id,
      Eva_Mon_Year,
      tot_round,
      checkdate,
      camp_id_chief,
      camp_offcer_id_examiner,
      Chief_Eva_subject_dashboard,
      Examiner_Id,
      Chief_Valuation_Type,
      Dep_Name: userInfo?.selected_course || "01",
      department: userInfo?.selected_course || "01"
    };

    // Store in Redux as fallback
    dispatch(setChiefValuationBarcodeData(paperData));
    
    // Pass data through navigate state (primary method, like ReviewExaminer)
    if (Chief_Valuation_Type == 1) {
      navigate("/valuation/chief-valuation", { state: { paperData } });
    } else if (Chief_Valuation_Type == 7) {
      navigate("/valuation/chief-valuation-review-main", { state: { paperData } });
    }

    // Implement the logic to view details, e.g., open a modal or navigate to a detail page
  };

  return (
    <>
      <UploadPageLayout
        mainTopic={userHeader}
        subTopic="Manage and review examiner valuations11"
        cardTitle="Valuation Details"
      >
        <div>
          {isLoadingChiefValuationData ? (
            <p>Loading chief valuation data...</p>
          ) : errorChiefValuationData ? (
            <p>Error loading chief valuation data.</p>
          ) : (
            <div className="mt-0">
              <Row>
                <Col>
                  <h6>
                    {" "}
                    Examiner Name : {
                      chiefValuationReview?.Examiner_Name ? chiefValuationReview.Examiner_Name : "Unknown Examiner"
                    }{" "}
                  </h6>
                </Col>
                <Col className="text-end">
                  <h6> Subject Name : {chiefValuationData.chief_sub_name} </h6>
                </Col>
              </Row>
              <Row className="mb-1">
                <Col md={6} lg={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i> 🔍
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by barcode, subcode, evaluator ID..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Col>
                <Col md={6} lg={8} className="text-end">
                  <Badge bg="secondary" className="fs-6">
                    Total Records: {filteredData.length}
                  </Badge>
                </Col>
              </Row>

              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                highlightOnHover
                striped
                responsive
                customStyles={customTableStyles}
                conditionalRowStyles={conditionalRowStyles}
                noDataComponent={
                  <div className="text-center text-muted py-4">
                    {searchTerm
                      ? "No matching records found"
                      : "No data available"}
                  </div>
                }
              />
            </div>
          )}
        </div>
      </UploadPageLayout>
    </>
  );
};

export default ChiefValuationReview;
