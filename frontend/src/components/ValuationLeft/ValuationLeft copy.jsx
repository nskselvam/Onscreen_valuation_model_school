import React, { useState } from 'react'
import { Container, Row, Col,Button ,Dropdown } from 'react-bootstrap'
import NavBarData from '../../hooks/navbar/navbar.json'
import Imagesw from '../../assets/SVN.png'
import AnswerKeyShow from '../AnswerKeyShow/AnswerKeyShow'
import QuestionPaperShow from '../QuestionPaperShow/QuestionPaperShow'
import EvaluatedPreviewShow from '../EvaluatedShow/EvaluatedPreviewShow'
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaRotate } from "react-icons/fa6";
import { TbLogout2 } from "react-icons/tb";
const ValuationLeft = ({ imgNumber = 3, setImgNumber = () => {}, openModal = () => {}, setPagesPerModal = () => {}, pagesPerModal = 2, minImg = 3, maxImg = 50 ,subcode}) => {
  const [activeTab, setActiveTab] = useState('question')

  const renderContent = () => {
    switch(activeTab) {
      case 'question':
        return <QuestionPaperShow subcode={subcode} />
      case 'answer':
        return <AnswerKeyShow />
      case 'evaluated':
        return <EvaluatedPreviewShow />
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
        {/* Header with Logo and Name */}
        <Row style={{ 
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e9ecef',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Logo */}
          <Col xs="auto" style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#ffffffff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textAlign: 'center',
            flexShrink: 0,
            padding: 0
          }}>
            <img src={Imagesw} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%' }} />
          </Col>
          
          {/* Name/Title */}
          <Col style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            padding: 0
          }}>
            {/* Navigation Buttons */}
        <Row className='text-white' style={{ 
          gap: '0.5rem',
          margin: 0,
          padding: '0.5rem',
          display: 'flex',
          width: '100%'
        }}>
          <Col style={{ padding: '0', flex: 1 }}>
            <Button 
              onClick={() => setActiveTab('question')}
              style={{ width: '100%', height: '100%', backgroundColor: activeTab === 'question' ? '#0056b3' : '#003cb3' }}
            >
              Question Paper
            </Button>
          </Col>
          <Col style={{ padding: '0', flex: 1 }}>
            <Button 
              onClick={() => setActiveTab('answer')}
              style={{ width: '100%', height: '100%', backgroundColor: activeTab === 'answer' ? '#0056b3' : '#003cb3' }}
            >
              Answer Key
            </Button>
          </Col>
          <Col style={{ padding: '0', flex: 1 }}>
            <Button 
              onClick={() => setActiveTab('evaluated')}
              style={{ width: '100%', height: '100%', backgroundColor: activeTab === 'evaluated' ? '#0056b3' : '#003cb3' }}
            >
              Evaluated
            </Button>
          </Col>
        </Row>
          </Col>
        </Row>

      

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
              max={maxImg}
              value={Math.max(minImg, Math.min(maxImg, imgNumber))}
              onChange={(e) => setImgNumber(Math.max(minImg, Math.min(maxImg, Number(e.target.value))))}
              style={{ flex: 1 }}
            />
            <div style={{ minWidth: '3.5rem', textAlign: 'center', background: '#fff', borderRadius: 6, padding: '6px 8px', border: '1px solid #ddd' }}>
              {Math.max(minImg, Math.min(maxImg, imgNumber)) - minImg + 1}
            </div>
          </div>

          {/* <div style={{ display: 'flex', gap: '0.5rem'  , marginBottom: '0.5rem'}}>
            <Button onClick={() => { setPagesPerModal(2); openModal(); }} style={{ flex: 1 }}>2</Button>
            <Button onClick={() => { setPagesPerModal(3); openModal(); }} style={{ flex: 1 }}>3</Button>
            <Button onClick={() => { setPagesPerModal(4); openModal(); }} style={{ flex: 1 }}>4</Button>
          </div> */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic" className="no-arrow">
     <LuFileSpreadsheet className='val_left_icon_1'/>  Answer Sheets
      </Dropdown.Toggle>
      <Dropdown.Menu>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(2); openModal(); }} style={{ flex: 1 }} className='text-dark'>2X</Dropdown.Item>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(3); openModal(); }} style={{ flex: 1 }} className='text-dark'>3X</Dropdown.Item>
      <Dropdown.Item as="button" onClick={() => { setPagesPerModal(4); openModal(); }} style={{ flex: 1 }} className='text-dark'>4X</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
            <Button  style={{ flex: 1 }} ><FaRotate  className='val_left_icon_1' /> Rotate</Button>
            <Button  variant="danger" style={{ flex: 1 }}><TbLogout2   className='val_left_icon_1'/> Logout</Button>
          </div>
        </div>
      </Container>    
    </>
  )
}

export default ValuationLeft
