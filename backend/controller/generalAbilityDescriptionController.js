const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');

exports.getAllGeneralAbilityDescriptions = catchAsync(async (req, res) => {
  const fieldnames = await db.generalAbilityDescription.findAll({
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