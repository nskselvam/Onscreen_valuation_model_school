import React, { useState, useEffect, useCallback, useMemo } from "react";
import ValuationTemplate from "../../components/ValuationTemplate/ValuationTemplate";
import ValuationLeft from "../../components/ValuationLeft/ValuationLeft";
import ValuationRight from "../../components/ValuationRight/ValuationRight";
import { useGetValuationDataQuery } from "../../redux-slice/valuationApiSlice";
import { setValuationData } from "../../redux-slice/valuationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetValuationBarcodeDataQuery, useGetExaminerValuetionDataMutation } from "../../redux-slice/valuationApiSlice";
import { BASE_URL } from "../../constraint/constraint";
import { markInpInfoRemove } from "../../redux-slice/markApiSlice";
import { setExaminerValuationData } from "../../redux-slice/examinerValuationSlice";
import { useRejectedByChiefDataMutation } from "../../redux-slice/valuationApiSlice";
import { useGetSubjectDataQuery } from "../../redux-slice/SubjectMasterApiSlice";

import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

const ValuationMain = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};

  const [valuationData, setValuationDataState] = useState(null);
  const [valuationdatFromBack] = useGetExaminerValuetionDataMutation();
  const [rejectedByChiefData] = useRejectedByChiefDataMutation();
  const userInfo = useSelector((state) => state.auth?.userInfo);
  const monthyearInfo = useSelector((state) => state.auth?.monthyearInfo);
  const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);
  const { data: subjectMasterResponse } = useGetSubjectDataQuery();

  // Rejection data from chief examiner
  const [rejectionData, setRejectionData] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [_rejectionAcknowledged, setRejectionAcknowledged] = useState(false);

  const activeRecords = useMemo(() => 
    Array.isArray(monthyearInfo) ? monthyearInfo.filter((m) => m.Month_Year_Status === 'Y') : [],
    [monthyearInfo]
  );
  const ExamMonth = useMemo(() => 
    [...new Set(activeRecords.map((m) => m.Eva_Month))].map((m) => ({ id: m, name: m })),
    [activeRecords]
  );
  const ExamYear = useMemo(() => 
    [...new Set(activeRecords.map((m) => m.Eva_Year))].map((y) => ({ id: y, name: y })),
    [activeRecords]
  );

  // No dummy fallback values — valuation must only run on real backend/session data.
  const finalSubCode = Dashboard_Data?.sub_code || locationState.subcode || localStorage.getItem('currentSubCode') || "";
  const testCodesForSubcode = useMemo(() => {
    const subjects = Array.isArray(subjectMasterResponse?.data) ? subjectMasterResponse.data : [];
    return [...new Set(subjects.filter((item) => item.Subcode === finalSubCode).map((item) => item.testcode).filter(Boolean))];
  }, [subjectMasterResponse, finalSubCode]);
  const finalTestCode = Dashboard_Data?.testcode || locationState.testcode || (testCodesForSubcode.length === 1 ? testCodesForSubcode[0] : "");
  const subjectMasterPeriod = useMemo(() => {
    const subjects = Array.isArray(subjectMasterResponse?.data) ? subjectMasterResponse.data : [];
    const subject = subjects.find((item) => item.Subcode === finalSubCode && item.testcode === finalTestCode)
      || subjects.find((item) => item.Subcode === finalSubCode);
    return String(subject?.Eva_Mon_Year || '').trim();
  }, [subjectMasterResponse, finalSubCode, finalTestCode]);
  const selectedCouse = userInfo?.selected_course || Dashboard_Data?.department || locationState.department || "";
  const valuationType = String(Dashboard_Data?.Eva_subject_dashboard || locationState.valuation_type || "1");
  const Camp_id = String(Dashboard_Data?.Camp_id || locationState.Camp_id || "1");
  const camp_offcer_id_examiner = String(Dashboard_Data?.camp_offcer_id_examiner || locationState.camp_offcer_id_examiner || "1");
  const Examiner_type = String(userInfo?.selected_role || userInfo?.Role || locationState.selected_role || "11");
  const Max_Papers = String(Dashboard_Data?.Max_Papers || locationState.Max_Papers || "50");
  const Sub_Max_Papers = String(Dashboard_Data?.Sub_Max_Papers || locationState.Sub_Max_Papers || "50");

  const Eva_Id = userInfo?.username || userInfo?.User_Id || locationState.Eva_Id || "";
  const Eva_Name = userInfo?.name || userInfo?.User_Name || locationState.Examiner_Name || "";
  const Eva_Mon_Year = (ExamMonth[0]?.name && ExamYear[0]?.name)
    ? `${ExamMonth[0]?.name}_${ExamYear[0]?.name}`
    : (locationState.Eva_Mon_Year || subjectMasterPeriod || "");

  const { data, error } = useGetValuationDataQuery({
    subcode: finalSubCode,
    testcode: finalTestCode,
  });

  const { data: valuationBarcode, isLoading: isLoading1, error: error2, refetch: refetchBarcode } = useGetValuationBarcodeDataQuery(
    {
      subcode: finalSubCode,
      testcode: finalTestCode,
      valuation_type: valuationType,
      Eva_Id: Eva_Id,
      Eva_Mon_Year: Eva_Mon_Year,
      Camp_id: Camp_id,
      camp_offcer_id_examiner: camp_offcer_id_examiner,
      Examiner_type: Examiner_type,
      Max_Papers: Max_Papers,
      Sub_Max_Papers: Sub_Max_Papers,
      Dep_Name: selectedCouse,
    },
    { skip: !finalSubCode || !finalTestCode || !Eva_Id || !Eva_Mon_Year }
  );

  const batchname = useMemo(() => valuationBarcode?.data?.barcode || locationState.barcode || Dashboard_Data?.barcode || "", [valuationBarcode?.data?.barcode, locationState.barcode, Dashboard_Data?.barcode]);

  const activeDepName = valuationBarcode?.data?.Dep_Name || Dashboard_Data?.department || locationState.department || selectedCouse || "";
  const activeEvaMonYear = valuationBarcode?.data?.Eva_Mon_Year || Eva_Mon_Year || "";

  // Derived basicData for valuation
  const basicData = useMemo(() => ({
    sub_code: finalSubCode || "",
    testcode: finalTestCode || "",
    sub_name: Dashboard_Data?.sub_name || locationState.sub_name || "",
    Eva_Id: Eva_Id || "",
    Eva_Name: Eva_Name || "",
    barcode: batchname || "",
    Dep_Name: activeDepName || "",
    Eva_Mon_Year: activeEvaMonYear || "",
    Camp_id: Camp_id || "",
    camp_offcer_id_examiner: camp_offcer_id_examiner || "",
    Examiner_type: Examiner_type || "",
    Valuation_Type: valuationType || "",
  }), [finalSubCode, finalTestCode, Dashboard_Data?.sub_name, locationState.sub_name, Eva_Id, Eva_Name, batchname, activeDepName, activeEvaMonYear, Camp_id, camp_offcer_id_examiner, Examiner_type, valuationType]);

  // Check for rejection by chief examiner on mount
  useEffect(() => {
    const checkRejectionStatus = async () => {
      if (!batchname || !finalSubCode || !Eva_Id || !valuationType) return;

      // Reset acknowledgement for new paper
      setRejectionAcknowledged(false);

      try {
        const payload = {
          barcode: batchname,
          subcode: finalSubCode,
          eva_id: Eva_Id,
          valuation_type: valuationType
        };

        const response = await rejectedByChiefData(payload).unwrap();
        
        if (response.isDataThere) {
          setRejectionData(response);
          setShowRejectionModal(true);
        }
      } catch (error) {
        console.error("Error checking rejection status:", error);
      }
    };

    checkRejectionStatus();
  }, [batchname, finalSubCode, Eva_Id, valuationType, rejectedByChiefData]);

  useEffect(() => {
    const fetchValuationData = async () => {
      try {
        const responsefromBackend = await valuationdatFromBack({
          subcode: finalSubCode,
          testcode: finalTestCode,
          valuation_type: String(valuationType),
          Eva_Id: Eva_Id,
          barcode: batchname,
          Dep_Name: activeDepName,
        });

        setValuationDataState(responsefromBackend?.data);
      } catch (err) {
        console.error("Error fetching examiner valuation data:", err);
      }
    };

    if (batchname) {
      fetchValuationData();
    }
  }, [batchname, finalSubCode, finalTestCode, activeDepName, Eva_Id, valuationType, valuationdatFromBack]);



  // vasanth
  const [show, setShow] = useState(false);
  const openFullscreenModal = useCallback(async () => {
    // Request browser fullscreen
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    setShow(true);
  }, []);

  const closeModal = useCallback(async () => {
    setShow(false);

    // Exit fullscreen when modal closes
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const [height] = useState(window.innerHeight);
  // vasanth



  // image index state (start from 1). We'll limit to START..END
  const START_IMG = 1;
  const END_IMG = Number(valuationBarcode?.data?.ImgCnt) || 6;
  const imageIndices = useMemo(() => {
    const len = Math.max(1, END_IMG - START_IMG + 1);
    return Array.from({ length: len }, (_, i) => START_IMG + i);
  }, [START_IMG, END_IMG]);
  const [imgNumber, setImgNumber] = useState(START_IMG);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagesPerModal, setPagesPerModal] = useState(2);
  // Track which image numbers have been viewed (so we can enable submit when all viewed)
  const [viewedSet, setViewedSet] = useState(() => new Set());
  // Track current marks from ValuationRight
  const [currentMarks, setCurrentMarks] = useState(0);
  // Track finalization modal state from ValuationRight
  const [isFinalizationModalOpen, setIsFinalizationModalOpen] = useState(false);
  // Track remarks modal state from ValuationRight
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  // Track remarks modal state from ValuationLeft
  const [isLeftRemarksModalOpen, setIsLeftRemarksModalOpen] = useState(false);
  // Track rotation for each page (0, 90, 180, 270 degrees)
  const [pageRotations, setPageRotations] = useState({});
  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Map internal image number to user-facing page number (start at 1 when imgNumber=START_IMG)
  const totalPages = Math.max(1, END_IMG >= START_IMG ? END_IMG - START_IMG + 1 : 0);
  const displayPage = Math.min(totalPages, Math.max(1, Number(imgNumber) - START_IMG + 1));

  // Build direct image URL from params
  const buildImageUrl = useCallback((imgNum) => {
    if (!batchname || imgNum < START_IMG || imgNum > END_IMG) return null;
    const params = new URLSearchParams({
      batchname: String(batchname),
      subcode: String(finalSubCode),
      testcode: String(finalTestCode),
      Dep_Name: String(activeDepName),
      Img_Number: String(imgNum),
      Eva_Mon_Year: String(activeEvaMonYear),
    });
    return `${BASE_URL}/api/v1/valuation/valuation_images?${params.toString()}`;
  }, [batchname, finalSubCode, finalTestCode, activeDepName, activeEvaMonYear, START_IMG, END_IMG]);

  const imgUrl = buildImageUrl(imgNumber);
  const img2Url = modalOpen && pagesPerModal >= 2 && imgNumber + 1 <= END_IMG ? buildImageUrl(imgNumber + 1) : null;
  const img3Url = modalOpen && pagesPerModal >= 3 && imgNumber + 2 <= END_IMG ? buildImageUrl(imgNumber + 2) : null;
  const img4Url = modalOpen && pagesPerModal >= 4 && imgNumber + 3 <= END_IMG ? buildImageUrl(imgNumber + 3) : null;

  // Reset image loaded state when imgNumber changes
  React.useEffect(() => {
    setImageLoaded(false);
    setIsNavigating(false);
  }, [imgNumber]);

  // Handle image load - also mark as viewed
  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsNavigating(false);
    setViewedSet((prev) => {
      const next = new Set(prev);
      next.add(Number(imgNumber));
      return next;
    });
  };

  // Navigate to next/previous image with loading state
  const navigateImage = useCallback((direction) => {
    if (isNavigating || !imageLoaded) return;

    const current = Number(imgNumber);
    const upperBound = Math.max(START_IMG, Number(END_IMG));
    const next = direction === 'prev'
      ? Math.max(START_IMG, current - 1)
      : Math.min(upperBound, current + 1);

    // Avoid entering loading state when there is no actual page change.
    if (next === current) return;

    setIsNavigating(true);
    setImgNumber(next);
  }, [isNavigating, imageLoaded, imgNumber, START_IMG, END_IMG]);

  // Mark modal images as viewed on load
  const handleModalImageLoad = useCallback((imgNum) => {
    setViewedSet((prev) => {
      const next = new Set(prev);
      next.add(Number(imgNum));
      return next;
    });
  }, []);

  // Calculate actual pages to display (min of pagesPerModal and remaining pages)
  // Ensure the last page is always shown alone
  const getActualPagesToDisplay = () => {
    const remainingPages = END_IMG - imgNumber + 1;
    // If we're not on the last page, check if showing pagesPerModal would include the last page
    if (imgNumber < END_IMG && imgNumber + pagesPerModal - 1 >= END_IMG) {
      // Stop before the last page so it can be shown alone
      return END_IMG - imgNumber;
    }
    return Math.min(pagesPerModal, Math.max(1, remainingPages));
  };

  const actualPagesToDisplay = getActualPagesToDisplay();

  const getNextModalStart = () => Math.min(END_IMG, imgNumber + actualPagesToDisplay);
  const getPrevModalStart = () => Math.max(START_IMG, imgNumber - pagesPerModal);

  // Get page styling based on actual pages to display and page index
  const getPageStyle = (pageIndex) => {
    const baseHeight = actualPagesToDisplay === 1 ? `${height + 53}px` : 
                       actualPagesToDisplay === 2 ? `${height + 53}px` :
                       `${height + 45}px`;
    
    if (actualPagesToDisplay === 1) {
      return {
        height: baseHeight,
        width: "100%",
        marginLeft: "0%"
      };
    } else if (actualPagesToDisplay === 2) {
      return {
        height: baseHeight,
        width: "50%",
        marginLeft: "0%"
      };
    } else if (actualPagesToDisplay === 3) {
      return {
        height: baseHeight,
        width: "45%",
        marginLeft: pageIndex === 0 ? "35%" : "0%"
      };
    } else { // 4 pages
      return {
        height: baseHeight,
        width: "45%",
        marginLeft: pageIndex === 0 ? "80%" : "0%"
      };
    }
  };

  useEffect(() => {
    if (data && valuationBarcode) {
      dispatch(setValuationData(data));
    }
    if (error) {
      console.error("Error fetching valuation data:", error);
    }
    if (error2) {
      console.error("Error fetching valuation barcode:", error2);
    }
  }, [data, valuationBarcode, error, error2, dispatch]);

  // Keyboard navigation: ArrowUp -> previous image, ArrowDown -> next image
  React.useEffect(() => {
    const onKeyDown = (e) => {
      // ignore when typing in inputs
      const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      
      // Don't navigate if image is still loading
      if (isNavigating || !imageLoaded) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateImage('prev');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateImage('next');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNavigating, imageLoaded, navigateImage]);

  // Handle finalization completion - load next paper
  const handleFinalizationComplete = async () => {
    try {
      // Clear Redux state (except userInfo)
      dispatch(markInpInfoRemove());
      dispatch(setExaminerValuationData(null));

      // Reset local state
      setValuationDataState(null);
      setImgNumber(START_IMG);
      setViewedSet(new Set());
      setModalOpen(false);
      setCurrentMarks(0);
      setRejectionAcknowledged(false); // Reset for next paper

      // Re-fetch the next barcode to get next paper
      const result = await refetchBarcode();

      // If no more papers available (error or empty barcode), navigate away
      if (result.error || !result.data?.data?.barcode) {
        navigate("/examiner/valuation-review");
      }

    } catch (error) {
      console.error('Error loading next paper:', error);
      navigate("/examiner/valuation-review");
    }
  };

  // Handle marks update from ValuationRight - memoized to prevent re-render loop
  const handleMarksUpdate = useCallback((marks) => {
    setCurrentMarks(marks);
  }, []);

  // Handle modal state change from ValuationRight
  const handleModalStateChange = useCallback((isOpen) => {
    setIsFinalizationModalOpen(isOpen);
  }, []);

  // Handle remarks modal state change from ValuationRight
  const handleRemarksModalStateChange = useCallback((isOpen) => {
    setIsRemarksModalOpen(isOpen);
  }, []);

  // Handle remarks modal state change from ValuationLeft
  const handleLeftRemarksModalStateChange = useCallback((isOpen) => {
    setIsLeftRemarksModalOpen(isOpen);
  }, []);

  // Rotate current page by 90 degrees
  const handleRotateCurrentPage = () => {
    setPageRotations(prev => {
      const currentRotation = prev[imgNumber] || 0;
      const newRotation = (currentRotation + 90) % 360;
      return { ...prev, [imgNumber]: newRotation };
    });
  };

  // Rotate all pages from current page onwards by 90 degrees
  const handleRotateAllFromCurrent = () => {
    setPageRotations(prev => {
      const updated = { ...prev };
      for (let i = imgNumber; i <= END_IMG; i++) {
        const currentRotation = prev[i] || 0;
        updated[i] = (currentRotation + 90) % 360;
      }
      return updated;
    });
  };

  // Get rotation for a specific image number
  const getRotation = (imgNum) => pageRotations[imgNum] || 0;

  if (!isLoading1 && valuationBarcode?.BarcodeStatus === false) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
        <div className="bg-white border rounded-3 shadow-sm p-4 text-center" style={{ maxWidth: 520 }}>
          <h2 className="h4 mb-2">No papers available</h2>
          <p className="text-secondary mb-1">
            {valuationBarcode.message}
          </p>
          <p className="small text-secondary mb-4">
            Papers may already be completed or currently open with other examiners.
          </p>
          <Button variant="primary" onClick={() => navigate("/examiner/valuation-review")}>
            Back to subjects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chief Rejection Modal */}
      <Modal
        show={showRejectionModal}
        onHide={() => {
          setShowRejectionModal(false);
          setRejectionAcknowledged(true);
        }}
        backdrop="static"
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8d7da', borderBottom: '2px solid #f5c6cb' }}>
          <Modal.Title style={{ color: '#721c24', fontWeight: '600' }}>
            ⚠️ Paper Rejected by Chief Examiner
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <strong>Barcode:</strong> {rejectionData?.data?.barcode || 'N/A'}
            </p>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              <strong>Subject:</strong> {rejectionData?.remarks?.evaluator_subject || rejectionData?.data?.evaluator_subject || rejectionData?.data?.sub_name || 'N/A'}
            </p>
          </div>
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <h5 style={{ color: '#856404', marginBottom: '1rem' }}>Chief Examiner's Remarks:</h5>
            <p style={{ 
              fontSize: '1.05rem', 
              lineHeight: '1.6',
              color: '#333',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
              {rejectionData?.remarks?.msg || rejectionData?.data?.remarks || rejectionData?.data?.msg || rejectionData?.message || 'No remarks provided'}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowRejectionModal(false);
              setRejectionAcknowledged(true);
            }}
            style={{ padding: '0.5rem 2rem' }}
          >
            I Understand, Continue
          </Button>
        </Modal.Footer>
      </Modal>

      <ValuationTemplate
        leftComponent={<ValuationLeft imgNumber={imgNumber} setImgNumber={(value) => {
          if (isNavigating || !imageLoaded) return;

          const current = Number(imgNumber);
          const rawNext = Number(value);
          if (Number.isNaN(rawNext)) return;

          const upperBound = Math.max(START_IMG, Number(END_IMG));
          const next = Math.min(upperBound, Math.max(START_IMG, rawNext));

          // Avoid entering loading state when there is no actual page change.
          if (next === current) return;

          setIsNavigating(true);
          setImgNumber(next);
        }} openModal={() => setModalOpen(true)} onClickbutton={openFullscreenModal} setPagesPerModal={setPagesPerModal} pagesPerModal={pagesPerModal} minImg={imageIndices[0]} maxImg={imageIndices[imageIndices.length - 1]} subcode={finalSubCode} testcode={finalTestCode} onRotateCurrentPage={handleRotateCurrentPage} onRotateAllPages={handleRotateAllFromCurrent} basicData={basicData} totalPages={totalPages} onLeftRemarksModalStateChange={handleLeftRemarksModalStateChange} isImageLoading={isNavigating || !imageLoaded} />}
        rightComponent={<ValuationRight questionMain={data} barcodeData={valuationBarcode} viewedCount={viewedSet.size} totalCount={imageIndices.length} currentPage={displayPage} imgNumber={imgNumber} end_image={END_IMG} responseDataFromValuation={valuationData} onFinalizationComplete={handleFinalizationComplete} onMarksUpdate={handleMarksUpdate} onModalStateChange={handleModalStateChange} onRemarksModalStateChange={handleRemarksModalStateChange} basicData={basicData} rejectionData={rejectionData} hideRejectionModal={true} />}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Page badge at top-center of viewport */}
          {!show && !isFinalizationModalOpen && !isRemarksModalOpen && !isLeftRemarksModalOpen && (
            <>
              <div className="d-flex justify-content-center">
                <div
                  style={{
                    position: 'fixed',
                    top: -4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    padding: '0.6rem 0.8rem',
                    color: '#000000',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                    fontWeight: 700,
                  }}
                >
                  Page {displayPage} / {totalPages}
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <div
                  style={{
                    position: 'fixed',
                    top: -4,
                    right: 500,
                    zIndex: 9999,
                    padding: '0.6rem 0.8rem',
                    color: '#111',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                    fontWeight: 700,
                  }}
                >
                  Marks : {currentMarks}
                </div>
              </div>
               {/* <div className="d-flex justify-content-end">
                <div
                  style={{
                    position: 'fixed',
                    top: -4,
                    right: 874,
                    zIndex: 9999,
                    padding: '0.6rem 0.8rem',
                    color: '#111',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                    fontWeight: 700,
                  }}
                >
                  Max Qbs Marks : {maxQuestionMark}
                </div>
              </div> */}
            </>
          )}
          {/* Left / Right glassmorphism buttons */}
          <button
            onClick={() => navigateImage('prev')}
            disabled={imgNumber <= START_IMG || isNavigating || !imageLoaded}
            style={{
              position: 'fixed',
              // left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              border: 'none',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              background: (imgNumber <= START_IMG || isNavigating || !imageLoaded) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: '#fe0000',
              cursor: (imgNumber <= START_IMG || isNavigating || !imageLoaded) ? 'not-allowed' : 'pointer',
              opacity: (imgNumber <= START_IMG || isNavigating || !imageLoaded) ? '30%' : '50%',
              fontSize: '1.4rem',
              lineHeight: 1
            }}
            aria-label="Previous image"
          >
            <b>
            ‹
            </b>
          </button>
          <div className="d-flex justify-content-end">
            <button
              onClick={() => navigateImage('next')}
              disabled={imgNumber >= END_IMG || isNavigating || !imageLoaded}
              style={{
                position: 'fixed',
                // right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                border: 'none',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                background: (imgNumber >= END_IMG || isNavigating || !imageLoaded) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                color: '#fe0000',
                cursor: (imgNumber >= END_IMG || isNavigating || !imageLoaded) ? 'not-allowed' : 'pointer',
                fontSize: '1.4rem',
                lineHeight: 1,
                opacity: (imgNumber >= END_IMG || isNavigating || !imageLoaded) ? '30%' : '50%',
              }}
              aria-label="Next image"
            >
              <b>

              ›
              </b>
            </button>
          </div>

          {/* Image area: centered and fills available white space */}
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Show loader while image is loading */}
            {(!imageLoaded || isNavigating) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '6px solid #f3f3f3',
                  borderTop: '6px solid #0066cc',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{
                  color: '#0066cc',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Loading page {displayPage}...
                </div>
              </div>
            )}
            {imgUrl ? (
              <img
                src={imgUrl}
                alt="valuation"
                onLoad={handleImageLoad}
                onError={() => {
                  setImageLoaded(true);
                  setIsNavigating(false);
                }}
                style={{
                  maxWidth: getRotation(imgNumber) % 180 === 0 ? '100%' : 'none',
                  maxHeight: getRotation(imgNumber) % 180 === 0 ? '100%' : 'none',
                  width: getRotation(imgNumber) % 180 === 0 ? '100%' : 'auto',
                  height: getRotation(imgNumber) % 180 === 0 ? 'auto' : '100%',
                  transform: `rotate(${getRotation(imgNumber)}deg)`,
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'transform 0.3s ease, opacity 0.3s ease'
                }}
              />
            ) : null}
          </div>


          <Modal
            size="lg"
            show={show} fullscreen onHide={closeModal}
            aria-labelledby="example-modal-sizes-title-lg"
          >
            <Modal.Header closeButton>
              <Modal.Title id="example-modal-sizes-title-lg">
                Answer Sheet View
              </Modal.Title>
              <div className="center_card_1">
                <div className="w-100 text-center">
                  <button
                    className={`valuation-page-btn ${pagesPerModal === 2 ? 'active' : ''}`}
                    onClick={() => setPagesPerModal(2)}
                  >
                    2
                  </button>
                  <button
                    className={`valuation-page-btn ${pagesPerModal === 3 ? 'active' : ''}`}
                    onClick={() => setPagesPerModal(3)}
                  >
                    3
                  </button>
                  <button
                    className={`valuation-page-btn ${pagesPerModal === 4 ? 'active' : ''}`}
                    onClick={() => setPagesPerModal(4)}
                  >
                    4
                  </button>
                </div>
              </div>
            </Modal.Header>
            <Modal.Body>

              {/* Modal for multi-page view */}
              {modalOpen ? (
                <>
                  <div className="page_size_design_2">
                    <button
                      onClick={() => setImgNumber(getPrevModalStart())}
                      disabled={imgNumber <= START_IMG}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        border: 'none',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: imgNumber <= 3 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: imgNumber <= 3 ? '#666' : '#000',
                        cursor: imgNumber <= 3 ? 'not-allowed' : 'pointer',
                        opacity: imgNumber <= 3 ? 0.75 : 1,
                        fontSize: '1.4rem',
                        lineHeight: 1
                      }}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>

                    <button
                      onClick={() => setImgNumber(getNextModalStart())}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        border: 'none',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: '#000',
                        cursor: 'pointer',
                        fontSize: '1.4rem',
                        lineHeight: 1
                      }}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                    <div className="valuation-modal-images page_size_design_1" role="list">
                      {imgUrl && actualPagesToDisplay >= 1 && (
                        <div className="valuation-modal-image-wrap"
                          style={getPageStyle(0)} role="listitem">
                          <img src={imgUrl} alt="p1" onLoad={() => handleModalImageLoad(imgNumber)} style={{ transform: `rotate(${getRotation(imgNumber)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 2 && img2Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(1)} role="listitem">
                          <img src={img2Url} alt="p2" onLoad={() => handleModalImageLoad(imgNumber + 1)} style={{ transform: `rotate(${getRotation(imgNumber + 1)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 3 && img3Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(2)} role="listitem">
                          <img src={img3Url} alt="p3" onLoad={() => handleModalImageLoad(imgNumber + 2)} style={{ transform: `rotate(${getRotation(imgNumber + 2)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 4 && img4Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(3)} role="listitem">
                          <img src={img4Url} alt="p4" onLoad={() => handleModalImageLoad(imgNumber + 3)} style={{ transform: `rotate(${getRotation(imgNumber + 3)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </Modal.Body>
          </Modal>
          {/* Modal for multi-page view */}
          {/* {modalOpen ? (
            <div className="valuation-modal-overlay" onClick={() => setModalOpen(false)}>
              <div className="valuation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="valuation-modal-header">
                  <h3 className="valuation-modal-title">Answer Sheet View</h3>
                             <div className="valuation-modal-controls">
                  <span className="valuation-pages-label">Pages:</span>
                  <div className="valuation-page-selector">
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 2 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(2)}
                    >
                      2
                    </button>
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 3 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(3)}
                    >
                      3
                    </button>
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 4 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(4)}
                    >
                      4
                    </button>
                  </div>
                </div>
                  <button 
                    className="valuation-modal-close"
                    onClick={() => setModalOpen(false)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* <div className="valuation-modal-controls">
                  <span className="valuation-pages-label">Pages:</span>
                  <div className="valuation-page-selector">
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 2 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(2)}
                    >
                      2
                    </button>
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 3 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(3)}
                    >
                      3
                    </button>
                    <button 
                      className={`valuation-page-btn ${pagesPerModal === 4 ? 'active' : ''}`}
                      onClick={() => setPagesPerModal(4)}
                    >
                      4
                    </button>
                  </div>
                </div> *

   <button
            onClick={() => setImgNumber((n) => Math.max(START_IMG, Number(n) - 1))}
            disabled={imgNumber <= START_IMG}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              border: 'none',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              background: imgNumber <= 3 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: imgNumber <= 3 ? '#666' : '#000',
              cursor: imgNumber <= 3 ? 'not-allowed' : 'pointer',
              opacity: imgNumber <= 3 ? 0.75 : 1,
              fontSize: '1.4rem',
              lineHeight: 1
            }}
            aria-label="Previous image"
          >
            ‹
          </button>

          <button
            onClick={() => setImgNumber((n) => Math.min(END_IMG, Number(n) + 1))}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              border: 'none',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: '#000',
              cursor: 'pointer',
              fontSize: '1.4rem',
              lineHeight: 1
            }}
            aria-label="Next image"
          >
            ›
          </button>
                <div className="valuation-modal-images" role="list">
                  {dataimage && (
                    <div className="valuation-modal-image-wrap" role="listitem">
                      <img src={`data:image/jpeg;base64,${dataimage}`} alt="p1" />
                    </div>
                  )}
                  {pagesPerModal >= 2 && image2Data?.image && (
                    <div className="valuation-modal-image-wrap" role="listitem">
                      <img src={`data:image/jpeg;base64,${image2Data.image}`} alt="p2" />
                    </div>
                  )}
                  {pagesPerModal >= 3 && image3Data?.image && (
                    <div className="valuation-modal-image-wrap" role="listitem">
                      <img src={`data:image/jpeg;base64,${image3Data.image}`} alt="p3" />
                    </div>
                  )}
                  {pagesPerModal >= 4 && image4Data?.image && (
                    <div className="valuation-modal-image-wrap" role="listitem">
                      <img src={`data:image/jpeg;base64,${image4Data.image}`} alt="p4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null} */}
        </div>
      </ValuationTemplate>
    </>
  );
};

export default ValuationMain;
