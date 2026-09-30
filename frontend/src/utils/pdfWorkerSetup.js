import * as PDFJS from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * Setup PDF.js worker with proper fallback mechanism
 * This ensures the worker loads correctly in both development and production
 */
export const setupPDFWorker = () => {
  // Use the worker from the npm package to ensure version consistency
  // This prevents version mismatch errors between API and Worker
  PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker
  
  return {
    workerSrc: pdfjsWorker
  }
}
