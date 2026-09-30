const asynchandler = require('express-async-handler')
const db = require('../db/models');

const getSubjectCode = asynchandler(async (req, res) => {
  const { userId } = req.params;

  console.log(`Fetching subject codes for userId: ${userId}`);

  const userSubcodes = await db.faculties.findAll({
    where: { Eva_Id: userId },
    attributes: ['subcode'],
  });

  const subcodes = [...new Set(
    userSubcodes
      .flatMap((row) => String(row.subcode || '')
        .split(',')
        .map((code) => code.trim())
      )
      .filter(Boolean)
  )]

  const subcodeData = await Promise.all(subcodes.map(async (code) => {
    const [subject, studentDataImport] = await Promise.all([
      db.sub_master.findOne({
        where: { Subcode: code },
        attributes: ['Subcode', 'SUBNAME', 'Eva_Mon_Year'],
      }),
      db.import1.findAll({
        where: { subcode: code },
        attributes: ['barcode','Evaluator_Id','tot_round','Dep_Name'],
      }),
    ])

    const import1Data = studentDataImport.map((row) => row.toJSON())
    const barcodeList = import1Data.map((row) => row.barcode).filter(Boolean)

    const reviewRows = barcodeList.length
      ? await db.candidateReviewremarks.findAll({
        where: {
          barcode: barcodeList,
          subcode: code,
          Examiner_type: '9',
        },
        attributes: ['barcode'],
      })
      : []

    const reviewedBarcodeSet = new Set(
      reviewRows
        .map((row) => String(row.barcode || '').trim())
        .filter(Boolean)
    )

    const import1DataWithRemarkFlag = import1Data.map((row) => {
      const barcode = String(row.barcode || '').trim()
      return {
        ...row,
        remarksAvailable: reviewedBarcodeSet.has(barcode) ? 'y' : 'n',
      }
    })

    console.log(
      `Fetched subcodeData for ${code}:`,
      subject ? subject.toJSON() : 'No data found',
      import1DataWithRemarkFlag.length > 0 ? import1DataWithRemarkFlag : 'No import1 data found'
    )

    if (!subject) {
      console.warn(`No subname found for subcode: ${code}`)
      return null
    }

    return {
      subcode: code,
      subname: subject.SUBNAME,
      subEva: subject.Eva_Mon_Year,
      import1Data: import1DataWithRemarkFlag,
    }
  }))

  return res.status(200).json(subcodeData.filter(Boolean));
});

module.exports = {
  getSubjectCode,
};