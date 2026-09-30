import React, { useState, useEffect, useMemo } from 'react'
import axiosInstance from '../../utils/axiosInstance'
import * as PDFJS from 'pdfjs-dist'
import pdfjsWorkerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?raw'
import './QuestionPaperShow.css'
import '../../style/design/val_left.css'

import { useSelector } from 'react-redux'
import { BASE_URL } from '../../constraint/constraint'
import { extractErrorMessage } from '../../utils/extractErrorMessage'
import { useGetSubjectDataQuery } from '../../redux-slice/SubjectMasterApiSlice'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { LuZoomIn, LuZoomOut } from "react-icons/lu";
import { GrPowerReset } from "react-icons/gr";


const QuestionPaperShow = ({ pdfType = 'question-paper', subcode, testcode, evaMonthYear }) => {

  const userInfo = useSelector((state) => state?.auth.userInfo)
const monthyearInfo = useSelector((state) => state.auth.monthyearInfo);
  const { data: subjectMasterResponse } = useGetSubjectDataQuery()


  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [workerReady, setWorkerReady] = useState(false)

  const activeRecords = useMemo(() => 
    Array.isArray(monthyearInfo) ? monthyearInfo.filter((m) => m.Month_Year_Status === 'Y') : [],
    [monthyearInfo]
  );
  const subjectMasterPeriod = useMemo(() => {
    const subjects = Array.isArray(subjectMasterResponse?.data) ? subjectMasterResponse.data : [];
    const subject = subjects.find((item) => item.Subcode === subcode && item.testcode === testcode)
      || subjects.find((item) => item.Subcode === subcode);
    return String(subject?.Eva_Mon_Year || '').trim();
  }, [subjectMasterResponse, subcode, testcode]);
  const resolvedEvaMonthYear = useMemo(() => {
    const fromUser = String(userInfo?.eva_month_year || '').trim();
    if (fromUser && !fromUser.includes('undefined')) {
      return fromUser;
    }

    const activeRecord = activeRecords[0];
    const month = String(activeRecord?.Eva_Month || '').trim();
    const year = String(activeRecord?.Eva_Year || '').trim();
    if (month && year) {
      return `${month}_${year}`;
    }

    return subjectMasterPeriod;
  }, [userInfo?.eva_month_year, activeRecords, subjectMasterPeriod]);


  // Setup PDF worker once on mount
  useEffect(() => {
    const workerUrl = URL.createObjectURL(new Blob([pdfjsWorkerSource], { type: 'text/javascript' }))
    PDFJS.GlobalWorkerOptions.workerSrc = workerUrl
    setWorkerReady(true)
    return () => URL.revokeObjectURL(workerUrl)
  }, [])

  // Fetch PDF from backend (only after worker is ready)
  useEffect(() => {
    let currentObjectUrl = null
    let isMounted = true

    const fetchPdf = async () => {
      if (!workerReady) return

      try {
        setLoading(true)
        setError(null)

        const subcodeValue = subcode || userInfo?.subcode?.split(',')[0]
        const eva_month_year = evaMonthYear || resolvedEvaMonthYear
        const uploadType = pdfType === 'question-paper' ? 'question_paper' : 'answer_key'

        if (!subcodeValue || !eva_month_year) {
          setError('Question paper period is not available from the current session')
          return
        }

        const response = await axiosInstance.post('/api/subject/question_paper', {
          Eva_Mon_Year: eva_month_year,
          subcode: subcodeValue,
          testcode,
          uploadType,
        }, {
          responseType: 'blob'
        })

        if (!isMounted) return

        if (!response.data || response.data.size === 0) {
          throw new Error('PDF file is empty')
        }

        currentObjectUrl = URL.createObjectURL(response.data)
        setPdfUrl(currentObjectUrl)

        // Convert blob to typed array for in-memory pdfjs loading (prevents blob URL worker fetch error)
        const arrayBuffer = await response.data.arrayBuffer()
        if (!isMounted) return

        const loadingTask = PDFJS.getDocument({ data: new Uint8Array(arrayBuffer) })
        const pdf = await loadingTask.promise
        if (!isMounted) return

        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        if (isMounted) {
          const message = await extractErrorMessage(err)
          console.warn('PDF Loading Note:', message)
          setError('Failed to load PDF: ' + message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPdf()

    return () => {
      isMounted = false
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [pdfType, workerReady, subcode, testcode, userInfo, resolvedEvaMonthYear, evaMonthYear])

  const _renderPage = async (pageNum) => {
    if (!pdfDoc) return

    const page = await pdfDoc.getPage(pageNum)
    const canvas = document.getElementById('pdf-canvas')
    
    if (!canvas) {
      console.warn('Canvas element not found')
      return
    }
    
    const context = canvas.getContext('2d')

    const scale = zoom / 100
    const viewport = page.getViewport({ scale })
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: context,
      viewport
    }).promise
  }

  // Re-render when page or zoom changes
  // Note: Commented out because we're using <object> tag instead of canvas
  // useEffect(() => {
  //   if (pdfDoc && currentPage) {
  //     renderPage(currentPage)
  //   }
  // }, [pdfDoc, currentPage, zoom])

  const _goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const _goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const _handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 300))
  }

  const _handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50))
  }

  const _handleZoomReset = () => {
    setZoom(100)
  }
//vasanth
   const [height] = useState(window.innerHeight);
    // vasanth
  return (
    <div className="pdf-viewer-container">
      {/* <div className="pdf-toolbar pdf_design_tool_1 d-flex justify-content-center">
        <div className="pdf-navigation ">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            title="Previous Page"
            className="pdf-btn val_design_left_1"
          >
            <FaArrowLeft /> Previous
          </button>

          <span className="pdf-page-info">
            Page {currentPage} of {totalPages}
          </span>

          {/* <input 
            type="number" 
            min="1" 
            max={totalPages} 
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value) || 1
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page)
              }
            }}
            className="pdf-page-input"
            title="Go to page"
          /> *

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            title="Next Page"
            className="pdf-btn val_design_left_1"
          >
            Next <FaArrowRight />
          </button>
        </div>

        {/* <div className="pdf-zoom">
          <button 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="pdf-btn"
          >
             <LuZoomOut className='val_design_left_icon_1' />
            // {/* − Zoom Out *
          </button>
          
          <span className="pdf-zoom-info">
            {zoom}%
          </span>
          
          <button 
            onClick={handleZoomIn}
            title="Zoom In (Magnify)"
            className="pdf-btn"
          >
           <LuZoomIn className='val_design_left_icon_1' />
            {/* + Zoom In *
          </button>
          
          <button 
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="pdf-btn pdf-btn-secondary val_design_left_2"
          >
         < GrPowerReset className='val_design_left_icon_2'  /> &nbsp;Reset
          </button>
        </div> *
      </div> */}

      <div className="pdf-display-area">
        {loading && (
          <div className="pdf-loading">
            <p>Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="pdf-error">
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !error && (
          // <div className="pdf-canvas-wrapper">
          //   <canvas id="pdf-canvas" className='val_design_pdf_left_1'></canvas>
          // </div>

          <object 
            className="pdf"
            data={pdfUrl}
            width="100%"
            style={{ height: `${height - 223}px` }}
            type="application/pdf"
          >
          </object>

        )}
      </div>
{/* 
      <div className="pdf-footer">
        <div className="pdf-zoom d-flex justify-content-center" >
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="pdf-btn"
          >
            <LuZoomOut className='val_design_left_icon_1' />
            {/* − Zoom Out *
          </button>

          <span className="pdf-zoom-info">
            {zoom}%
          </span>

          <button
            onClick={handleZoomIn}
            title="Zoom In (Magnify)"
            className="pdf-btn"
          >
            <LuZoomIn className='val_design_left_icon_1' />
            {/* + Zoom In *
          </button>

          <button
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="pdf-btn pdf-btn-secondary val_design_left_2"
          >
            < GrPowerReset className='val_design_left_icon_2' /> &nbsp;Reset
          </button>
        </div>
        {/* <p>📄 PDF Viewer - {totalPages > 0 ? `Total Pages: ${totalPages}` : 'No PDF loaded'}</p> *
      </div> */}
    </div>
  )
}

export default QuestionPaperShow
