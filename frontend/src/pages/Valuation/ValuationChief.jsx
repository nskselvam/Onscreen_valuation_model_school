import React, { useState, useEffect, useCallback, useMemo } from "react";
import ValuationTemplate from "../../components/ValuationTemplate/ValuationTemplate";
import ValuationLeft from "../../components/ValuationLeft/ValuationLeft";
import ValuationRight from "../../components/ValuationRight/ValuationRight";
import { useGetValuationDataQuery } from "../../redux-slice/valuationApiSlice";
import { setValuationData } from "../../redux-slice/valuationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useGetValuationBarcodeDataQuery, useGetValuationImageDataQuery, useGetExaminerValuetionDataMutation } from "../../redux-slice/valuationApiSlice";
import { markInpInfoRemove } from "../../redux-slice/markApiSlice";
import { setExaminerValuationData } from "../../redux-slice/examinerValuationSlice";
import { useNavigate } from "react-router-dom";


import Modal from 'react-bootstrap/Modal';
const ValuationChief = () => {
  const dispatch = useDispatch();
  const [valuationData, setValuationDataState] = useState(null);
  const [valuationdatFromBack] = useGetExaminerValuetionDataMutation()
  const reduxSubCode = useSelector((state) => state.valuaton_Data_basic?.currentSubCode);
  const monthyearInfo = useSelector((state) => state.auth.monthyearInfo);
  const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);

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


    const location = useLocation();
    const userInfo = useSelector((state) => state.auth.userInfo);
    const reduxChiefValuationData = useSelector(
      (state) => state.valuaton_Data_basic.chiefValuationBarcodeData
    );
    const navigate = useNavigate();
    
    // Get paper data from location.state or Redux fallback (like ReviewExaminer)
    const { paperData } = location.state || {};
    const chiefValuationData = paperData || reduxChiefValuationData;
    
    // Show warning if paper data is missing (same as ReviewExaminer)
    if (!chiefValuationData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', background: '#fee', borderRadius: '8px', margin: '20px' }}>
          <h3 style={{ color: '#c33' }}>⚠️ Error: Paper Data Not Found</h3>
          <p>Please go back and select a paper to review.</p>
          <button onClick={() => window.history.back()} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      );
    }
  
  const finalSubCode = Dashboard_Data.sub_code;
  const selectedCouse = userInfo?.selected_course
  const valuationType = Dashboard_Data.Eva_subject_dashboard;
  const Camp_id = Dashboard_Data.Camp_id;
  const camp_offcer_id_examiner = Dashboard_Data.camp_offcer_id_examiner;
  const Examiner_type = userInfo?.selected_role;
  const Max_Papers = Dashboard_Data.Max_Papers;
  const Sub_Max_Papers = Dashboard_Data.Sub_Max_Papers;






  const { data, isLoading, error } = useGetValuationDataQuery({
    subcode: finalSubCode,
  });

  useEffect(() => {
    if (error) {
      navigate("/examiner/valuation-review");
    }
  }, [error]);


  const { data: valuationBarcode, isLoading: isLoading1, error: error2, refetch: refetchBarcode } = useGetValuationBarcodeDataQuery(
    {
      subcode: finalSubCode,
      valuation_type: String(valuationType),
      Eva_Id: userInfo?.username,
      Eva_Mon_Year: `${ExamMonth[0]?.name}_${ExamYear[0]?.name}` || 'Nov_2025',
      Camp_id: Camp_id,
      camp_offcer_id_examiner: camp_offcer_id_examiner,
      Examiner_type: Examiner_type,
      Max_Papers: Max_Papers,
      Sub_Max_Papers: Sub_Max_Papers,
      Dep_Name: selectedCouse,
    },
    { skip: !finalSubCode }
  );

  useEffect(() => {
    if (error2) {
      navigate("/examiner/valuation-review");
    }
  }, [error2]);

  const batchname = useMemo(() => valuationBarcode?.data?.barcode, [valuationBarcode?.data?.barcode]);

  // Derived from existing data - useMemo avoids the extra re-render a useState+useEffect pair would cause
  const basicData = useMemo(() => ({
    sub_code: finalSubCode || "",
    sub_name: Dashboard_Data.sub_name || "",
    Eva_Id: userInfo?.username || "",
    Eva_Name: userInfo?.name || "",
    barcode: batchname || "",
    Dep_Name: selectedCouse || "",
    Eva_Mon_Year: userInfo?.eva_month_year || "",
    Camp_id: Camp_id || "",
    camp_offcer_id_examiner: camp_offcer_id_examiner || "",
    Examiner_type: Examiner_type || "",
  }), [finalSubCode, Dashboard_Data.sub_name, userInfo?.username, userInfo?.name, batchname, selectedCouse, userInfo?.eva_month_year, Camp_id, camp_offcer_id_examiner, Examiner_type]);

  useEffect(() => {
    const fetchValuationData = async () => {
      try {
        const responsefromBackend = await valuationdatFromBack({
          subcode: finalSubCode,
          valuation_type: String(valuationType),
          Eva_Id: userInfo?.username,
          barcode: batchname,
          Dep_Name: selectedCouse,
        })



        setValuationDataState(responsefromBackend?.data)

      } catch (err) {
        console.error("Error fetching examiner valuation data:", err);
      }
    };

    if (batchname) {
      fetchValuationData();
    }
  }, [batchname, finalSubCode])



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





  // image index state (start from 3). We'll limit to START..END (3..50 => 48 images)
  const START_IMG = 3;
  const END_IMG = Number(valuationBarcode?.data?.ImgCnt) || 0; // inclusive (fixed max per requirement)
  // array of image numbers loaded into a variable (can be replaced by backend later)
  const [imageIndices] = useState(() => Array.from({ length: END_IMG - START_IMG + 1 }, (_, i) => START_IMG + i));
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

  // Map internal image number to user-facing page number (start at 1 when imgNumber=START_IMG)
  const totalPages = Math.max(1, END_IMG >= START_IMG ? END_IMG - START_IMG + 1 : 0);
  const displayPage = Math.min(totalPages, Math.max(1, Number(imgNumber) - START_IMG + 1));

  const { data: valuationImageData, isLoading: isImageLoading, error: imageError } = useGetValuationImageDataQuery(
    {
      batchname: batchname,
      subcode: finalSubCode,
      Dep_Name: selectedCouse,
      Img_Number: String(imgNumber),
      Eva_Mon_Year: userInfo?.eva_month_year,
    },
    { skip: !batchname || imgNumber < START_IMG || imgNumber > END_IMG }
  );


  const dataimage = valuationImageData?.image;

  // Mark main image as viewed when loaded
  React.useEffect(() => {
    if (dataimage) {
      setViewedSet((prev) => {
        const next = new Set(prev);
        next.add(Number(imgNumber));
        return next;
      });
    }
  }, [dataimage, imgNumber]);

  // Additional hooks for modal multi-page view (skip unless modal open)
  const { data: image2Data } = useGetValuationImageDataQuery(
    {
      batchname: batchname,
      subcode: finalSubCode,
      Dep_Name: selectedCouse,
      Img_Number: String(imgNumber + 1),
      Eva_Mon_Year: userInfo?.eva_month_year,
    },
    { skip: !batchname || !modalOpen || pagesPerModal < 2 || imgNumber + 1 > END_IMG }
  );

  const { data: image3Data } = useGetValuationImageDataQuery(
    {
      batchname: batchname,
      subcode: finalSubCode,
      Dep_Name: selectedCouse,
      Img_Number: String(imgNumber + 2),
      Eva_Mon_Year: userInfo?.eva_month_year,
    },
    { skip: !batchname || !modalOpen || pagesPerModal < 3 || imgNumber + 2 > END_IMG }
  );

  const { data: image4Data } = useGetValuationImageDataQuery(
    {
      batchname: batchname,
      subcode: finalSubCode,
      Dep_Name: selectedCouse,
      Img_Number: String(imgNumber + 3),
      Eva_Mon_Year: userInfo?.eva_month_year,
    },
    { skip: !batchname || !modalOpen || pagesPerModal < 4 || imgNumber + 3 > END_IMG }
  );

  // When modal images load (and modal is open), mark them as viewed
  React.useEffect(() => {
    if (!modalOpen) return;
    setViewedSet((prev) => {
      const next = new Set(prev);
      if (valuationImageData?.image) next.add(Number(imgNumber));
      if (image2Data?.image) next.add(Number(imgNumber + 1));
      if (image3Data?.image) next.add(Number(imgNumber + 2));
      if (image4Data?.image) next.add(Number(imgNumber + 3));
      return next;
    });
  }, [modalOpen, valuationImageData?.image, image2Data?.image, image3Data?.image, image4Data?.image, imgNumber]);

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
  }, [data, valuationBarcode, error, error2]);

  // Keyboard navigation: ArrowUp -> next image, ArrowDown -> previous image
  React.useEffect(() => {
    const onKeyDown = (e) => {
      // ignore when typing in inputs
      const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setImgNumber((n) => Math.min(END_IMG, Number(n) + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setImgNumber((n) => Math.max(START_IMG, Number(n) - 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [START_IMG, END_IMG]);

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

      // Re-fetch the next barcode to get next paper
      await refetchBarcode();

    } catch (error) {
      console.error('Error loading next paper:', error);
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

  // Get the highest individual max mark from Valid_Section
  const maxQuestionMark = useMemo(() => {
    if (!data?.Valid_Section || data.Valid_Section.length === 0) return 'N/A';
    const maxMark = Math.max(...data.Valid_Section.map(section => parseFloat(section.max_mark) || 0));
    return maxMark;
  }, [data?.Valid_Section]);

  return (
    <>
      <ValuationTemplate
        leftComponent={<ValuationLeft imgNumber={imgNumber} setImgNumber={setImgNumber} openModal={() => setModalOpen(true)} onClickbutton={openFullscreenModal} setPagesPerModal={setPagesPerModal} pagesPerModal={pagesPerModal} minImg={imageIndices[0]} maxImg={imageIndices[imageIndices.length - 1]} subcode={finalSubCode} onRotateCurrentPage={handleRotateCurrentPage} onRotateAllPages={handleRotateAllFromCurrent} basicData={basicData} totalPages={totalPages} onLeftRemarksModalStateChange={handleLeftRemarksModalStateChange} />}
        rightComponent={<ValuationRight questionMain={data} barcodeData={valuationBarcode} viewedCount={viewedSet.size} totalCount={imageIndices.length} currentPage={displayPage} imgNumber={imgNumber} end_image={END_IMG} responseDataFromValuation={valuationData} onFinalizationComplete={handleFinalizationComplete} onMarksUpdate={handleMarksUpdate} onModalStateChange={handleModalStateChange} onRemarksModalStateChange={handleRemarksModalStateChange} basicData={basicData} />}
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
            onClick={() => setImgNumber((n) => Math.max(START_IMG, Number(n) - 1))}
            disabled={imgNumber <= START_IMG}
            style={{
              position: 'fixed',
              // left: 12,
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
              color: imgNumber <= 3 ? '#fe0000' : '#fe0000',
              cursor: imgNumber <= 3 ? 'not-allowed' : 'pointer',
              opacity: '50%',
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
              onClick={() => setImgNumber((n) => Math.min(END_IMG, Number(n) + 1))}
              style={{
                position: 'fixed',
                // right: 12,
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
                color: '#fe0000',
                cursor: 'pointer',
                fontSize: '1.4rem',
                lineHeight: 1,
                opacity: '50%',
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
            justifyContent: 'center'
          }}>
            {dataimage ? (
              <img
                src={`data:image/jpeg;base64,${dataimage}`}
                alt="valuation"
                style={{
                  maxWidth: getRotation(imgNumber) % 180 === 0 ? '100%' : 'none',
                  maxHeight: getRotation(imgNumber) % 180 === 0 ? '100%' : 'none',
                  width: getRotation(imgNumber) % 180 === 0 ? '100%' : 'auto',
                  height: getRotation(imgNumber) % 180 === 0 ? 'auto' : '100%',
                  transform: `rotate(${getRotation(imgNumber)}deg)`,
                  transition: 'transform 0.3s ease'
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
                      {dataimage && actualPagesToDisplay >= 1 && (
                        <div className="valuation-modal-image-wrap"
                          style={getPageStyle(0)} role="listitem">
                          <img src={`data:image/jpeg;base64,${dataimage}`} alt="p1" style={{ transform: `rotate(${getRotation(imgNumber)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 2 && image2Data?.image && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(1)} role="listitem">
                          <img src={`data:image/jpeg;base64,${image2Data.image}`} alt="p2" style={{ transform: `rotate(${getRotation(imgNumber + 1)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 3 && image3Data?.image && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(2)} role="listitem">
                          <img src={`data:image/jpeg;base64,${image3Data.image}`} alt="p3" style={{ transform: `rotate(${getRotation(imgNumber + 2)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 4 && image4Data?.image && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(3)} role="listitem">
                          <img src={`data:image/jpeg;base64,${image4Data.image}`} alt="p4" style={{ transform: `rotate(${getRotation(imgNumber + 3)}deg)`, transition: 'transform 0.3s ease', objectFit: 'contain', width: '100%', height: '100%' }} />
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

export default ValuationChief;
