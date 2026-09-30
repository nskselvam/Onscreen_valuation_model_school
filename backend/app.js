const express = require('express');
const asyncHandler = require('express-async-handler');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const AppError = require('./utils/appError');
const globalErrorHandler = require("./middleware/errorController");
const authRouter = require('./router/authRouter');
const commonRouter = require('./router/commonRouter');
const navbarRouter = require('./router/NavbarRouter');
const dashboardRouter = require('./router/dashboardRouter');
const updataMasterDataRouter = require('./router/upDataMasterDataRouter');
const GeneralGetSqlOperationRouter = require('./router/GeneralGetSqlOperationRouter');
const adminOperationRouter = require('./router/adminOperationRouter');
const dataBackupRouter = require('./router/dataBackupRouter');
const adminSqlRouter = require('./router/adminSqlRouter');
const vacancyOperationRouter = require('./router/vacancyOperationRouter');
const masterDataOperationRouter = require('./router/masterDataOperationRouter');
const redisRouter = require('./router/redisRouter');
const testMasterRouter = require('./router/testMasterRouter');
const typeExamRouter = require('./router/typeExamRouter');
const districtMasterRouter = require('./router/districtMasterRouter');
const imageUploadRouter = require('./router/imageUploadRouter');
const ExcelUploadRouter = require('./router/ExcelUploadRouter');
const templateExcelRouter = require('./router/templateExcelRouter');
const excelTextRouter = require('./router/excelTextRouter');

// Valuation routes from Onscreen_Valuation
const IpRouter = require('./router/ipConfigRouter');
const thiyagarayaImportRouter = require('./router/thiyagarayaImportRouter');
const thiyagarayaReviewRouter = require('./router/thiyagarayaReviewRouter');
const thiyagarayaReviewImageRouter = require('./router/valuation_T_image_Fetch');
const examinationValuation = require('./router/valuationRouter');
const SubjectMasterRouter = require('./router/SubjectMasterRouter');
const pdfRouter = require('./router/pdfRouter');
const getCommonDataRouter = require('./router/getDataRouter');
const examinerRouter = require('./router/examinerRouter');
const AlterationOperationRouter = require('./router/AlterationOperationRouter');
const valuationstatusRouter = require('./router/valuationstatusRouter');
const monthYearMasterRouter = require('./router/monthYearMasterRouter');
const paperReviewRouter = require('./router/paperReviewRouter');
const valuationCancelRouter = require('./router/valuationCancelRouter');
const dataExportRouter = require('./router/dataExportRouter');
const valuationMoveRouter = require('./router/valuationMoveRouter');
const scanningRouter = require('./router/scanningRouter');
const McqOperationRouter = require('./router/McqOperationRouter');
const mcqPdfRouter = require('./router/mcqPdfRouter');
const dataAllowanceRouter = require('./router/dataAllowanceRouter');
const generalRouter = require('./router/generalRouter');
const studentResultReviewRouter = require('./router/studentResultReviewRouter');
const blcopoRouter = require('./router/blcopoRouter');
const auditingOperationRouter = require('./router/auditingOperationRouter');

require("dotenv").config({ path: `${process.cwd()}/.env`});
const sequelize = require('./config/database');
const DashboardOperationRouter = require('./router/DashboardOperationRouter');




//require("dotenv").config();
//const dotenv = require('dotenv');
const app = express();
const port = process.env.APP_PORT || 5000;

// Trust proxy - Important for getting real client IP when behind proxy/nginx
app.set('trust proxy', true);

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

const ALLOWED_ORIGINS = [
   //'https://osms.tnexams.net',
   //'https://examination.tnexams.net',
   'http://localhost:5173',
    // 'https://model.svnimaging.com'
   // 'http://localhost:5173',
    //'https://model.svnimaging.com'
    // 'https://dems.srmist.edu.in',
    //process.env.CLIENT_URL,               // https://osms.svnimging.com
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-current-route'],
    credentials: true,
    maxAge: 86400,                         // cache preflight for 24 h
}));

// Debug middleware to log response headers (especially Set-Cookie)
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        if (req.path.includes('/login') || req.path.includes('/auth')) {
            console.log(`📤 Response headers for ${req.method} ${req.path}:`, {
                'Set-Cookie': res.getHeader('Set-Cookie'),
                'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
                'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin')
            });
        }
        return originalSend.call(this, data);
    };
    next();
});

// Debug middleware to log incoming cookies
app.use((req, res, next) => {
    if (req.path.includes('/excelupload') || req.path.includes('/api/')) {
        console.log(`📥 Request ${req.method} ${req.path} - JWT Cookie:`, req.cookies.jwt ? '✅ Present' : '❌ Missing');
    }
    next();
});

// Serve static files from sample-files folder
app.use('/sample-files', express.static(path.join(__dirname, 'sample-files')));

// PDF Download Endpoints
app.get('/api/common/pdf/question-paper', asyncHandler(async (req, res) => {
    const { eva_month_year, department, subcode } = req.query;
    
    if (!subcode) {
        return res.status(400).json({ 
            error: 'Missing required parameters: subcode is required' 
        });
    }

    const dept = department || '01';
    const monYear = eva_month_year || 'Aug_2026';
    
    // Check multiple candidate locations
    const candidatePaths = [
        path.join(__dirname, 'uploads', monYear, 'qbs', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', monYear, 'qbs', dept, `${subcode}.pdf`),
        path.join(__dirname, 'uploads', 'Aug_2026', 'qbs', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', 'Aug_2026', 'qbs', dept, `${subcode}.pdf`),
        path.join(__dirname, 'uploads', 'Nov_2025', 'qbs', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', 'Nov_2025', 'qbs', dept, `${subcode}.pdf`),
        path.join(__dirname, 'sample-files', 'sample.pdf')
    ];

    let filePath = candidatePaths.find(p => fs.existsSync(p));
    if (!filePath) {
        filePath = path.join(__dirname, 'sample-files', 'sample.pdf');
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            error: 'PDF file not found'
        });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${subcode}.pdf"`);
    res.sendFile(filePath);
}));

app.get('/api/common/pdf/answer-key', asyncHandler(async (req, res) => {
    const { eva_month_year, department, subcode } = req.query;

    if (!subcode) {
        return res.status(400).json({ 
            error: 'Missing required parameters: subcode is required' 
        });
    }

    const dept = department || '01';
    const monYear = eva_month_year || 'Aug_2026';
    
    // Check multiple candidate locations
    const candidatePaths = [
        path.join(__dirname, 'uploads', monYear, 'key', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', monYear, 'key', dept, `${subcode}.pdf`),
        path.join(__dirname, 'uploads', 'Aug_2026', 'key', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', 'Aug_2026', 'key', dept, `${subcode}.pdf`),
        path.join(__dirname, 'uploads', 'Nov_2025', 'key', dept, `${subcode}.PDF`),
        path.join(__dirname, 'uploads', 'Nov_2025', 'key', dept, `${subcode}.pdf`),
        path.join(__dirname, 'sample-files', 'sample.pdf')
    ];

    let filePath = candidatePaths.find(p => fs.existsSync(p));
    if (!filePath) {
        filePath = path.join(__dirname, 'sample-files', 'sample.pdf');
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            error: 'PDF file not found'
        });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${subcode}.pdf"`);
    res.sendFile(filePath);
}));

app.get('/api/common/pdf/evaluated-marks', asyncHandler(async (req, res) => {
    const filePath = path.join(__dirname, 'sample-files', 'sample.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="evaluated-marks.pdf"');
    res.sendFile(filePath);
}));

//router.route('/login', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/navbar', navbarRouter)
app.use('/api/common', commonRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/updata_master_data', updataMasterDataRouter);
app.use('/api/general', GeneralGetSqlOperationRouter);
app.use('/api/redis', redisRouter);
app.use('/api/admin', adminOperationRouter);
app.use('/api/data-backup', dataBackupRouter);
app.use('/api/admin-sql', adminSqlRouter);
app.use('/api/vacancy', vacancyOperationRouter);
app.use('/api/master', masterDataOperationRouter);
app.use('/api/testmaster', testMasterRouter);
app.use('/api/typeexam', typeExamRouter);
app.use('/api/districtmaster', districtMasterRouter);
app.use('/api/imageupload', imageUploadRouter);
app.use('/api/excelupload', ExcelUploadRouter);
app.use('/api/dashboard-operation', DashboardOperationRouter);
app.use('/api/template-excel', templateExcelRouter);
app.use('/api/excel-text', excelTextRouter);

// Valuation API mounts
app.use('/api/ip-config', IpRouter);
app.use('/api/thiyagaraya-import', thiyagarayaImportRouter);
app.use('/api/thiyagaraya-review', thiyagarayaReviewRouter);
app.use('/api/thiyagaraya-review-image', thiyagarayaReviewImageRouter);
app.use('/api/v1/valuation', examinationValuation);
app.use('/api/v1/pdf', pdfRouter);
app.use('/api/student-review', studentResultReviewRouter);
app.use('/api/get_data', getCommonDataRouter);
app.use('/api/subject', SubjectMasterRouter);
app.use('/api/examiner', examinerRouter);
app.use('/api/alteration', AlterationOperationRouter);
app.use('/api/valuationstatus', valuationstatusRouter);
app.use('/api/month-year', monthYearMasterRouter);
app.use('/api/paper-review', paperReviewRouter);
app.use('/api/valuation-cancel', valuationCancelRouter);
app.use('/api/data-export', dataExportRouter);
app.use('/api/valuation-move', valuationMoveRouter);
app.use('/api/scanning', scanningRouter);
app.use('/api/mcq-operation', McqOperationRouter);
app.use('/api/mcq-pdf', mcqPdfRouter);
app.use('/api/data-allowance', dataAllowanceRouter);
app.use('/api/v1/blcopo', blcopoRouter);
app.use('/api/auditing-operation', auditingOperationRouter);


app.use(asyncHandler(async (req, res, next) => {
    throw new AppError(`Page Not Found ${req.originalUrl}`, 404);
}));

app.use(globalErrorHandler);
// app.get('/', (req, res) => {
//   res.send('Hello World New World');
// });

const server = app.listen(port, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server running on port ${port}`);
  console.log(`🌐 API base URL : http://localhost:${port}/api`);
  console.log(`🛡  Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄  Database     : ${process.env.DB_NAME || 'N/A'} @ ${process.env.DB_HOST || 'localhost'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Allow long-running requests (large Excel uploads / batch DB checks)
server.timeout          = 300000; // 5 minutes
server.keepAliveTimeout = 310000; // slightly above timeout