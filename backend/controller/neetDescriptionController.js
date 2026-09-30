const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');

// Get all NEET field descriptions for dynamic column mapping
exports.getAllNeetDescriptions = catchAsync(async (req, res) => {
  const fieldnames = await db.neetDescription.findAll({
    attributes: ['id', 'ex_code', 'og_desc'],
    order: [['id', 'ASC']],
    raw: true,
  });

  const mappingObject = {};
  fieldnames.forEach((field) => {
    if (field.ex_code && field.og_desc) {
      mappingObject[field.ex_code] = field.og_desc;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      fieldnames,
      mapping: mappingObject,
    },
  });
});
