import React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Container, Card, Row, Col, Badge } from 'react-bootstrap'
import ValuationTemplate from '../../../components/ValuationTemplate/ValuationTemplate'
import ValuationLeft from '../../../components/ValuationLeft/ValuationLeft'
import ValuationChiefReviewMainRight from '../../../components/ValuationRight/ValuationChiefReviewMainRight';
import { useGetTableDataWhereMutation } from '../../../redux-slice/generalApiSlice'
import { BASE_URL } from '../../../constraint/constraint'
import Modal from 'react-bootstrap/Modal';
import { useValuation_chief_remarks_getQuery, useGetvaluation_chief_Barcode_DataQuery } from '../../../redux-slice/valuationApiSlice'



const ChiefValuationReviewMain = () => {

  const location = useLocation();
  //State valuaton_Data_basic chiefValuationBarcodeData
  const reduxReviewData = useSelector((state) => state.valuaton_Data_basic?.chiefValuationBarcodeData);
  const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);
  const userInfo = useSelector((state) => state.auth?.userInfo);

  const Month_Year_Exam = useSelector((state) => state.auth?.monthyearInfo);

  const MonthYear = `${Month_Year_Exam[0]?.Eva_Month}_${Month_Year_Exam[0]?.Eva_Year}`;

  // Get paper data from location.state or Redux fallback
  const { paperData } = location.state || {};
  const finalPaperData = paperData || reduxReviewData;

  const [getTableDataWhere, { data: tableData, error: tableError }] = useGetTableDataWhereMutation();

  useEffect(() => {
    if (finalPaperData?.subcode) {
      getTableDataWhere({
        "tablename": "sub_master",
        "whereCondition": {
          "Subcode": finalPaperData?.subcode || "",
        },
        "tblfields": ["Subcode", "SUBNAME"]
      }).then(() => {
      }).catch(err => {
        console.error('Mutation error:', err);
      });
    }
  }, [finalPaperData?.subcode, getTableDataWhere]);
  if (tableError) {
    console.error('Table fetch error details:', {
      status: tableError.status,
      data: tableError.data,
      error: tableError.error,
      fullError: tableError
    });
  }

  



  const {
    data: valuation_chief_barcode,
  } = useGetvaluation_chief_Barcode_DataQuery(
    {
      subcode: finalPaperData?.subcode,
      valuation_type: finalPaperData?.Chief_Eva_subject_dashboard,
      Examiner_type: finalPaperData?.Chief_Valuation_Type,
      Eva_Id: finalPaperData?.Evaluator_Id,
      barcode: finalPaperData?.barcode,
      Examiner_Id: finalPaperData?.Examiner_Id,
      camp_id_chief: finalPaperData?.camp_id_chief,
      camp_offcer_id_examiner: finalPaperData?.camp_offcer_id_examiner,
      chief_valuation_Meth: "R"
    },
    { skip: !finalPaperData?.subcode || !finalPaperData?.barcode }
  );

  const { data: chiefRemarksData } = useValuation_chief_remarks_getQuery(
    { 
      //barcode, subcode,eva_id
      barcode: finalPaperData?.barcode,
      subcode: finalPaperData?.subcode,
      eva_id: userInfo?.username,
    },
    { skip: !finalPaperData?.barcode || !finalPaperData?.subcode || !userInfo?.username } 
  );




  

   const BasicDataFromValuation = {
    sub_code: finalPaperData?.subcode || "",
    sub_name: tableData?.data?.[0]?.SUBNAME || "",
    Eva_Id: finalPaperData?.Evaluator_Id || "",
    Eva_Name: finalPaperData?.Evaluator_Name || "",
    barcode: finalPaperData?.barcode || "",
    Dep_Name: Dashboard_Data?.department || finalPaperData?.Dep_Name || "",
    Eva_Mon_Year: MonthYear || "",
    Camp_id: finalPaperData?.camp_id_chief || "",
    camp_offcer_id_examiner: finalPaperData?.camp_offcer_id_examiner || "",
    Examiner_type: finalPaperData?.Chief_Valuation_Type || "",
    MonthYear: MonthYear || "",
    }






  const subname = tableData?.data?.[0]?.SUBNAME || "Unknown Subject";
  const reviewData = {
    locationPaperData: paperData,
    reduxReviewData: reduxReviewData,
    finalPaperData: finalPaperData,
    locationState: location.state,
    chiefBarcodeData: valuation_chief_barcode
  }

 
  // image index state (start from 3). We'll limit to START..END (3..50 => 48 images)
  const START_IMG = 3;
  const END_IMG = finalPaperData?.ImgCnt || 50; // inclusive (fixed max per requirement)


  const [imageIndices] = useState(() => Array.from({ length: END_IMG - START_IMG + 1 }, (_, i) => START_IMG + i));
  const [imgNumber, setImgNumber] = useState(START_IMG);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagesPerModal, setPagesPerModal] = useState(2);


  const [_viewedSet, setViewedSet] = useState(() => new Set());
  // Track remarks modal state from ValuationLeft
  const [isLeftRemarksModalOpen, setIsLeftRemarksModalOpen] = useState(false);
  // Track rotation for each page (0, 90, 180, 270 degrees)
  const [pageRotations, setPageRotations] = useState({});
  // Track image loading state
  const [isNavigating, setIsNavigating] = useState(false);


  const displayPage = Math.max(1, Number(imgNumber) - START_IMG + 1);
  const totalPages = Math.max(1, END_IMG >= START_IMG ? END_IMG - START_IMG + 1 : 0);


  const batchname = finalPaperData?.batchname || finalPaperData?.barcode
  const sub_code = finalPaperData?.subcode

  // Build direct image URL from params
  const buildImageUrl = useCallback((imgNum) => {
    if (!batchname || imgNum < START_IMG || imgNum > END_IMG) return null;
    const params = new URLSearchParams({
      batchname,
      subcode: sub_code,
      Dep_Name: Dashboard_Data?.department || finalPaperData?.Dep_Name || '01',
      Img_Number: String(imgNum),
      Eva_Mon_Year: MonthYear || 'May_2026',
    });
    return `${BASE_URL}/api/v1/valuation/valuation_images?${params.toString()}`;
  }, [batchname, sub_code, Dashboard_Data?.department, finalPaperData?.Dep_Name, MonthYear, START_IMG, END_IMG]);

  const imgUrl = buildImageUrl(imgNumber);
  const img2Url = modalOpen && pagesPerModal >= 2 && imgNumber + 1 <= END_IMG ? buildImageUrl(imgNumber + 1) : null;
  const img3Url = modalOpen && pagesPerModal >= 3 && imgNumber + 2 <= END_IMG ? buildImageUrl(imgNumber + 2) : null;
  const img4Url = modalOpen && pagesPerModal >= 4 && imgNumber + 3 <= END_IMG ? buildImageUrl(imgNumber + 3) : null;


  const basicData = useMemo(() => ({
    sub_code: finalPaperData?.subcode || "",
    sub_name: subname,
    Eva_Id: userInfo?.username,
    Eva_Name: userInfo?.name,
    barcode: finalPaperData?.barcode || "",
    Dep_Name: Dashboard_Data?.department || finalPaperData?.Dep_Name || "",
    Eva_Mon_Year: MonthYear || "May_2026",
    Camp_id: finalPaperData?.Camp_id || "",
    camp_offcer_id_examiner: finalPaperData?.camp_offcer_id_examiner || "",
    Examiner_type: userInfo?.selected_role || "",
  }), [finalPaperData?.subcode, subname, userInfo?.username, userInfo?.name, finalPaperData?.barcode, Dashboard_Data?.department, finalPaperData?.Dep_Name, MonthYear, finalPaperData?.Camp_id, finalPaperData?.camp_offcer_id_examiner, userInfo?.selected_role]);

  // Handle image load - also mark as viewed
  const handleImageLoad = () => {
    setIsNavigating(false);
    setViewedSet((prev) => {
      const next = new Set(prev);
      next.add(Number(imgNumber));
      return next;
    });
  };

  // Mark modal images as viewed on load
  const handleModalImageLoad = useCallback((imgNum) => {
    setViewedSet((prev) => {
      const next = new Set(prev);
      next.add(Number(imgNum));
      return next;
    });
  }, []);

  // Navigate to next/previous image with loading state
  const navigateImage = useCallback((direction) => {
    if (isNavigating) return;

    const current = Number(imgNumber);
    const upperBound = Math.max(START_IMG, Number(END_IMG));
    const next = direction === 'prev'
      ? Math.max(START_IMG, current - 1)
      : Math.min(upperBound, current + 1);

    // Prevent stuck navigation when already at bounds.
    if (next === current) return;

    setIsNavigating(true);
    setImgNumber(next);
  }, [isNavigating, imgNumber, START_IMG, END_IMG]);

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

  // Keyboard navigation: ArrowUp -> previous image, ArrowDown -> next image
  React.useEffect(() => {
    const onKeyDown = (e) => {
      // ignore when typing in inputs
      const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      
      // Don't navigate if image is still loading
      if (isNavigating) return;

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
  }, [isNavigating, navigateImage]);


  // Fullscreen modal handlers (same as ValuationMain)
  const [show, setShow] = useState(false);
  const openFullscreenModal = async () => {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    setShow(true);
  };

  const closeModal = async () => {
    setShow(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const [height] = useState(window.innerHeight);

  // Handle view image from review marks table
  const handleViewImage = (pageNumber) => {
    //alert(`Viewing page ${pageNumber}`); // --- IGNORE ---
    setIsNavigating(false);
    setImgNumber(Number(pageNumber) + 2);
  };

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

  // ⚠️ Show warning if paper data is missing
  if (!finalPaperData) {
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

  return (
    <>
      <ValuationTemplate
        leftComponent={<ValuationLeft imgNumber={imgNumber} setImgNumber={(value) => {
          if (isNavigating) return;

          const current = Number(imgNumber);
          const rawNext = Number(value);
          if (Number.isNaN(rawNext)) return;

          const upperBound = Math.max(START_IMG, Number(END_IMG));
          const next = Math.min(upperBound, Math.max(START_IMG, rawNext));

          // Prevent stuck navigation when target page does not change.
          if (next === current) return;

          setIsNavigating(true);
          setImgNumber(next);
        }} openModal={() => setModalOpen(true)} onClickbutton={openFullscreenModal} setPagesPerModal={setPagesPerModal} pagesPerModal={pagesPerModal} minImg={imageIndices[0]} maxImg={imageIndices[imageIndices.length - 1]} subcode={sub_code} onRotateCurrentPage={handleRotateCurrentPage} onRotateAllPages={handleRotateAllFromCurrent} basicData={basicData} totalPages={totalPages} onLeftRemarksModalStateChange={handleLeftRemarksModalStateChange} chiefRemarksData={finalPaperData?.Remarks || chiefRemarksData} isChiefMode={true} isImageLoading={isNavigating} />}

        rightComponent={<ValuationChiefReviewMainRight reviewValuationData={reviewData} onViewImage={handleViewImage} basicData={basicData} BasicDataFromValuation={BasicDataFromValuation}  />}
      >
        <div style={{ width: '100%', minHeight: '100%', position: 'relative', paddingBottom: '20px' }}>
          {/* Page badge at top-center of viewport */}
          {!show && !isLeftRemarksModalOpen && (
            <>
              <div className="d-flex justify-content-center">
                <div
                  style={{
                    position: 'fixed',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#111',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                    fontWeight: 700,
                  }}
                >
                  Page {displayPage} / {totalPages} - Review Mode
                </div>
              </div>
              {/* <div className="d-flex justify-content-end">
                <div
                  style={{
                    position: 'fixed',
                    top: 8,
                    right: 500,
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#111',
                    borderRadius: 10,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                    fontWeight: 700,
                  }}
                >
                  Marks : {currentMarks}
                </div>
              </div> */}
            </>
          )}
          {/* Left / Right glassmorphism buttons */}
          <button
            onClick={() => navigateImage('prev')}
            disabled={imgNumber <= START_IMG || isNavigating}
            style={{
              position: 'fixed',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              border: 'none',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              background: (imgNumber <= START_IMG || isNavigating) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: (imgNumber <= START_IMG || isNavigating) ? '#666' : '#000',
              cursor: (imgNumber <= START_IMG || isNavigating) ? 'not-allowed' : 'pointer',
              opacity: (imgNumber <= START_IMG || isNavigating) ? 0.5 : 1,
              fontSize: '1.4rem',
              lineHeight: 1
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <div className="d-flex justify-content-end">
            <button
              onClick={() => navigateImage('next')}
              disabled={imgNumber >= END_IMG || isNavigating}
              style={{
                position: 'fixed',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                border: 'none',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                background: (imgNumber >= END_IMG || isNavigating) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                color: (imgNumber >= END_IMG || isNavigating) ? '#666' : '#000',
                cursor: (imgNumber >= END_IMG || isNavigating) ? 'not-allowed' : 'pointer',
                opacity: (imgNumber >= END_IMG || isNavigating) ? 0.5 : 1,
                fontSize: '1.4rem',
                lineHeight: 1
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </div>

          {/* Image area: centered and fills available white space */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px 20px 20px',
            position: 'relative'
          }}>

            {imgUrl ? (
              <img
                src={imgUrl}
                alt="review paper"
                onLoad={handleImageLoad}
                onError={() => {
                  setIsNavigating(false);
                }}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  transform: `rotate(${getRotation(imgNumber)}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                color: '#6c757d'
              }}>
                No image available
              </div>
            )}
          </div>


          <Modal
            size="lg"
            show={show} fullscreen onHide={closeModal}
            aria-labelledby="example-modal-sizes-title-lg"
          >
            <Modal.Header closeButton>
              <Modal.Title id="example-modal-sizes-title-lg">
                Answer Sheet View - Review Mode
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
                    <div className="valuation-modal-images page_size_design_1" role="list">
                      {imgUrl && actualPagesToDisplay >= 1 && (
                        <div className="valuation-modal-image-wrap"
                          style={getPageStyle(0)} role="listitem">
                          <img src={imgUrl} alt="p1" onLoad={() => handleModalImageLoad(imgNumber)} style={{ transform: `rotate(${getRotation(imgNumber)}deg)`, transition: 'transform 0.3s ease' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 2 && img2Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(1)} role="listitem">
                          <img src={img2Url} alt="p2" onLoad={() => handleModalImageLoad(imgNumber + 1)} style={{ transform: `rotate(${getRotation(imgNumber + 1)}deg)`, transition: 'transform 0.3s ease' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 3 && img3Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(2)} role="listitem">
                          <img src={img3Url} alt="p3" onLoad={() => handleModalImageLoad(imgNumber + 2)} style={{ transform: `rotate(${getRotation(imgNumber + 2)}deg)`, transition: 'transform 0.3s ease' }} />
                        </div>
                      )}
                      {actualPagesToDisplay >= 4 && img4Url && (
                        <div className="valuation-modal-image-wrap" style={getPageStyle(3)} role="listitem">
                          <img src={img4Url} alt="p4" onLoad={() => handleModalImageLoad(imgNumber + 3)} style={{ transform: `rotate(${getRotation(imgNumber + 3)}deg)`, transition: 'transform 0.3s ease' }} />
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
  )
}

export default ChiefValuationReviewMain
