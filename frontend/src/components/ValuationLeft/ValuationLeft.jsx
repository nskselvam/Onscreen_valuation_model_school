import React, { useState } from 'react'
import { Container, Row, Col, Button, Dropdown } from 'react-bootstrap'
import NavBarData from '../../hooks/navbar/navbar.json'
import navbarImage from '../../assets/SVN.png'
import srmImage from '../../assets/srm.jpg'
import thiaImage from '../../assets/thia.png'
import thia1Image from '../../assets/thia_1.jpeg'
import tcartsImage from '../../assets/tcarts.jpg'
import AnswerKeyShow from '../AnswerKeyShow/AnswerKeyShow'
import QuestionPaperShow from '../QuestionPaperShow/QuestionPaperShow'
import EvaluatedPreviewShow from '../EvaluatedShow/EvaluatedPreviewShow'
import ValuationRemarksModal from '../modals/ValuationRemarksModal'
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaRotate } from "react-icons/fa6";
import { TbLogout2 } from "react-icons/tb";
import useLogout from "../../hooks/useLogout"
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {useSubmitBarcodeValuationMutation} from '../../redux-slice/valuationLogoutApiSlice'
import {useSelector} from 'react-redux'
import '../../style/navbar/navbar.css'

const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;

const institutionImages = {
  '../../assets/srm.jpg': srmImage,
  '../../assets/thia.png': thiaImage,
  '../../assets/thia_1.jpeg': thia1Image,
  '../../assets/tcarts.jpg': tcartsImage
}

//const ValuationLeft = ({ imgNumber = 3, setImgNumber = () => {}, openModal = () => {}, setPagesPerModal = () => {}, onClickbutton, pagesPerModal = 2, minImg = 3, maxImg = 50, subcode, onRotateCurrentPage = () => {}, onRotateAllPages = () => {} }) => {
const ValuationLeft = ({ imgNumber = 3, setImgNumber = () => { }, openModal = () => { }, setPagesPerModal = () => { }, onClickbutton, pagesPerModal = 2, minImg = 3, maxImg = 50, subcode, testcode, onRotateCurrentPage = () => { }, onRotateAllPages = () => { }, basicData, totalPages, onLeftRemarksModalStateChange, chiefRemarksData, isChiefMode = false, isImageLoading = false }) => {
  const [activeTab, setActiveTab] = useState('question')
  const [rotatingCurrent, setRotatingCurrent] = useState(false)
  const [rotatingAll, setRotatingAll] = useState(false)
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const logout = useLogout()
  const navigate = useNavigate()
  const [submitBarcodeValuation] = useSubmitBarcodeValuationMutation()
  const location_path = window.location.pathname
  const userInfo = useSelector((state) => state.auth?.userInfo)

  const Institution_Details = NavBarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}
  
  const resolveImageSrc = (image) => {
    if (!image) return navbarImage
    if (institutionImages[image]) return institutionImages[image]
    if (/^(https?:)|^(data:)|^\//.test(image)) return image
    console.warn('Image not found in institutionImages:', image, 'Using fallback')
    return navbarImage
  }
  const institutionLogo = resolveImageSrc(Institution_Details.Image1 || Institution_Details.Image)
  // Notify parent when remarks modal state changes
  useEffect(() => {
    if (onLeftRemarksModalStateChange) {
      onLeftRemarksModalStateChange(showRemarksModal);
    }
  }, [showRemarksModal, onLeftRemarksModalStateChange]);

  const handleLogout = () => {
    if(location_path == "/valuation" || location_path == "/valuation/chief-valuation"){
    submitBarcodeValuation({basicData})
      .unwrap()
      .then(() => {
        logout()
        navigate('/login')
      })
      .catch((error) => {
        console.error('Error during barcode valuation submission:', error)
        // Optionally show an error message to the user here
      })
    } else {
      logout()
      navigate('/login')
    }
    // logout()
    // navigate('/login')
  }

  // Responsive button styling based on screen width
  const getButtonStyle = (isActive) => {
    const screenWidth = window.innerWidth
    let fontSize = '0.75rem'
    let padding = '0.15rem 0.3rem'

    if (screenWidth >= 1920) {
      fontSize = '0.9rem'
      padding = '0.4rem 0.8rem'
    } else if (screenWidth >= 1440) {
      fontSize = '0.85rem'
      padding = '0.3rem 0.6rem'
    } else if (screenWidth >= 1024) {
      fontSize = '0.8rem'
      padding = '0.25rem 0.5rem'
    }

    return {
      width: '100%',
      height: '100%',
      backgroundColor: isActive ? '#0056b3' : '#003cb3',
      fontSize,
      padding
    }
  }


  // Responsive styling for action buttons
  const getActionButtonStyle = () => {
    const screenWidth = window.innerWidth
    let fontSize = '0.75rem'
    let padding = '0.15rem 0.3rem'

    if (screenWidth >= 1920) {
      fontSize = '0.9rem'
      padding = '0.4rem 0.8rem'
    } else if (screenWidth >= 1440) {
      fontSize = '0.85rem'
      padding = '0.3rem 0.6rem'
    } else if (screenWidth >= 1024) {
      fontSize = '0.8rem'
      padding = '0.25rem 0.5rem'
    }

    return {
      flex: 1,
      fontSize,
      padding
    }
  }

  const handleRotateCurrent = () => {
    setRotatingCurrent(true)
    onRotateCurrentPage()
    setTimeout(() => setRotatingCurrent(false), 300)
  }

  const handleRotateAll = () => {
    setRotatingAll(true)
    onRotateAllPages()
    setTimeout(() => setRotatingAll(false), 300)
  }

  const renderChiefRemarks = () => (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%', background: '#f0f4ff' }}>
      {chiefRemarksData?.data ? (
        <div>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            borderRadius: '12px 12px 0 0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>📩</span>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
              CHIEF EXAMINER REMARK
            </span>
          </div>

          {/* Sender Info */}
          <div style={{
            background: '#fff',
            borderLeft: '4px solid #ffc107',
            borderRight: '1px solid #e0e0e0',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>From</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a' }}>
                {chiefRemarksData.data.evaluator_name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#555' }}>({chiefRemarksData.data.evaluator_id})</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Date</div>
              <div style={{ fontSize: '0.82rem', fontWeight: '500', color: '#333' }}>
                {new Date(chiefRemarksData.data.Insert_Date).toLocaleString()}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Dummy Number</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1a237e' }}>{chiefRemarksData.data.Barcode}</div>
            </div>
          </div>

          {/* Message Body */}
          <div style={{
            background: '#fffde7',
            border: '1px solid #ffe082',
            borderTop: 'none',
            borderRight: '1px solid #e0e0e0',
            borderRadius: '0 0 12px 12px',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Message</div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#b71c1c',
              background: '#fff8f8',
              border: '1px solid #ffcdd2',
              borderRadius: '8px',
              padding: '10px 14px',
              lineHeight: '1.6',
            }}>
              {chiefRemarksData.data.msg || 'No message provided'}
            </div>

            {chiefRemarksData.data.feedback && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Feedback</div>
                <div style={{
                  fontSize: '0.95rem',
                  color: '#1b5e20',
                  background: '#f1f8e9',
                  border: '1px solid #c8e6c9',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  lineHeight: '1.6',
                }}>
                  {chiefRemarksData.data.feedback}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60%',
          gap: '12px',
          color: '#9e9e9e',
        }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No remarks message available</p>
        </div>
      )}
    </div>
  )


  const renderContent = () => {
    switch (activeTab) {
      case 'question':
        return <QuestionPaperShow subcode={subcode} testcode={testcode} evaMonthYear={basicData?.Eva_Mon_Year} />
      case 'answer':
        return <AnswerKeyShow subcode={subcode} testcode={testcode} evaMonthYear={basicData?.Eva_Mon_Year} />
      case 'evaluated':
        return isChiefMode ? renderChiefRemarks() : <EvaluatedPreviewShow basicData={basicData} />
      default:
        return <QuestionPaperShow />
    }
  }

  return (
    <>
      <Container fluid style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        borderRadius: '0px',
        boxShadow: 'none',
        border: 'none',
        overflow: 'hidden'
      }}>
        {/* Header with Logo and Navigation Tabs - Single Row */}
        <div style={{
          padding: '0.8rem',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Logo */}
          <div style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#ffffff',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
            margin: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}>
            <img src={institutionLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Navigation Buttons - Takes remaining space */}
          <div className='valuation-tabs-wrapper' style={{ flex: 1, gap: 2 }}>
            <button
              className={`valuation-tab-btn question-tab ${activeTab === 'question' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('question')}
              aria-label="View Question Paper"
            >
              QB
            </button>

            <button
              className={`valuation-tab-btn answer-tab ${activeTab === 'answer' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('answer')}
              aria-label="View Answer Key"
            >
              KEY
            </button>

          { 
            userInfo?.selected_role != '8' &&  userInfo?.selected_role != '9' && (
             <button
              className={`valuation-tab-btn evaluated-tab ${activeTab === 'evaluated' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('evaluated')}
              aria-label={isChiefMode ? 'View Chief Remarks' : 'View Evaluated Papers'}
            >
              {isChiefMode ? 'Message' : 'Evaluated'}
            </button>)}

           {
            userInfo?.selected_role != '8' &&  userInfo?.selected_role != '9' && (
             <button
              className={`valuation-tab-btn remarks-tab ${activeTab === 'remarks' ? 'active' : 'inactive'}`}
              onClick={() => setShowRemarksModal(true)}
              aria-label="Add Remarks"
            >
              Remarks
            </button>)}
          </div>
        </div>



        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
          padding: '0'
        }}>
          {renderContent()}
        </div>
        <div style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              type="range"
              min={minImg}
              max={totalPages ? minImg + totalPages - 1 : maxImg}
              value={Math.max(minImg, Math.min(totalPages ? minImg + totalPages - 1 : maxImg, imgNumber))}
              onChange={(e) => setImgNumber(Math.max(minImg, Math.min(totalPages ? minImg + totalPages - 1 : maxImg, Number(e.target.value))))}
              disabled={isImageLoading}
              style={{ 
                flex: 1,
                cursor: isImageLoading ? 'not-allowed' : 'pointer',
                opacity: isImageLoading ? 0.5 : 1
              }}
            />
            <div style={{ minWidth: '3.5rem', textAlign: 'center', background: '#fff', borderRadius: 6, padding: '6px 8px', border: '1px solid #ddd' }}>
              {Math.max(minImg, Math.min(totalPages ? minImg + totalPages - 1 : maxImg, imgNumber)) - minImg + 1}
            </div>
          </div>

          {/* <div style={{ display: 'flex', gap: '0.5rem'  , marginBottom: '0.5rem'}}>
            <Button onClick={() => { setPagesPerModal(2); openModal(); }} style={{ flex: 1 }}>2</Button>
            <Button onClick={() => { setPagesPerModal(3); openModal(); }} style={{ flex: 1 }}>3</Button>
            <Button onClick={() => { setPagesPerModal(4); openModal(); }} style={{ flex: 1 }}>4</Button>
          </div> */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic" className="no-arrow">
     <LuFileSpreadsheet className='val_left_icon_1'/>  Answer Sheets
      </Dropdown.Toggle>
      <Dropdown.Menu>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(2); openModal(); }} style={{ flex: 1 }} className='text-dark'>2X</Dropdown.Item>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(3); openModal(); }} style={{ flex: 1 }} className='text-dark'>3X</Dropdown.Item>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(4); openModal(); }} style={{ flex: 1 }} className='text-dark'>4X</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown> */}
           { userInfo.selected_role != '8'  && userInfo.selected_role != '9' ? ( <Button size="sm" variant="success" style={getActionButtonStyle()} onClick={() => { setPagesPerModal(2); openModal(); onClickbutton(); }}>
              <LuFileSpreadsheet className='val_left_icon_1' />  Answer Sheets
            </Button>) : (
               <Button size="sm" variant="success" style={getActionButtonStyle()} onClick={() => { 
                if(userInfo.selected_role == '8'){
                  navigate('/examiner/thiyagaraja-review', { state: { basicData, subcode } })
                } else if(userInfo.selected_role == '9'){
                  navigate('/examiner/thiyagaraja-auditing', { state: { basicData, subcode } })
                }
               }}>
               BACK
            </Button>
            ) }
            <Button
              size="sm"
              variant="primary"
              style={getActionButtonStyle()}
              onClick={handleRotateCurrent}
            >
              <FaRotate
                className='val_left_icon_1'
                style={{
                  display: 'inline-block',
                  transform: rotatingCurrent ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              />
              Rotate Page
            </Button>
            <Button
              size="sm"
              variant="info"
              style={getActionButtonStyle()}
              onClick={handleRotateAll}
            >
              <FaRotate
                className='val_left_icon_1'
                style={{
                  display: 'inline-block',
                  transform: rotatingAll ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              />
              Rotate All
            </Button>
            <Button size="sm" variant="danger" style={getActionButtonStyle()} onClick={handleLogout}>
              <TbLogout2 className='val_left_icon_1' /> Logout
            </Button>
          </div>
        </div>
      </Container>

      <ValuationRemarksModal
        show={showRemarksModal}
        onHide={() => setShowRemarksModal(false)}
        basicData={basicData}
        Modal_Type="1"
      />
    </>
  )
}

export default ValuationLeft
