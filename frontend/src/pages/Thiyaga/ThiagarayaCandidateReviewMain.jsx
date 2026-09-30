import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ValuationTemplate from '../../components/ValuationTemplate/ValuationTemplate'
import ValuationLeft from '../../components/ValuationLeft/ValuationLeft'
import ValuationThiyagarayaReviewRight from '../../components/ValuationRight/ValuationThiyagarayaReviewRight'
import { useGetThiyagarayaReviewMainDataQuery } from '../../redux-slice/thiyagarayaReviewApiSlice'
import { useSelector } from 'react-redux'
import { BASE_URL } from '../../constraint/constraint'

const START_IMG = 3

const ThiagarayaCandidateReviewMain = () => {
  const location = useLocation()

  const [imgNumber, setImgNumber] = useState(START_IMG)
  const [isNavigating, setIsNavigating] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [isLeftRemarksModalOpen, setIsLeftRemarksModalOpen] = useState(false)
  const [pageRotations, setPageRotations] = useState({})

  const reviewRow = useMemo(() => {
    return location.state?.reviewData || JSON.parse(sessionStorage.getItem('thiyagarayaReviewData') || 'null')
  }, [location.state])

  const userInfo = useSelector((state) => state.auth?.userInfo)

  const { data: mainData, isLoading: isMainDataLoading, isError: isMainDataError } = useGetThiyagarayaReviewMainDataQuery(
    {
      Dummy_NO: reviewRow?.Dummy_NO || '',
      SubjectCode: reviewRow?.SubjectCode || '',
      RegisterNo: reviewRow?.RegisterNo || '',
      Eva_Mon_Year: reviewRow?.Eva_Mon_Year || '',
      Valuation_Type: reviewRow?.Valuation_Type || '',
      Dep_Name: userInfo?.Dep_Name_8 || '',
    },
    { skip: !reviewRow }
  )

  console.log("Fetched mainData:", mainData?.filters?.totalPage)

  const END_IMG = mainData?.filters?.totalPage ||  50


  const imageDepName = reviewRow?.Dep_Name || userInfo?.selected_course || userInfo?.Dep_Name_8 || ''

  const imageRequestParams = useMemo(() => ({
    batchname: reviewRow?.Dummy_NO || '',
    subcode: reviewRow?.SubjectCode || '',
    Dep_Name: imageDepName,
    Eva_Mon_Year: reviewRow?.Eva_Mon_Year || userInfo?.eva_month_year || '',
  }), [reviewRow?.Dummy_NO, reviewRow?.SubjectCode, imageDepName, reviewRow?.Eva_Mon_Year, userInfo?.eva_month_year])

  const buildImageUrl = useCallback((imgNum) => {
    if (
      !imageRequestParams.batchname ||
      !imageRequestParams.subcode ||
      !imageRequestParams.Dep_Name ||
      !imageRequestParams.Eva_Mon_Year ||
      imgNum < START_IMG ||
      imgNum > END_IMG
    ) return null

    const params = new URLSearchParams({
      batchname: imageRequestParams.batchname,
      subcode: imageRequestParams.subcode,
      Dep_Name: imageRequestParams.Dep_Name,
      Img_Number: String(imgNum),
      Eva_Mon_Year: imageRequestParams.Eva_Mon_Year,
    })

    return `${BASE_URL}/api/v1/valuation/valuation_images?${params.toString()}`
  }, [imageRequestParams, END_IMG])

  const imgUrl = buildImageUrl(imgNumber)


  console.log("Fetched mainData:", mainData)

  useEffect(() => {
    if (location.state?.reviewData) {
      sessionStorage.setItem('thiyagarayaReviewData', JSON.stringify(location.state.reviewData))
    }
  }, [location.state])

  const totalPages = END_IMG - START_IMG + 1
  const displayPage = Math.max(1, Number(imgNumber) - START_IMG + 1)

  const navigateImage = useCallback((direction) => {
    if (isNavigating) return

    const current = Number(imgNumber)
    const next = direction === 'prev'
      ? Math.max(START_IMG, current - 1)
      : Math.min(END_IMG, current + 1)

    if (next === current) return

    setIsNavigating(true)
    setImageLoadError(false)
    setImgNumber(next)
  }, [imgNumber, isNavigating, END_IMG])

  const handleImageLoad = () => {
    setIsNavigating(false)
    setImageLoadError(false)
  }

  const handleViewImage = (pageNumber) => {
    const normalized = Number(pageNumber)
    if (Number.isNaN(normalized)) return

    const target = Math.min(END_IMG, Math.max(START_IMG, normalized + 2))
    if (target === Number(imgNumber)) return

    setIsNavigating(true)
    setImageLoadError(false)
    setImgNumber(target)
  }

  const handleRotateCurrentPage = () => {
    setPageRotations((prev) => {
      const currentRotation = prev[imgNumber] || 0
      return { ...prev, [imgNumber]: (currentRotation + 90) % 360 }
    })
  }

  const handleRotateAllFromCurrent = () => {
    setPageRotations((prev) => {
      const updated = { ...prev }
      for (let i = imgNumber; i <= END_IMG; i += 1) {
        const currentRotation = prev[i] || 0
        updated[i] = (currentRotation + 90) % 360
      }
      return updated
    })
  }

  const getRotation = (pageNo) => pageRotations[pageNo] || 0

  const basicData = useMemo(() => ({
    sub_code: reviewRow?.SubjectCode || '',
    sub_name: 'Thiagaraya Sample Subject',
    Eva_Id: reviewRow?.Evaluator_Id || '',
    Eva_Name: reviewRow?.studentname || '',
    barcode: reviewRow?.Dummy_NO || '',
    Dep_Name: reviewRow?.Dep_Name || '',
    Eva_Mon_Year: reviewRow?.Eva_Mon_Year || '',
    Examiner_type: '8',
  }), [reviewRow])

  if (!reviewRow) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#fee', borderRadius: '8px', margin: '20px' }}>
        <h3 style={{ color: '#c33' }}>Error: Review Data Not Found</h3>
        <p>Please go back and click Review from the Thiagaraya review list.</p>
      </div>
    )
  }

  return (
    <ValuationTemplate
      leftComponent={
        <ValuationLeft
          imgNumber={imgNumber}
          setImgNumber={(value) => {
            const rawNext = Number(value)
            if (Number.isNaN(rawNext)) return

            const next = Math.min(END_IMG, Math.max(START_IMG, rawNext))
            if (next === Number(imgNumber)) return

            setIsNavigating(true)
            setImageLoadError(false)
            setImgNumber(next)
          }}
          openModal={() => {}}
          onClickbutton={() => {}}
          setPagesPerModal={() => {}}
          pagesPerModal={2}
          minImg={START_IMG}
          maxImg={END_IMG}
          subcode={reviewRow?.SubjectCode || ''}
          onRotateCurrentPage={handleRotateCurrentPage}
          onRotateAllPages={handleRotateAllFromCurrent}
          basicData={basicData}
          totalPages={totalPages}
          onLeftRemarksModalStateChange={setIsLeftRemarksModalOpen}
          chiefRemarksData={null}
          isChiefMode={false}
          isImageLoading={isNavigating}
        />
      }
      rightComponent={
        <ValuationThiyagarayaReviewRight
          reviewRow={reviewRow}
          mainData={mainData}
          isLoading={isMainDataLoading}
          isError={isMainDataError}
          onViewImage={handleViewImage}
        />
      }
    >
      <div style={{ width: '100%', minHeight: '100%', position: 'relative', paddingBottom: '20px' }}>
        {!isLeftRemarksModalOpen && (
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
              Page {displayPage} / {totalPages} - Thiagaraya Review Mode
            </div>
          </div>
        )}

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
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            color: (imgNumber <= START_IMG || isNavigating) ? '#666' : '#000',
            cursor: (imgNumber <= START_IMG || isNavigating) ? 'not-allowed' : 'pointer',
            opacity: (imgNumber <= START_IMG || isNavigating) ? 0.5 : 1,
            fontSize: '1.4rem',
            lineHeight: 1,
          }}
          aria-label="Previous image"
        >
          {'<'}
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: (imgNumber >= END_IMG || isNavigating) ? '#666' : '#000',
              cursor: (imgNumber >= END_IMG || isNavigating) ? 'not-allowed' : 'pointer',
              opacity: (imgNumber >= END_IMG || isNavigating) ? 0.5 : 1,
              fontSize: '1.4rem',
              lineHeight: 1,
            }}
            aria-label="Next image"
          >
            {'>'}
          </button>
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px 20px 20px',
            position: 'relative',
          }}
        >
          <img
            src={imgUrl || ''}
            alt="thiagaraya review"
            onLoad={handleImageLoad}
            onError={() => {
              setIsNavigating(false)
              setImageLoadError(true)
            }}
            style={{
              display: imgUrl && !imageLoadError ? 'block' : 'none',
              maxWidth: '100%',
              height: 'auto',
              transform: `rotate(${getRotation(imgNumber)}deg)`,
              transition: 'transform 0.3s ease',
            }}
          />

          {isNavigating && (
            <div style={{ color: '#1f2937', fontWeight: 600 }}>Loading image...</div>
          )}

          {!isNavigating && (imageLoadError || !imgUrl) && (
            <div style={{ color: '#7f1d1d', fontWeight: 600 }}>
              {imageLoadError ? 'Failed to load image for this page.' : 'No image available for this page.'}
            </div>
          )}
        </div>
      </div>
    </ValuationTemplate>
  )
}

export default ThiagarayaCandidateReviewMain
