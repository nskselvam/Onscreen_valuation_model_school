const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const District_master = db.District_Master;
const Vacancy_master = db.Vacancy_Master;

const getDistrictMasterData = asyncHandler(async (req, res) => {
    const districtData = await District_master.findAll();
    res.json(districtData);
});

const getVacancyData = asyncHandler(async (req, res) => {
    const { dcode } = req.params;

    if(dcode != 'ALL') {
        const vacancyData = await Vacancy_master.findAll({
            where: { dCode: dcode },
            order: [['Vacancy_Type', 'ASC'], ['Zone_Code', 'ASC'], ['student_type', 'ASC'],['seq', 'ASC']]
        });
        res.json(vacancyData);
    } else {
        const vacancyData = await Vacancy_master.findAll({
            order: [['Vacancy_Type', 'ASC'], ['Zone_Code', 'ASC'], ['student_type', 'ASC'],['seq', 'ASC']]
        });
        res.json(vacancyData);
    }
    
});

module.exports = {
    getDistrictMasterData,
    getVacancyData
}
 
