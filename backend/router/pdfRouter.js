const router = require('express').Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { pdfMarkGenearateCampDetails,pdfMarkGenearateDetails,pdfValuationGenearate,pdfValuationGenearateDetails } = require('../controller/pdfController');

router.post('/valuation-report', protect, pdfValuationGenearate);

router.get ('/printpdfdetails', protect, pdfValuationGenearateDetails);
router.get('/mark-details-overall', protect, pdfMarkGenearateDetails);
router.get('/mark-generate-camp-details', protect, pdfMarkGenearateCampDetails);

module.exports = router;

