const Busboy = require('busboy');

// Middleware to parse form fields before multer processes files
const parseFormFields = (req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    const busboy = Busboy({ headers: req.headers });
    req.body = {};

    busboy.on('field', (fieldname, value) => {
      req.body[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      // Don't process files here, let multer handle them
      // Just consume the stream to allow busboy to continue
      file.resume();
    });

    busboy.on('finish', () => {
      next();
    });

    req.pipe(busboy);
  } else {
    next();
  }
};

module.exports = parseFormFields;
