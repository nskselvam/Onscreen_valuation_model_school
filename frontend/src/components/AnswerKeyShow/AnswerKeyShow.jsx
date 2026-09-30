import React, { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import axiosInstance from '../../utils/axiosInstance'
import * as PDFJS from 'pdfjs-dist'
import pdfjsWorkerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?raw'
import './AnswerKeyShow.css'
import '../../style/design/val_left.css'

import { useSelector } from 'react-redux'
import { BASE_URL } from '../../constraint/constraint'
import { extractErrorMessage } from '../../utils/extractErrorMessage'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { LuZoomIn, LuZoomOut } from "react-icons/lu";
import { GrPowerReset } from "react-icons/gr";



const AnswerKeyShow = ({ pdfType = 'answer-key', subcode, testcode, evaMonthYear }) => {

  const userInfo = useSelector((state) => state?.auth.userInfo)
const monthyearInfo = useSelector((state) => state.auth.monthyearInfo);


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
  const ExamMonth = useMemo(() => 
    [...new Set(activeRecords.map((m) => m.Eva_Month))].map((m) => ({ id: m, name: m })),
    [activeRecords]
  );
  const ExamYear = useMemo(() => 
    [...new Set(activeRecords.map((m) => m.Eva_Year))].map((y) => ({ id: y, name: y })),
    [activeRecords]
  );


  // Setup PDF worker once on mount
  useEffect(() => {
    const workerUrl = URL.createObjectURL(new Blob([pdfjsWorkerSource], { type: 'text/javascript' }))
    PDFJS.GlobalWorkerOptions.workerSrc = workerUrl
    setWorkerReady(true)
    return () => URL.revokeObjectURL(workerUrl)
  }, [])

  // Fetch PDF from backend (only after worker is ready)
  useEffect(() => {
    let currentUrl = null
    let isMounted = true

    const fetchPdf = async () => {
      if (!workerReady) return

      try {
        setLoading(true)
        setError(null)

        const subcodeValue = subcode || userInfo?.subcode?.split(',')[0]
        const derivedMonthYear = ExamMonth[0]?.name && ExamYear[0]?.name
          ? `${ExamMonth[0].name}_${ExamYear[0].name}`
          : ''
        const eva_month_year = evaMonthYear || derivedMonthYear
        const uploadType = pdfType === 'answer-key' ? 'answer_key' : 'question_paper'

        if (!subcodeValue || !eva_month_year) {
          setError('Answer key period is not available from the current session')
          return
        }

        const response = await axiosInstance.post('/api/subject/answer_key', {
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

        currentUrl = URL.createObjectURL(response.data)
        setPdfUrl(currentUrl)

        // Load PDF with in-memory typed array into pdfjs
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
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [pdfType, workerReady, subcode, testcode, userInfo, ExamMonth, ExamYear, evaMonthYear])

  const renderPage = async (pageNum) => {
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

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50))
  }

  const handleZoomReset = () => {
    setZoom(100)
  }

  const [height] = useState(window.innerHeight);

  return (
    <div className="pdf-viewer-container">
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

        {!loading && !error && pdfUrl && (
          <object 
            className="pdf"
            data={pdfUrl}
            width="100%"
            style={{ height: `${height - 223}px`, display: 'block', border: 'none' }}
            type="application/pdf"
          >
            <p>Unable to display PDF. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Click here to download</a></p>
          </object>
        )}
      </div>
    </div>
  )
}

export default AnswerKeyShow
