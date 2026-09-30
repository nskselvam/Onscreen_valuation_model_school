import React, { useState, useEffect } from 'react'
import axios from 'axios'
import * as PDFJS from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './QuestionPaperShow.css'
import '../../style/design/val_left.css'

import { useSelector } from 'react-redux'
import { BASE_URL } from '../../constraint/constraint'
import { FaArrowLeft ,FaArrowRight } from "react-icons/fa6";
import { LuZoomIn,LuZoomOut  } from "react-icons/lu";
import { GrPowerReset } from "react-icons/gr";


const QuestionPaperShow = ({ pdfType = 'question-paper' ,subcode}) => {

  const userInfo = useSelector((state) => state?.auth.userInfo)


  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [workerReady, setWorkerReady] = useState(false)


  // Setup PDF worker once on mount
  useEffect(() => {
    // Set worker source using Vite's URL import
    // This ensures the worker is bundled correctly with proper MIME type
    PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker
    setWorkerReady(true)
  }, [])

  // Fetch PDF from backend (only after worker is ready)
  useEffect(() => {
    const fetchPdf = async () => {
      if (!workerReady) return
      
      try {
        setLoading(true)
        
        // Extract the first values from comma-separated strings
        const department = userInfo?.department?.split(',')[0] || '01'
        const subcodeValue = subcode || userInfo?.subcode?.split(',')[0]
        const eva_month_year = userInfo?.eva_month_year || 'Nov_2025'
        
        if (!subcodeValue) {
          throw new Error('Subcode is required')
        }
        
        const response = await axios.get(`${BASE_URL}/api/common/pdf/${pdfType}`, {
          params: {
            eva_month_year,
            department,
            subcode: subcodeValue
          },
          responseType: 'blob'
        })
        const url = URL.createObjectURL(response.data)
        setPdfUrl(url)
        
        // Load PDF with pdfjs
        const pdf = await PDFJS.getDocument(url).promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        setError('Failed to load PDF: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPdf()

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfType, workerReady, subcode, userInfo])

  const renderPage = async (pageNum) => {
    if (!pdfDoc) return

    const page = await pdfDoc.getPage(pageNum)
    const canvas = document.getElementById('pdf-canvas')
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
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, zoom])

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

    return (
    <div className="pdf-viewer-container">
      <div className="pdf-toolbar pdf_design_tool_1">
        <div className="pdf-navigation">
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
          
          <input 
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
          />
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            title="Next Page"
            className="pdf-btn val_design_left_1"
          >
            Next <FaArrowRight />
          </button>
        </div>

        <div className="pdf-zoom">
          <button 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="pdf-btn"
          >
             <LuZoomOut className='val_design_left_icon_1' />
            {/* − Zoom Out */}
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
            {/* + Zoom In */}
          </button>
          
          <button 
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="pdf-btn pdf-btn-secondary val_design_left_2"
          >
         < GrPowerReset className='val_design_left_icon_2'  /> &nbsp;Reset
          </button>
        </div>
      </div>

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
          <div className="pdf-canvas-wrapper">
            <canvas id="pdf-canvas"></canvas>
          </div>
        )}
      </div>

      <div className="pdf-footer">
        <p>📄 PDF Viewer - {totalPages > 0 ? `Total Pages: ${totalPages}` : 'No PDF loaded'}</p>
      </div>
    </div>
  )
}

export default QuestionPaperShow
