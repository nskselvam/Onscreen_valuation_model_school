import React, { useState, useEffect, useCallback, useMemo } from "react";
import ValuationTemplate from "../../components/ValuationTemplate/ValuationTemplate";
import ValuationLeft from "../../components/ValuationLeft/ValuationLeft";
import ValuationChiefRight from "../../components/ValuationRight/ValuationChiefRight";
import { useGetValuationDataQuery } from "../../redux-slice/valuationApiSlice";
import { setValuationData } from "../../redux-slice/valuationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetvaluation_chief_Barcode_DataQuery, useGetExaminerValuetionDataMutation } from "../../redux-slice/valuationApiSlice";
import { BASE_URL } from "../../constraint/constraint";
import { markInpInfoRemove } from "../../redux-slice/markApiSlice";
import { setExaminerValuationData } from "../../redux-slice/examinerValuationSlice";

import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

const ValuationchiefMain = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [valuationData, setValuationDataState] = useState(null);
  const [valuationdatFromBack] = useGetExaminerValuetionDataMutation();
  
  const userInfo = useSelector((state) => state.auth?.userInfo);
  const chiefValuationData = useSelector((state) => state.valuaton_Data_basic?.chiefValuationBarcodeData);

  // Redirect if chiefValuationData is missing (e.g., on page reload)
  useEffect(() => {
    if (!chiefValuationData || !chiefValuationData.subcode) {
      console.warn("Chief valuation data missing - redirecting to review page");
      navigate("/valuation/chief-valuation-review");
    }
  }, [chiefValuationData, navigate]);

  const finalSubCode = chiefValuationData?.subcode;
  const selectedCourse = chiefValuationData?.department || userInfo?.selected_course;
  const valuationType = chiefValuationData?.Chief_Eva_subject_dashboard;
  const camp_id_chief = chiefValuationData?.camp_id_chief;
  const camp_offcer_id_examiner = chiefValuationData?.camp_offcer_id_examiner;
  const Examiner_type = userInfo?.selected_role;
  const Evaluator_Id = chiefValuationData?.Evaluator_Id;
  const Examiner_Id = userInfo.username;
  
  console.log("Chief Valuation Data from Redux:", chiefValuationData);


  // Fetch valuation chief barcode data
  const {
    data: valuation_chief_barcode,
    error,
  } = useGetvaluation_chief_Barcode_DataQuery(
    {
      subcode: finalSubCode,
      valuation_type: String(valuationType),
      Examiner_type: Examiner_type,
      Eva_Id: Evaluator_Id,
      barcode: chiefValuationData?.barcode,
      Examiner_Id: Examiner_Id,
      camp_id_chief: camp_id_chief,
      camp_offcer_id_examiner: camp_offcer_id_examiner,
      chief_valuation_Meth: "V"


    },
    { skip: !finalSubCode }
  );

  useEffect(() => {
    if (error) {
      navigate("/valuation/chief-valuation-review");
    }
  }, [error, navigate]);

  const batchname = valuation_chief_barcode?.data?.barcode;

  // Derived from existing data - useMemo avoids the extra re-render a useState+useEffect pair would cause
  const basicData = useMemo(() => ({
    sub_code: finalSubCode || "",
    sub_name: chiefValuationData?.chief_sub_name || "",
    Eva_Id: Evaluator_Id || "",
    Eva_Name: userInfo?.name || "",
    barcode: batchname || "",
    Dep_Name: selectedCourse || "",
    Eva_Mon_Year: userInfo?.eva_month_year || "",
    Camp_id: camp_id_chief || "",
    camp_offcer_id_examiner: camp_offcer_id_examiner || "",
    Examiner_type: Examiner_type || "",
    Examiner_Id: Examiner_Id || "",
    Valuation_Type: valuationType || ""

  }), [finalSubCode, chiefValuationData?.chief_sub_name, Evaluator_Id, userInfo?.name, batchname, selectedCourse, userInfo?.eva_month_year, camp_id_chief, camp_offcer_id_examiner, Examiner_type, Examiner_Id, valuationType]);

  // Fetch question data
  const { data, error: error2 } = useGetValuationDataQuery({
    subcode: finalSubCode,
  });

  useEffect(() => {
    if (error2) {
      navigate("/valuation/chief-valuation-review");
    }
  }, [error2, navigate]);

  useEffect(() => {
    const fetchValuationData = async () => {
      try {
        const responsefromBackend = await valuationdatFromBack({
          subcode: finalSubCode,
          valuation_type: String(valuationType),
          Eva_Id: userInfo?.username, // Chief examiner's ID (600309)
          barcode: batchname,
          Dep_Name: selectedCourse,
          Examiner_type: Examiner_type // Fetch chief's own corrections
        })

        setValuationDataState(responsefromBackend?.data)

      } catch (err) {
        console.error("Error fetching examiner valuation data:", err);
      }
    };

    if (batchname) {
      fetchValuationData();
    }
  }, [batchname, finalSubCode, Examiner_type, selectedCourse, userInfo?.username, valuationType, valuationdatFromBack])

  // Fullscreen modal state (vasanth)
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

  // image index state (start from 3). We'll limit to START..END (3..50 => 48 images)
  const START_IMG = 3;
  const END_IMG = Number(valuation_chief_barcode?.data?.ImgCnt) || 0; // inclusive (fixed max per requirement)
  // array of image numbers loaded into a variable (can be replaced by backend later)
  const [imageIndices] = useState(() => Array.from({ length: END_IMG - START_IMG + 1 }, (_, i) => START_IMG + i));
  const [imgNumber, setImgNumber] = useState(START_IMG);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagesPerModal, setPagesPerModal] = useState(2);
  // Track which image numbers have been viewed (so we can enable submit when all viewed)
  const [viewedSet, setViewedSet] = useState(() => new Set());
  // Track current marks from ValuationChiefRight
  const [currentMarks, setCurrentMarks] = useState(0);
  // Track finalization modal state from ValuationChiefRight
  const [isFinalizationModalOpen, setIsFinalizationModalOpen] = useState(false);
  // Track remarks modal state from ValuationChiefRight
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
  const evaMonYear = userInfo?.eva_month_year;
  const buildImageUrl = useCallback((imgNum) => {
    if (!batchname || imgNum < START_IMG || imgNum > END_IMG) return null;
    const params = new URLSearchParams({
      batchname,
      subcode: finalSubCode,
      Dep_Name: selectedCourse,
      Img_Number: String(imgNum),
      Eva_Mon_Year: evaMonYear,
    });
    return `${BASE_URL}/api/v1/valuation/valuation_images?${params.toString()}`;
  }, [batchname, finalSubCode, selectedCourse, evaMonYear, START_IMG, END_IMG]);

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
    if (data && valuation_chief_barcode) {
      dispatch(setValuationData(data));
    }
    if (error) {
      console.error("Error fetching valuation data:", error);
    }
    if (error2) {
      console.error("Error fetching valuation barcode:", error2);
    }
  }, [data, valuation_chief_barcode, error, error2, dispatch]);

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
  }, [START_IMG, END_IMG, isNavigating, imageLoaded, navigateImage]);
  

  // Handle finalization completion - return to chief review
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

      // Navigate back to chief review
      navigate('/valuation/chief-valuation-review');

    } catch (error) {
      console.error('Error during finalization:', error);
    }
  };

  // Handle marks update from ValuationChiefRight - memoized to prevent re-render loop
  const handleMarksUpdate = useCallback((marks) => {
    setCurrentMarks(marks);
  }, []);

  // Handle modal state change from ValuationChiefRight
  const handleModalStateChange = useCallback((isOpen) => {
    setIsFinalizationModalOpen(isOpen);
  }, []);

  // Handle remarks modal state change from ValuationChiefRight
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

  return (
    <>
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
        }} openModal={() => setModalOpen(true)} onClickbutton={openFullscreenModal} setPagesPerModal={setPagesPerModal} pagesPerModal={pagesPerModal} minImg={imageIndices[0]} maxImg={imageIndices[imageIndices.length - 1]} subcode={finalSubCode} onRotateCurrentPage={handleRotateCurrentPage} onRotateAllPages={handleRotateAllFromCurrent} basicData={basicData} totalPages={totalPages} onLeftRemarksModalStateChange={handleLeftRemarksModalStateChange} isImageLoading={isNavigating || !imageLoaded} />}
        rightComponent={<ValuationChiefRight questionMain={data} barcodeData={valuation_chief_barcode} viewedCount={viewedSet.size} totalCount={imageIndices.length} currentPage={displayPage} imgNumber={imgNumber} end_image={END_IMG} responseDataFromValuation={valuationData} onFinalizationComplete={handleFinalizationComplete} onMarksUpdate={handleMarksUpdate} onModalStateChange={handleModalStateChange} onRemarksModalStateChange={handleRemarksModalStateChange} basicData={basicData} />}
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
        </div>
      </ValuationTemplate>
    </>
  );
};

export default ValuationchiefMain;
