import React, { useState,useEffect } from "react";
import { useSelector,useDispatch } from "react-redux";
import { useGetvaluation_chief_Barcode_DataQuery,useGetValuationDataQuery,useGetValuationImageDataQuery } from "../../redux-slice/valuationApiSlice.js";
import { setValuationData } from "../../redux-slice/valuationSlice.js";
import ValuationChiefRight from "../../components/ValuationRight/ValuationChiefRight.jsx";
import ValuationLeft from "../../components/ValuationLeft/ValuationLeft.jsx";
import ValuationTemplate from "../../components/ValuationTemplate/ValuationTemplate.jsx";
import {useNavigate} from 'react-router-dom';

const ValuationchiefMain = () => {
 const navigate=useNavigate();

   const userInfo = useSelector((state) => state.auth.userInfo);
  const chiefValuationData = useSelector(
    (state) => state.valuaton_Data_basic.chiefValuationBarcodeData
  );

  const dispatch = useDispatch();
  const START_IMG = 3;
  const END_IMG = 50;
  const [imageIndices] = useState(() => Array.from({ length: END_IMG - START_IMG + 1 }, (_, i) => START_IMG + i));
  const [imgNumber, setImgNumber] = useState(START_IMG);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagesPerModal, setPagesPerModal] = useState(2);
  const [viewedSet, setViewedSet] = useState(() => new Set());
  const [currentMarks, setCurrentMarks] = useState(0);
  const batchname = chiefValuationData?.barcode;
  const selectedCourse = chiefValuationData?.department || userInfo?.selected_course;
  

 


 
  const {
    data: valuation_chief_barcode,
    error,
    isLoading,
  } = useGetvaluation_chief_Barcode_DataQuery({
    subcode: chiefValuationData?.subcode,
    valuation_type: chiefValuationData?.Chief_Eva_subject_dashboard,
    Examiner_type: userInfo?.selected_role,
    Eva_Id: chiefValuationData?.Evaluator_Id,
    barcode: chiefValuationData?.barcode,
    Examiner_Id: chiefValuationData?.Examiner_Id,
    camp_id_chief: chiefValuationData?.camp_id_chief,
    camp_offcer_id_examiner: chiefValuationData?.camp_offcer_id_examiner,
  });


  const finalSubCode = chiefValuationData?.subcode;


   const { data, isLoading1, error2 } = useGetValuationDataQuery({
    subcode: finalSubCode,
  });


    useEffect(() => {
      if (data && valuation_chief_barcode) {
        dispatch(setValuationData(data));
      }
      if (error) {
  
        console.error("Error fetching valuation data:", error);
        navigate('/valuation/chief-valuation-review');
      }
      if (error2) {
  
        console.error("Error fetching valuation barcode:", error2);
                navigate('/valuation/chief-valuation-review');

      }
    }, [data, valuation_chief_barcode, error, error2]);

  const displayPage = Math.max(1, Number(imgNumber) - START_IMG + 1);

  const { data: valuationImageData, isLoading: isImageLoading, error: imageError } = useGetValuationImageDataQuery(
      {
        batchname: batchname,
        subcode: finalSubCode,
        Dep_Name: selectedCourse,
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
        Dep_Name: selectedCourse,
        Img_Number: String(imgNumber + 1),
        Eva_Mon_Year: userInfo?.eva_month_year,
      },
      { skip: !batchname || !modalOpen || pagesPerModal < 2 || imgNumber + 1 > END_IMG }
    );
  
    const { data: image3Data } = useGetValuationImageDataQuery(
      {
        batchname: batchname,
        subcode: finalSubCode,
        Dep_Name: selectedCourse,
        Img_Number: String(imgNumber + 2),
        Eva_Mon_Year: userInfo?.eva_month_year,
      },
      { skip: !batchname || !modalOpen || pagesPerModal < 3 || imgNumber + 2 > END_IMG }
    );
  
    const { data: image4Data } = useGetValuationImageDataQuery(
      {
        batchname: batchname,
        subcode: finalSubCode,
        Dep_Name: selectedCourse,
        Img_Number: String(imgNumber + 3),
        Eva_Mon_Year: userInfo?.eva_month_year,
      },
      { skip: !batchname || !modalOpen || pagesPerModal < 4 || imgNumber + 3 > END_IMG }
    );


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

      const handleFinalizationComplete = async () => {
        try {
          navigate('/valuation/chief-valuation-review');
          window.location.reload(); 
          // Clear Redux state (except userInfo)
          dispatch(markInpInfoRemove());
          dispatch(setExaminerValuationData(null));
    
          // Reset local state
          setValuationDataState(null);
          setImgNumber(START_IMG);
          setViewedSet(new Set());
          setModalOpen(false);
    
        } catch (error) {
          console.error('Error loading next paper:', error);
        }
      };

      // Handle marks update from ValuationChiefRight
      const handleMarksUpdate = (marks) => {
        setCurrentMarks(marks);
      };

  return (
    <>
      <ValuationTemplate
        leftComponent={<ValuationLeft imgNumber={imgNumber} setImgNumber={setImgNumber} openModal={() => setModalOpen(true)} setPagesPerModal={setPagesPerModal} pagesPerModal={pagesPerModal} minImg={imageIndices[0]} maxImg={imageIndices[imageIndices.length - 1]} subcode={finalSubCode} />}
        rightComponent={<ValuationChiefRight questionMain={data} barcodeData={valuation_chief_barcode} viewedCount={viewedSet.size} totalCount={imageIndices.length} currentPage={displayPage} imgNumber={imgNumber} end_image={END_IMG} responseDataFromValuation={null} onFinalizationComplete={handleFinalizationComplete} onMarksUpdate={handleMarksUpdate} />}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Page badge at top-center of viewport */}
          <div className="d-flex justify-content-center">
          <div   
            style={{
              position: 'fixed',
              padding: '0.6rem 0.8rem',
             background: 'rgba(255,255,255,0.95)',
               color: '#111',
                      borderRadius: 10,
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            fontWeight: 700,
            }}
            >
            Page {displayPage} / {END_IMG-2}
          </div>
          </div>
          <div className="d-flex justify-content-end">
            <div   
            style={{
              position: 'fixed',
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
          </div>
          {/* Left / Right glassmorphism buttons */}
          <button
            onClick={() => setImgNumber((n) => Math.max(START_IMG, Number(n) - 1))}
            disabled={imgNumber <= START_IMG}
            style={{
              position: 'fixed',
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
 <div className="d-flex justify-content-end">
          <button
            onClick={() => setImgNumber((n) => Math.min(END_IMG, Number(n) + 1))}
            style={{
              position: 'fixed',
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
          </div>

          {/* Image area: centered and fills available white space */}
          {dataimage ? (
            <img
              src={`data:image/jpeg;base64,${dataimage}`}
              alt="valuation"
              style={{ width: '100%',  }}
            />
          ) : null}

          {/* Modal for multi-page view */}
          {modalOpen ? (
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
          ) : null}
        </div>
      </ValuationTemplate>
    </>
  );
};

export default ValuationchiefMain;
