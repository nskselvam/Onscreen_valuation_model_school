const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const faculties = db.faculties;
const { Sequelize, Op } = require("sequelize");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const generatePasword = require("../utils/passwordGenerate");
const e = require("express");

const genDataUpdate = asyncHandler(async (req, res) => {


    const facultyData = await db.sequelize.query(
        `SELECT * FROM faculties_11`,
        {
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    for (const faculty of facultyData) {
        const facultyNewData = await faculties.findOne({
            where: { Eva_Id: faculty.Eva_Id },
        })

        // Skip if faculty not found
        if (!facultyNewData) {
            console.log(`Faculty not found for Eva_Id: ${faculty.Eva_Id}`);
            continue;
        }

        // Handle null, undefined, "Null", "N", or empty Eamil_Status
        let emailStatus = facultyNewData.Eamil_Status;

        // Skip if Eamil_Status is null, undefined, "Null", "N", or empty
        if (!emailStatus || emailStatus === null || emailStatus === "Null" || emailStatus.trim() === "") {
            console.log(`Skipping Eva_Id: ${faculty.Eva_Id} - Eamil_Status is: ${emailStatus}`);
            continue;
        }
        if (emailStatus === "N") {
            if (facultyNewData.Eamil_Status == faculty.Eamil_Status) {

                await facultyNewData.update({
                    Eamil_Status: 'Y',
                    sms_status: 'Sent'
                });

            }
            continue;
        }

        let email_status_new = facultyNewData.Eamil_Status.split(",").map(status => status.trim());
        let email_status_old = faculty.Eamil_Status ? faculty.Eamil_Status.split(",").map(status => status.trim()) : [];

        console.log(faculty.Eamil_Status, email_status_old, email_status_new);

        console.log(`Updating Eva_Id: ${faculty.Eva_Id} - Old Email Status: ${email_status_old.join(",")} - New Email Status: ${email_status_new.join(",")}`);



        for (let i = 0; i < email_status_old.length; i++) {



            email_status_new[i] = 'Y';


        }
        console.log(`Final Email Status for Eva_Id: ${faculty.Eva_Id} - ${email_status_new.join(",")}`);
        await facultyNewData.update({
            Eamil_Status: email_status_new.join(","),
            sms_status: 'Sent'
        });

        // return
    }

    console.log("Faculty Data:", facultyData);


    res.status(200).json({
        status: "success",
        message: "Data Updated Successfully",
    });

});

const facultsplitUpdate = asyncHandler(async (req, res) => {


    const facultyData = await db.faculties.findAll({
        where: {
            Role: {
                [Op.or]: [
                    { [Op.like]: '%2%' }
                ]
            }
        }
    });


    for (const faculty of facultyData) {

        let subcode = faculty.subcode
            ? faculty.subcode.split(",").map(code => code.trim())
            : [];
        let Eva_Subject = faculty.Eva_Subject
            ? faculty.Eva_Subject.split(",").map(subject => subject.trim())
            : [];
        let Sub_Max_Paper = faculty.Sub_Max_Paper
            ? faculty.Sub_Max_Paper.split(",").map(maxPaper => maxPaper.trim())
            : [];   

        let Camp_id = faculty.Camp_id
            ? faculty.Camp_id.split(",").map(camp => camp.trim())
            : [];

         let camp_offcer_id_examiner = faculty.camp_offcer_id_examiner
            ? faculty.camp_offcer_id_examiner.split(",").map(officer => officer.trim())
            : [];
        let Examiner_Valuation_Status = faculty.Examiner_Valuation_Status
            ? faculty.Examiner_Valuation_Status.split(",").map(status => status.trim())
            : [];
        let Dep_Name_2 = faculty.Dep_Name_2
            ? faculty.Dep_Name_2.split(",").map(dep => dep.trim())
            : [];

            // Filter out items where Camp_id is 'ET03' or 'ET04'
            const filteredData = [];
            for (let i = 0; i < subcode.length; i++) {
               // if (Camp_id[i] == 'ET03' || Camp_id[i] == 'ET04') {
                     if (Camp_id[i] != 'ET03' && Camp_id[i] != 'ET04') {
                    filteredData.push({
                        subcode: subcode[i],
                        Eva_Subject: Eva_Subject[i],
                        Sub_Max_Paper: Sub_Max_Paper[i],
                        Camp_id: Camp_id[i],
                        camp_offcer_id_examiner: camp_offcer_id_examiner[i],
                        Examiner_Valuation_Status: Examiner_Valuation_Status[i],
                        Dep_Name_2: Dep_Name_2[i]
                    });
                }
            }
            
            // Rebuild arrays from filtered data
            subcode = filteredData.map(item => item.subcode);
            Eva_Subject = filteredData.map(item => item.Eva_Subject);
            Sub_Max_Paper = filteredData.map(item => item.Sub_Max_Paper);
            Camp_id = filteredData.map(item => item.Camp_id);
            camp_offcer_id_examiner = filteredData.map(item => item.camp_offcer_id_examiner);
            Examiner_Valuation_Status = filteredData.map(item => item.Examiner_Valuation_Status);
            Dep_Name_2 = filteredData.map(item => item.Dep_Name_2);

                await faculty.update({
                    subcode: subcode.join(","),
                    Eva_Subject: Eva_Subject.join(","),
                    Sub_Max_Paper: Sub_Max_Paper.join(","),
                    Camp_id: Camp_id.join(","),
                    camp_offcer_id_examiner: camp_offcer_id_examiner.join(","),
                    Examiner_Valuation_Status: Examiner_Valuation_Status.join(","),
                    Dep_Name_2: Dep_Name_2.join(",")
                }); 
            
            console.log(`Eva_Id: ${faculty.Eva_Id} - Filtered Subcodes:`, subcode, `Camp IDs:`, Camp_id);
        }

    res.status(200).json({
        status: "success",
        message: "Data Updated Successfully",
    });



})

const chieffacultsplitUpdate = asyncHandler(async (req, res) => {


    const facultyData = await db.faculties.findAll({
        where: {
            Role: {
                [Op.or]: [
                    { [Op.like]: '%1%' }
                ]
            }
        }
    });


    for (const faculty of facultyData) {

        let subcode = faculty.Chief_subcode
            ? faculty.Chief_subcode.split(",").map(code => code.trim())
            : [];
        let Eva_Subject = faculty.Chief_Eva_Subject
            ? faculty.Chief_Eva_Subject.split(",").map(subject => subject.trim())
            : [];
        let chief_examiner = faculty.chief_examiner
            ? faculty.chief_examiner.split(",").map(examiner => examiner.trim())
            : [];   

        let Camp_id = faculty.Camp_id_chief
            ? faculty.Camp_id_chief.split(",").map(camp => camp.trim())
            : [];

         let camp_offcer_id_examiner = faculty.camp_offcer_id_chief
            ? faculty.camp_offcer_id_chief.split(",").map(officer => officer.trim())
            : [];
        let Examiner_Valuation_Status = faculty.Chief_Valuation_Status
            ? faculty.Chief_Valuation_Status.split(",").map(status => status.trim())
            : [];
        let Dep_Name_2 = faculty.Dep_Name_1
            ? faculty.Dep_Name_1.split(",").map(dep => dep.trim())
            : [];

            // Filter out items where Camp_id is 'ET03' or 'ET04'
            const filteredData = [];
            for (let i = 0; i < subcode.length; i++) {
                //if (Camp_id[i] == 'ET03' || Camp_id[i] == 'ET04') {
                   if (Camp_id[i] != 'ET03' && Camp_id[i] != 'ET04') {
                    filteredData.push({
                        subcode: subcode[i],
                        Eva_Subject: Eva_Subject[i],
                        chief_examiner: chief_examiner[i],
                        Camp_id: Camp_id[i],
                        camp_offcer_id_examiner: camp_offcer_id_examiner[i],
                        Examiner_Valuation_Status: Examiner_Valuation_Status[i],
                        Dep_Name_2: Dep_Name_2[i]
                    });
                }
            }
            
            // Rebuild arrays from filtered data
            subcode = filteredData.map(item => item.subcode);
            Eva_Subject = filteredData.map(item => item.Eva_Subject);
            chief_examiner = filteredData.map(item => item.chief_examiner);
            Camp_id = filteredData.map(item => item.Camp_id);
            camp_offcer_id_examiner = filteredData.map(item => item.camp_offcer_id_examiner);
            Examiner_Valuation_Status = filteredData.map(item => item.Examiner_Valuation_Status);
            Dep_Name_2 = filteredData.map(item => item.Dep_Name_2);

                await faculty.update({
                    Chief_subcode: subcode.join(","),
                    Chief_Eva_Subject: Eva_Subject.join(","),
                    chief_examiner: chief_examiner.join(","),
                    Camp_id_chief: Camp_id.join(","),
                    camp_offcer_id_chief: camp_offcer_id_examiner.join(","),
                    Chief_Valuation_Status: Examiner_Valuation_Status.join(","),
                    Dep_Name_1: Dep_Name_2.join(",")
                }); 
            
            console.log(`Eva_Id: ${faculty.Eva_Id} - Filtered Subcodes:`, subcode, `Camp IDs:`, Camp_id);
        }

    res.status(200).json({
        status: "success",
        message: "Data Updated Successfully",
    });



})

module.exports = {
    genDataUpdate,
    facultsplitUpdate,
    chieffacultsplitUpdate
};