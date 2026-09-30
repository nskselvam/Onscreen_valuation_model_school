const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const faculties = db.faculties;
const sub_master = db.sub_master;
const { Sequelize, Op } = require("sequelize");


const facultyData = asyncHandler(async (req, res) => {
  const [facultiesData, subMasterData] = await Promise.all([
    faculties.findAll(),
    sub_master.findAll({ attributes: ['Subcode', 'SUBNAME'] }),
  ]);

  if (facultiesData) {
    res.status(200).json({ faculties: facultiesData, sub_master: subMasterData });
  } else {
    res.status(404).json({ message: "No faculties found" });
  }
});


const updateExaminer = asyncHandler(async (req, res) => {
  const { oldEvaId, newEvaId, updateOption, subcodes = [], role, transferData } = req.body;



  const userData = await db.faculties.findOne({ where: { Eva_Id: newEvaId } });

  if (!userData) {
    return res.status(404).json({ message: "New examiner not found" });
  }


  let Subcode = userData.subcode ? userData.subcode.split(',').map(s => s.trim()) : [];
  let Camp_id = userData.Camp_id ? userData.Camp_id.split(',').map(s => s.trim()) : [];
  let camp_offcer_id_examiner = userData.camp_offcer_id_examiner ? userData.camp_offcer_id_examiner.split(',').map(s => s.trim()) : [];
  let Dep_Name_2 = userData.Dep_Name_2 ? userData.Dep_Name_2.split(',').map(s => s.trim()) : [];
  let Sub_Max_Paper = userData.Sub_Max_Paper ? userData.Sub_Max_Paper.split(',').map(s => s.trim()) : [];
  let Eva_Subject = userData.Eva_Subject ? userData.Eva_Subject.split(',').map(s => s.trim()) : [];
  let Examiner_Valuation_Status = userData.Examiner_Valuation_Status ? userData.Examiner_Valuation_Status.split(',').map(s => s.trim()) : [];


  for (const transfer of transferData) {
    const { subcode, campId, department, maxCount, evaluationType, campOfficerId } = transfer;
    if (!(Subcode.includes(subcode) && Eva_Subject.includes(evaluationType))) {
      Subcode.push(subcode);
      Camp_id.push(campId);
      camp_offcer_id_examiner.push(campOfficerId);
      Dep_Name_2.push(department);
      Sub_Max_Paper.push(maxCount);
      Eva_Subject.push(evaluationType);
      Examiner_Valuation_Status.push('N');
    }
  }

  let subcnt = Subcode.length;
  let substatus = true;


  if (Subcode.length === subcnt && Camp_id.length === subcnt && camp_offcer_id_examiner.length === subcnt && Dep_Name_2.length === subcnt && Sub_Max_Paper.length === subcnt && Eva_Subject.length === subcnt && Examiner_Valuation_Status.length === subcnt) {
  } else {
    substatus = false
    // console.error('Array length mismatch:', {
    // //   Subcode: Subcode.length,
    // //   Camp_id: Camp_id.length,
    // //   camp_offcer_id_examiner: camp_offcer_id_examiner.length,
    // //   Dep_Name_2: Dep_Name_2.length,
    // //   Sub_Max_Paper: Sub_Max_Paper.length,
    // //   Eva_Subject: Eva_Subject.length,
    // //   Examiner_Valuation_Status: Examiner_Valuation_Status.length
    // });
  
     return res.status(500).json({ message: "Check Subcode found in Data" });
  }


  await db.faculties.update(
    {
      subcode: Subcode.join(','),
      Camp_id: Camp_id.join(','),
      camp_offcer_id_examiner: camp_offcer_id_examiner.join(','),
      Dep_Name_2: Dep_Name_2.join(','),
      Sub_Max_Paper: Sub_Max_Paper.join(','),
      Eva_Subject: Eva_Subject.join(','),
      Examiner_Valuation_Status: Examiner_Valuation_Status.join(','),
    },
    {
      where: { Eva_Id: newEvaId },
    }
  );
  // }else {


  // res.status(200).json({ message: "Examiner updated successfully" });


  for (const transfer of transferData) {
    const { subcode, campId, department, maxCount, evaluationType, campOfficerId, chiefExaminer } = transfer;

    if (chiefExaminer && chiefExaminer !== 'Not Assigned') {

      const Chieffaculty = await db.faculties.findOne({ where: { Eva_Id: chiefExaminer } });
      let chief_examiner = Chieffaculty.chief_examiner ? Chieffaculty.chief_examiner.split(',').map(s => s.trim()) : [];
      let chiefSubcode = Chieffaculty.Chief_subcode ? Chieffaculty.Chief_subcode.split(',').map(s => s.trim()) : [];
      let Chief_Eva_Subject = Chieffaculty.Chief_Eva_Subject ? Chieffaculty.Chief_Eva_Subject.split(',').map(s => s.trim()) : [];
      let camp_offcer_id_chief = Chieffaculty.camp_offcer_id_chief ? Chieffaculty.camp_offcer_id_chief.split(',').map(s => s.trim()) : [];
      let Camp_id_chief = Chieffaculty.Camp_id_chief ? Chieffaculty.Camp_id_chief.split(',').map(s => s.trim()) : [];
      let Chief_Valuation_Status = Chieffaculty.Chief_Valuation_Status ? Chieffaculty.Chief_Valuation_Status.split(',').map(s => s.trim()) : [];
      let Dep_Name_1 = Chieffaculty.Dep_Name_1 ? Chieffaculty.Dep_Name_1.split(',').map(s => s.trim()) : [];
      if (Chieffaculty) {
        if (!(chief_examiner.includes(chiefExaminer) == newEvaId && chiefSubcode.includes(subcode) == subcode && Chief_Eva_Subject.includes(evaluationType) == evaluationType)) {
          chief_examiner.push(newEvaId);
          chiefSubcode.push(subcode);
          Chief_Eva_Subject.push(evaluationType);
          camp_offcer_id_chief.push(campOfficerId);
          Camp_id_chief.push(campId);
          Chief_Valuation_Status.push('N');
          Dep_Name_1.push(department);

          await db.faculties.update(
            {
              chief_examiner: chief_examiner.join(','),
              Chief_subcode: chiefSubcode.join(','),
              Chief_Eva_Subject: Chief_Eva_Subject.join(','),
              camp_offcer_id_chief: camp_offcer_id_chief.join(','),
              Camp_id_chief: Camp_id_chief.join(','),
              Chief_Valuation_Status: Chief_Valuation_Status.join(','),
              Dep_Name_1: Dep_Name_1.join(','),
            },
            {
              where: { Eva_Id: chiefExaminer },
            }
          );
        }
      }
    }
  }

  res.status(200).json({ message: "Examiner updated successfully" });
});

const updateChiefExaminer = asyncHandler(async (req, res) => {


  const { oldEvaId, newEvaId, updateOption, subcodes = [], role, transferData } = req.body;

  console.log("Received data for chief examiner update:", { oldEvaId, newEvaId, updateOption, subcodes, role, transferData });
  //return



  const userData = await db.faculties.findOne({ where: { Eva_Id: newEvaId } });

  if (!userData) {
    return res.status(404).json({ message: "New chief examiner not found" });
  }


  let chief_examiner = userData.chief_examiner ? userData.chief_examiner.split(',').map(s => s.trim()) : [];
  let chiefSubcode = userData.Chief_subcode ? userData.Chief_subcode.split(',').map(s => s.trim()) : [];
  let Chief_Eva_Subject = userData.Chief_Eva_Subject ? userData.Chief_Eva_Subject.split(',').map(s => s.trim()) : [];
  let camp_offcer_id_chief = userData.camp_offcer_id_chief ? userData.camp_offcer_id_chief.split(',').map(s => s.trim()) : [];
  let Camp_id_chief = userData.Camp_id_chief ? userData.Camp_id_chief.split(',').map(s => s.trim()) : [];
  let Chief_Valuation_Status = userData.Chief_Valuation_Status ? userData.Chief_Valuation_Status.split(',').map(s => s.trim()) : [];
  let Dep_Name_1 = userData.Dep_Name_1 ? userData.Dep_Name_1.split(',').map(s => s.trim()) : [];

  for (const transfer of transferData) {
    const { subcode, campId, department, maxCount, evaluationType, campOfficerId ,examinerId} = transfer;
    if (!(chiefSubcode.includes(subcode) && Chief_Eva_Subject.includes(evaluationType) && chief_examiner.includes(examinerId))) {
      chief_examiner.push(examinerId);
      chiefSubcode.push(subcode);
      Chief_Eva_Subject.push(evaluationType);
      camp_offcer_id_chief.push(campOfficerId);
      Camp_id_chief.push(campId);
      Chief_Valuation_Status.push('N');
      Dep_Name_1.push(department);
    }
  }

  let subcnt = chiefSubcode.length;
  let substatus = true;

  if (chiefSubcode.length === subcnt && Camp_id_chief.length === subcnt && camp_offcer_id_chief.length === subcnt && Dep_Name_1.length === subcnt && Chief_Eva_Subject.length === subcnt && Chief_Valuation_Status.length === subcnt) {
  } else {
    substatus = false
    // console.error('Array length mismatch:', {
    //   chiefSubcode: chiefSubcode.length,
    //   Camp_id_chief: Camp_id_chief.length,
    //   camp_offcer_id_chief: camp_offcer_id_chief.length,
    //   Dep_Name_1: Dep_Name_1.length,
    //   Chief_Eva_Subject: Chief_Eva_Subject.length,
    //   Chief_Valuation_Status: Chief_Valuation_Status.length
    // });
    // return res.status(500).json({ message: "Check Subcode found in Data" });
  }

  await db.faculties.update(
    {
      chief_examiner: chief_examiner.join(','),
      Chief_subcode: chiefSubcode.join(','),
      Chief_Eva_Subject: Chief_Eva_Subject.join(','),
      camp_offcer_id_chief: camp_offcer_id_chief.join(','),
      Camp_id_chief: Camp_id_chief.join(','),
      Chief_Valuation_Status: Chief_Valuation_Status.join(','),
      Dep_Name_1: Dep_Name_1.join(','),
    },
    {
      where: { Eva_Id: newEvaId },
    }
  );




 res.status(200).json({ message: "Chief Examiner updated successfully" });


});

module.exports = {
  facultyData,
  updateExaminer,
  updateChiefExaminer
};