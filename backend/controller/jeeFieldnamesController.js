const { Jee_Fieldnames } = require('../db/models');
const catchAsync = require('../utils/catchAsync');

// Get all field names for column mapping
exports.getAllFieldnames = catchAsync(async (req, res) => {
  const fieldnames = await Jee_Fieldnames.findAll({
    attributes: ['id', 'ex_code', 'og_desc'],
    order: [['id', 'ASC']]
  });

  // Convert to mapping object for easier frontend use
  const mappingObject = {};
  fieldnames.forEach(field => {
    if (field.ex_code && field.og_desc) {
      mappingObject[field.ex_code] = field.og_desc;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      fieldnames,
      mapping: mappingObject
    }
  });
});
