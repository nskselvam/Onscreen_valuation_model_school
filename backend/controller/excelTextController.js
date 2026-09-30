const express = require("express");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const db = require("../db/models");
const { Op } = require("sequelize");
const fs = require("fs");
const readline = require("readline");
const { get } = require("http");
const sub_master = db.sub_master;
const staff_master = db.staff_master;
const faculties = db.faculties;
const valid_question = db.valid_question;
const valid_sections = db.valid_sections;
const student_import = db.import1;
const studentResultData = db.student_result_data;

const { formatToIST, formatDateOnly, getCurrentISTDateTime, numberToWords } = require("../utils/formatDateTime");
const e = require("express");

// Function to read CSV file line by line
const readCSVLineByLine = async (filePath) => {
  const results = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      // Parse headers from first line
      headers = line.split(",").map((header) => header.trim());
      isFirstLine = false;
    } else {
      // Parse data rows
      const values = line.split(",").map((value) => value.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      results.push(row);
    }
  }

  return results;
};

// Function to read CSV from text data string
const parseCSVFromString = (csvString) => {
  const lines = csvString.split("\n");
  const results = [];
  let headers = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return; // Skip empty lines

    // Parse data rows
    //    const values = line.split(',').map(value => value.trim());
    //      const row = {};
    // headers.forEach((header, idx) => {
    //   row[header] = values[idx] || '';
    // });
    results.push(line);
    //      console.log('Processing row:', row);
  });

  return results;
};

const getDay3SharedSubcode = (testCode, shortSubcode) => {
  if (!String(testCode || '').endsWith('DV002')) return null;
  return {
    '01': 'PHYSICS_01',
    '02': 'CHEMISTRY_02',
    '03': 'MATHS_03',
    '04': 'BIOLOGY_04',
  }[String(shortSubcode || '')] || null;
};

const exgeneralMasterData = asyncHandler(async (req, res) => {
  const {
    excelData,
    textData,
    excelFileName,
    textFileName,
    uploadFileType,
    semMonth,
    semYear,
    degreeName
  } = req.body;

  let RecrodCnt = 0;
  let TotalRecordCnt = 0;


  let Error_responseData = [];
  let ErrorFlag = false;
  let data_existing;
  let keyChk;


  if (uploadFileType == "1") {
    let ErrorFlag = false;

    // Parse lines from textData
    const results = parseCSVFromString(textData);
    TotalRecordCnt = results.length;
    const subjects = await db.sub_master.findAll({
      attributes: ["Subcode", "Dep_Name", "Valcnt", "testcode"],
      raw: true,
    });
    const candidatesByTable = new Map();

    for (let index = 0; index < results.length; index++) {
      let item = results[index];
      if (!item || item.trim().length < 5) continue; // Skip invalid lines
      let buffer1 = item.replace(/,/g, "");
      let Data_Text = buffer1.split("|");
      
      // Data_Text format: ['', '234234_02', '', '234234_02_26C1200302', '', '28_08_2026_15_53', '', '1', '29', '']
      let barcodeField = Data_Text[1] || "";
      let detailField = Data_Text[3] || "";
      let subimplt = detailField ? detailField.split("_") : [];
      
      const compositeDummy = barcodeField.match(/^(.+)_([0-9]{2})$/);
      let batchname = compositeDummy?.[1] || barcodeField || subimplt[0] || "";
      let barcode = batchname;
      let dcode = req.body.districtCode ? String(req.body.districtCode).padStart(2, '0') : null;
      const encodedSubject = subimplt.length > 0 ? subimplt[subimplt.length - 1] : "";
      const shortSubcode = encodedSubject.slice(-2);
      const testCode = encodedSubject.slice(0, -2);
      let subcode = encodedSubject;
      let ImgCnt = Data_Text[8] || Data_Text[Data_Text.length - 2] || "";
      let Dep_Name = degreeName || (subimplt.length > 2 ? subimplt[1] : "");
      let ImpDate = Data_Text[5] || getCurrentISTDateTime();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dateParts = String(ImpDate).split("_");
      const importedMonth = monthNames[Number(dateParts[1]) - 1] || "";
      const importedYear = dateParts[2] || "";
      const evaMonYear = semMonth && semYear && semMonth !== "0" && semYear !== "0"
        ? `${semMonth}_${semYear}`
        : (importedMonth && importedYear ? `${importedMonth}_${importedYear}` : "Aug_2026");

      // Generate a random number between min and max (inclusive)
      function Rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      let R_No = Rand(1000000, 9000000);

      const formattedDepName = String(degreeName || "").padStart(2, "0");
      const depCandidates = [...new Set([degreeName, formattedDepName, Dep_Name]
        .filter((value) => value && value !== "0" && value !== "00"))];
      const matchesDepartment = (subject) => depCandidates.length === 0 ||
        depCandidates.includes(String(subject.Dep_Name || ""));
      let Import_Cnt = subjects.find((subject) =>
        subject.Subcode === subcode && matchesDepartment(subject)
      );

      if (!Import_Cnt) {
        Import_Cnt = subjects.find((subject) => subject.Subcode === subcode);
      }

      // Production TXT rows encode TESTCODE + two-character subcode:
      // 26C1200302 => testCode=26C12003, shortSubcode=02.
      // Resolve that suffix to the canonical subject code in sub_master.
      if (!Import_Cnt && shortSubcode) {
        const testCodeSubject = subjects.find((subject) =>
          String(subject.testcode || "").trim() === testCode &&
          matchesDepartment(subject) &&
          (
          String(subject.Subcode || "").endsWith(`_${shortSubcode}`) ||
          String(subject.Subcode || "") === shortSubcode
          )
        );

        if (testCodeSubject) {
          subcode = testCodeSubject.Subcode;
          Import_Cnt = testCodeSubject;
        }
      }

      if (!Import_Cnt && shortSubcode && !testCode) {
        const matchedSubject = subjects.find((subject) =>
          matchesDepartment(subject) &&
          (
          String(subject.Subcode || "").endsWith(`_${shortSubcode}`) ||
          String(subject.Subcode || "") === shortSubcode
          )
        );

        if (matchedSubject) {
          subcode = matchedSubject.Subcode;
          Import_Cnt = matchedSubject;
        }
      }

      if (!Import_Cnt) {
        ErrorFlag = true;
        Error_responseData.push({
          Barcode: batchname,
          subcode: subcode,
          Error_Message: `Subcode Not Found in Subject Master - ${subcode}`,
        });
        continue;
      }

      const resolvedTestCode = String(testCode || Import_Cnt.testcode || "").trim();
      if (!batchname || !subcode || !resolvedTestCode) {
        ErrorFlag = true;
        Error_responseData.push({
          Barcode: batchname,
          subcode,
          testcode: resolvedTestCode,
          Error_Message: "Batch name, subject code, and test code are required",
        });
        continue;
      }

      const valCount = parseInt(Import_Cnt.Valcnt, 10) || 1;

      for (let iii = 1; iii <= valCount; iii++) {
        const tableName = `import${iii}`;
        if (!candidatesByTable.has(tableName)) candidatesByTable.set(tableName, []);
        candidatesByTable.get(tableName).push({
          key: tableName === "import1"
            ? `${batchname}\u0000${subcode}\u0000${resolvedTestCode}`
            : `${batchname}\u0000${subcode}`,
          error: {
            Barcode: batchname,
            subcode: subcode,
            ...(tableName === "import1" ? { testcode: resolvedTestCode } : {}),
            import_type: iii,
            Error_Message: tableName === "import1"
              ? "Batch name, subject code, and test code already exist in the database"
              : "Barcode already exists in the database",
          },
          row: {
            batchname: batchname,
            subcode: subcode,
            ...(tableName === "import1" ? { testcode: resolvedTestCode } : {}),
            Dep_Name: Dep_Name,
            barcode: barcode,
            dcode: dcode,
            ImgCnt: ImgCnt,
            Implot: String(iii),
            R_No: R_No,
            Eva_Mon_Year: evaMonYear,
            Checked: "NO",
            Chief_Checked: "NO",
            E_flg: "I",
            Chief_E_flg: "N",
            ImpDate: getCurrentISTDateTime(),
          },
        });
      }
    }

    for (const [tableName, candidates] of candidatesByTable) {
      const batchnames = [...new Set(candidates.map((candidate) => candidate.row.batchname))];
      const existingRows = batchnames.length > 0
        ? await db[tableName].findAll({
          where: { batchname: { [Op.in]: batchnames } },
          attributes: tableName === "import1"
            ? ["batchname", "subcode", "testcode"]
            : ["batchname", "subcode"],
          raw: true,
        })
        : [];
      const existingKeys = new Set(existingRows.map((row) => tableName === "import1"
        ? `${row.batchname}\u0000${row.subcode}\u0000${String(row.testcode || "").trim()}`
        : `${row.batchname}\u0000${row.subcode}`
      ));
      const rowsToInsert = [];

      for (const candidate of candidates) {
        if (existingKeys.has(candidate.key)) {
          ErrorFlag = true;
          Error_responseData.push(candidate.error);
          continue;
        }
        existingKeys.add(candidate.key);
        rowsToInsert.push(candidate.row);
      }

      for (let offset = 0; offset < rowsToInsert.length; offset += 1000) {
        const chunk = rowsToInsert.slice(offset, offset + 1000);
        await db[tableName].bulkCreate(chunk, { validate: true });
        RecrodCnt += chunk.length;
      }
    }

    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else if (uploadFileType == "2") {
    let ErrorFlag = false;

    // Use a for loop directly instead of Promise.all for sequential processing
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      let item = excelData[index];

      let keyChk;
      if (item.Role == "1") {
        keyChk = String(item.chief_examiner || "").replace(/[\r\n\t\s]/g, "");
      } else if (item.Role == "2") {
        keyChk = String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "");
      } else {
        keyChk = String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "");
      }
      data_existing = await faculties.findOne({
        where: {
          Eva_Id: keyChk,
        },
      });

      let Dep_Name_Field = `Dep_Name_${item.Role}`;
      let User_Roll_Admin = `User_Roll_Admin_${item.Role}`;
      let Role_Admin_Data = await db.roll_master.findOne({ where: { rollName: item.Role } });
      if (!data_existing) {
        RecrodCnt = RecrodCnt + 1;
        const staff_response = await staff_master.findOne({
          where: {
            Eva_Id: keyChk,
          },
        });

        let Candidate_Name = staff_response
          ? staff_response.FACULTY_NAME
          : null;
        let Candidate_email = staff_response ? staff_response.Email_Id : null;
        let Candidate_mobile = staff_response
          ? staff_response.Mobile_Number
          : null;

        const generatePasword = Math.random()
          .toString(36)
          .slice(-8)
          .toString()
          .toUpperCase();



        await faculties.create({
          Eva_Id: keyChk,
          // Dep_Name: String(item.Dep_Code || "").padStart(2, "0"),
          [Dep_Name_Field]: String(item.Dep_Code || "").padStart(2, "0"),
          Role: item.Role == "1" ? item.Role + ",7" : item.Role,
          FACULTY_NAME: item.Role == "1" ? item.Chief_Name || Candidate_Name : item.FACULTY_NAME || Candidate_Name,
          Password: await bcrypt.hash(generatePasword, bcrypt.genSaltSync(10)),
          Temp_Password: generatePasword,
          ResetPass: 0,
          subcode: item.Role == 2 ? String(item.subcode || "").replace(/[\r\n\t\s]/g, "") : null,
          Eva_Subject:
            item.Role == 2
              ? String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
              : null,
          Chief_subcode: item.Role == 1 ? String(item.subcode || "").replace(/[\r\n\t\s]/g, "") : null,
          chief_examiner:
            item.Role == 1
              ? String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "")
              : null,
          Chief_Eva_Subject:
            item.Role == 1
              ? String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
              : null,
          Max_Paper: item.Max_Paper,
          Dep_Name_7: item.Role == "1" ? String(item.Dep_Code || "").padStart(2, "0") : null,
          Sub_Max_Paper: item.Role == 2 ? (item.Sub_Max_Paper || 0) : null,
          Email_Id: Candidate_email || item.Email_Id,
          Mobile_Number: Candidate_mobile || item.Mobile_Number,
          servername: req.get("host"),
          Camp_id: item.Role == 2 ? item.Camp_id : null,
          camp_offcer_id_examiner: item.Role == 2 ? item.camp_offcer_id : null,
          Camp_id_chief: item.Role == 1 ? item.Camp_id : null,
          camp_offcer_id_chief: item.Role == 1 ? item.camp_offcer_id : null,
          Eva_Mon_Year: `${semMonth}_${semYear}`,
          Examiner_Valuation_Status: item.Role == 2 ? "N" : null,
          Chief_Valuation_Status: item.Role == 1 ? "N" : null,
          Camp_id_Camp: item.Role == 4 ? item.Camp_id : null,
          sms_status: "N",
          [User_Roll_Admin]: Role_Admin_Data ? (Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null) : null,
          Eamil_Status: item.Role == 2 ? "N" : null,

        });
        RecrodCnt = RecrodCnt + 1;
      } else {
        let Dep_Code;
        let isDuplicate = false;
        let RollChek;
        let RollUpdate;
        let Camp_id_Camp;
        let Camp_id_Camp_Check;
        if (item.Role == "1") {
          //Dep_Code = data_existing.Dep_Name
          Dep_Code = data_existing[Dep_Name_Field]
            ? data_existing[Dep_Name_Field].split(",").map((code) => code.trim())
            : [];
          let chief_subcode = data_existing.Chief_subcode
            ? data_existing.Chief_subcode.split(",").map((code) => code.trim())
            : [];
          let Chief_Eva_Subject = data_existing.Chief_Eva_Subject
            ? data_existing.Chief_Eva_Subject.split(",").map((code) =>
              code.trim()
            )
            : [];
          let chief_examiner = data_existing.chief_examiner
            ? data_existing.chief_examiner.split(",").map((code) => code.trim())
            : [];
          let Camp_id_chief = data_existing.Camp_id_chief
            ? data_existing.Camp_id_chief.split(",").map((code) => code.trim())
            : [];
          let camp_offcer_id_chief = data_existing.camp_offcer_id_chief
            ? data_existing.camp_offcer_id_chief
              .split(",")
              .map((code) => code.trim())
            : [];
          let Chief_Valuation_Status = data_existing.Chief_Valuation_Status
            ? data_existing.Chief_Valuation_Status
              .split(",")
              .map((code) => code.trim())
            : [];
          RollChek = data_existing.Role
            ? data_existing.Role.split(",").map((code) => code.trim())
            : [];
          RollUpdate = RollChek.find((role) => role == item.Role);
          if (!RollUpdate) {
            RollChek.push(item.Role);
          }
          for (let i = 0; i < chief_examiner.length; i++) {


            if (
              chief_examiner[i] ==
              String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "") &&
              chief_subcode[i] == item.subcode &&
              Chief_Eva_Subject[i] ==
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            ) {
              isDuplicate = true;
              break; // Skip to next iteration if all match
            }
          }
          // Append new Dep_Code, chief_subcode, and Chief_Eva_Subject
          if (!isDuplicate) {
            Dep_Code.push(String(item.Dep_Code || "").padStart(2, "0"));
            chief_subcode.push(item.subcode);
            Chief_Eva_Subject.push(
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            );
            chief_examiner.push(
              String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "")
            );
            Camp_id_chief.push(item.Camp_id);
            camp_offcer_id_chief.push(item.camp_offcer_id);
            Chief_Valuation_Status.push("N");

            RecrodCnt = RecrodCnt + 1;
            await data_existing.update({
              [Dep_Name_Field]: Dep_Code.join(","),
              Dep_Name_7: Dep_Code.join(","),
              Chief_subcode: chief_subcode.join(","),
              Chief_Eva_Subject: Chief_Eva_Subject.join(","),
              chief_examiner: chief_examiner.join(","),
              Camp_id_chief: Camp_id_chief.join(","),
              camp_offcer_id_chief: camp_offcer_id_chief.join(","),
              Role: RollChek.join(","),
              Chief_Valuation_Status: Chief_Valuation_Status.join(","),
              [User_Roll_Admin]: data_existing[User_Roll_Admin] || (Role_Admin_Data && Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null),
            });
          }
        } else if (item.Role == "2") {
          // Similar logic for Role 2 (examiner)

          Dep_Code = data_existing[Dep_Name_Field]
            ? data_existing[Dep_Name_Field].split(",").map((code) => code.trim())
            : [];
          let subcode = data_existing.subcode
            ? data_existing.subcode.split(",").map((code) => code.trim())
            : [];
          let Eva_Subject = data_existing.Eva_Subject
            ? data_existing.Eva_Subject.split(",").map((code) => code.trim())
            : [];
          let Camp_id = data_existing.Camp_id
            ? data_existing.Camp_id.split(",").map((code) => code.trim())
            : [];
          let camp_offcer_id_examiner = data_existing.camp_offcer_id_examiner
            ? data_existing.camp_offcer_id_examiner.split(",").map((code) => code.trim())
            : [];

          let Sub_Max_Paper = data_existing.Sub_Max_Paper
            ? data_existing.Sub_Max_Paper.split(",").map((code) => code.trim())
            : [];

          let Examiner_Valuation_Status = data_existing.Examiner_Valuation_Status
            ? data_existing.Examiner_Valuation_Status
              .split(",")
              .map((code) => code.trim())
            : [];

          let Eamil_Status = data_existing.Eamil_Status
            ? data_existing.Eamil_Status.split(",").map((code) => code.trim())
            : [];

          RollChek = data_existing.Role
            ? data_existing.Role.split(",").map((code) => code.trim())
            : [];
          RollUpdate = RollChek.find((role) => role == item.Role);
          if (!RollUpdate) {
            RollChek.push(item.Role);
          }



          for (let i = 0; i < subcode.length; i++) {
            if (
              subcode[i] == item.subcode &&
              Eva_Subject[i] ==
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            ) {
              isDuplicate = true;
              break; // Skip to next iteration if all match
              //continue
            }
          }

          // Append new Dep_Code, subcode, and Eva_Subject
          if (!isDuplicate) {
            Dep_Code.push(String(item.Dep_Code || "").padStart(2, "0"));
            subcode.push(item.subcode);
            Eva_Subject.push(
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            );
            Camp_id.push(item.Camp_id);
            // console.log("camp_offcer_id_examiner", camp_offcer_id_examiner, item.camp_offcer_id);

            camp_offcer_id_examiner.push(item.camp_offcer_id);
            Sub_Max_Paper.push(item.Sub_Max_Paper || "0");
            Examiner_Valuation_Status.push("N");
            Eamil_Status.push("N");
            RecrodCnt = RecrodCnt + 1;
            await data_existing.update({
              [Dep_Name_Field]: Dep_Code.join(","),
              subcode: subcode.join(","),
              Eva_Subject: Eva_Subject.join(","),
              Camp_id: Camp_id.join(","),
              camp_offcer_id_examiner: camp_offcer_id_examiner.join(","),
              Eamil_Status: Eamil_Status.join(","),
              Role: RollChek.join(","),
              Sub_Max_Paper: Sub_Max_Paper.join(","),
              Examiner_Valuation_Status: Examiner_Valuation_Status.join(","),
              [User_Roll_Admin]: data_existing[User_Roll_Admin] || (Role_Admin_Data && Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null),
            });
          }
        } else if (item.Role == "4") {
          Dep_Code = data_existing[Dep_Name_Field]
            ? data_existing[Dep_Name_Field].split(",").map((code) => code.trim())
            : [];
          Camp_id_Camp = data_existing.Camp_id_Camp
            ? data_existing.Camp_id_Camp.split(",").map((code) => code.trim())
            : [];
          Camp_id_Camp_Check = Camp_id_Camp.find((camp) => camp == item.Camp_id);
          if (!Camp_id_Camp_Check) {
            Camp_id_Camp.push(item.Camp_id);
          }
          RollChek = data_existing.Role
            ? data_existing.Role.split(",").map((code) => code.trim())
            : [];
          RollUpdate = RollChek.find((role) => role == item.Role);
          if (!RollUpdate) {
            RollChek.push(item.Role);
          }
          Dep_Code.push(String(item.Dep_Code || "").padStart(2, "0"));
          await data_existing.update({
            [Dep_Name_Field]: Dep_Code.join(","),
            Camp_id_Camp: Camp_id_Camp.join(","),
            Role: RollChek.join(",")
          });

        } else {
          Dep_Code = data_existing[Dep_Name_Field]
            ? data_existing[Dep_Name_Field].split(",").map((code) => code.trim())
            : [];
          RollChek = data_existing.Role
            ? data_existing.Role.split(",").map((code) => code.trim())
            : [];
          RollUpdate = RollChek.find((role) => role == item.Role);
          if (!RollUpdate) {
            RollChek.push(item.Role);
          }
          RecrodCnt = RecrodCnt + 1;
          await data_existing.update({
            Role: RollChek.join(","),
            [Dep_Name_Field]: Dep_Code.join(","),
            [User_Roll_Admin]: data_existing[User_Roll_Admin] || (Role_Admin_Data && Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null),
          });
        }
        // console.log("Duplicate Eva_Id found:", item.Eva_Id);
        // Error_responseData.push({
        //   Eva_Id: item.Eva_Id,
        //   Dep_Name: item.Dep_Code,
        //   Error_Message: "Eva_Id already exists in the database",
        //   ErrorFlag: true,
        // });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });


  } else if (uploadFileType == "3") {
    let ErrorFlag = false;
    const degreeName = req.body.degreeName;
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {

      if (degreeName && String(excelData[index].Dep_Code || "").padStart(2, "0") !== String(degreeName).padStart(2, "0")) {
        ErrorFlag = true;
        Error_responseData.push({
          Subcode: excelData[index].Subcode,
          SUBNAME: excelData[index].Subname,
          Error_Message: `Department code does not match the specified degree name ${degreeName}`,
        });
        continue; // Skip records that don't match the specified degreeName
      }

      let item = excelData[index];
      let keyChk = String(item.Subcode || "").replace(/[\r\n\t\s]/g, "");
      const testCode = String(item.testcode || item.Testcode || item.TestCode || "").trim();
      if (!keyChk || !testCode) {
        ErrorFlag = true;
        Error_responseData.push({
          Subcode: item.Subcode,
          testcode: testCode,
          Error_Message: "Subcode and testcode are required",
        });
        continue;
      }

      data_existing = await sub_master.findOne({
        where: { Subcode: keyChk, testcode: testCode },
      });
      if (!data_existing) {
        RecrodCnt = RecrodCnt + 1;
        await sub_master.create({
          Subcode: keyChk,
          SUBNAME: item.Subname,
          Rate_Per_Script: item.Rate_Per_Script,
          Min_Amount: item.Min_Amount,
          Valcnt: item.Valcnt,
          testcode: testCode,
          Degree_Status: item.Degree_Status,
          Type_of_Exam: item.Type_of_Exam,
          Dep_Name: String(item.Dep_Code).padStart(2, "0"),
          Eva_Mon_Year: `${semMonth}_${semYear}`,
        });
      } else {
        ErrorFlag = true;
        Error_responseData.push({
          Subcode: item.Subcode,
          testcode: testCode,
          SUBNAME: item.Subname,
          Error_Message: "Subcode and testcode already exist in the database",
        });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });




  } else if (uploadFileType == "4") {
    let ErrorFlag = false;
    const degreeName = req.body.degreeName;
    const subjectTestCodes = new Map();
    (await sub_master.findAll({
      attributes: ["Subcode", "testcode"],
      raw: true,
    })).forEach(({ Subcode, testcode }) => {
      if (!subjectTestCodes.has(Subcode)) subjectTestCodes.set(Subcode, new Set());
      if (testcode) subjectTestCodes.get(Subcode).add(String(testcode).trim());
    });
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      const subCode = String(excelData[index].sub_code || "").replace(/[\r\n\t\s]/g, "");
      const subject = subCode
        ? await sub_master.findOne({ where: { Subcode: subCode }, attributes: ["Dep_Name"] })
        : null;
      const departmentCode = excelData[index].Dep_Code || excelData[index].Dep_Name || degreeName || subject?.Dep_Name;
      const normalizedDepartmentCode = String(departmentCode || "").padStart(2, "0");

      if (!departmentCode || normalizedDepartmentCode === "00") {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: departmentCode,
          sub_code: excelData[index].sub_code,
          Error_Message: "Department code is required and could not be derived from the subject master",
        });
        continue;
      }

      if (degreeName && String(degreeName) !== "0" && normalizedDepartmentCode !== String(degreeName).padStart(2, "0")) {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: excelData[index].Dep_Code,
          sub_code: excelData[index].sub_code,
          qstn_num: excelData[index].qstn_num,
          max_mark: excelData[index].max_mark,
          section: excelData[index].section,
          sub_section: excelData[index].sub_section,
          add_sub_section: excelData[index].add_sub_section,
          Error_Message: `Department code does not match the specified degree name ${degreeName}`,
        });
        continue; // Skip records that don't match the specified degreeName
      }
      let item = excelData[index];
      let keyChk = normalizedDepartmentCode;
      let sub_code = subCode;
      const availableTestCodes = subjectTestCodes.get(sub_code) || new Set();
      const suppliedTestcode = String(item.testcode || item.Testcode || item.TestCode || "").trim();
      const testcode = suppliedTestcode || (availableTestCodes.size === 1 ? [...availableTestCodes][0] : "");
      if (!testcode || (availableTestCodes.size > 0 && !availableTestCodes.has(testcode))) {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: keyChk,
          sub_code,
          testcode,
          Error_Message: availableTestCodes.size > 1 && !testcode
            ? `Test code is required to distinguish ${sub_code} variants`
            : `Test code ${testcode || ""} is not configured for ${sub_code}`,
        });
        continue;
      }
      let qstn_num = String(item.qstn_num || "").replace(/[\r\n\t\s]/g, "");
      let max_mark = String(item.max_mark || "").replace(/[\r\n\t\s]/g, "");
      let section = String(item.section || "").replace(/[\r\n\t\s]/g, "");
      let sub_section = String(item.sub_section || "").replace(
        /[\r\n\t\s]/g,
        ""
      );
      let add_sub_section = String(item.add_sub_section || "").replace(
        /[\r\n\t\s]/g,
        ""
      );
      let wherecondition = {};
      wherecondition.Dep_Name = keyChk;
      wherecondition.sub_code = sub_code;
      wherecondition.testcode = testcode;
      wherecondition.qstn_num = qstn_num;
      wherecondition.max_mark = max_mark;
      wherecondition.section = section;
      if (sub_section) wherecondition.sub_section = sub_section;
      if (add_sub_section) wherecondition.add_sub_section = add_sub_section;
      data_existing = await valid_sections.findOne({
        where: wherecondition,
      });

      if (!data_existing) {
        RecrodCnt = RecrodCnt + 1;
        await valid_sections.create({
          Dep_Name: keyChk,
          sub_code: sub_code,
          testcode,
          qstn_num: qstn_num,
          max_mark: max_mark,
          section: section,
          sub_section: sub_section,
          add_sub_section: add_sub_section,
          Eva_Mon_Year: `${semMonth}_${semYear}`,
          BL_Point: item.BL_Point,
          CO_Point: item.CO_Point,
          PO_Point: item.PO_Point,
        });
      } else {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: item.Dep_Code,
          sub_code: item.sub_code,
          qstn_num: item.qstn_num,
          max_mark: item.max_mark,
          section: item.section,
          sub_section: item.sub_section,
          add_sub_section: item.add_sub_section,
          Error_Message: "valid_section already exists in the database",
        });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else if (uploadFileType == "5") {
    let ErrorFlag = false;
    const degreeName = req.body.degreeName;
    const subjectTestCodes = new Map();
    (await sub_master.findAll({
      attributes: ["Subcode", "testcode"],
      raw: true,
    })).forEach(({ Subcode, testcode }) => {
      if (!subjectTestCodes.has(Subcode)) subjectTestCodes.set(Subcode, new Set());
      if (testcode) subjectTestCodes.get(Subcode).add(String(testcode).trim());
    });
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      if (degreeName && String(excelData[index].Dep_Code || "").padStart(2, "0") !== String(degreeName).padStart(2, "0")) {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: excelData[index].Dep_Code,
          SUBCODE: excelData[index].SUBCODE,
          SECTION: excelData[index].SECTION,
          FROM_QST: excelData[index].FROM_QST,
          TO_QST: excelData[index].TO_QST,
          SUB_SEC: excelData[index].SUB_SEC,
          Error_Message: `Department code does not match the specified degree name ${degreeName}`,
        });
        continue; // Skip records that don't match the specified degreeName
      }
      let item = excelData[index];
      let keyChk = String(item.Dep_Code).padStart(2, "0");
      let subcode = String(item.SUBCODE || "").replace(/[\r\n\t\s]/g, "");
      const availableTestCodes = subjectTestCodes.get(subcode) || new Set();
      const suppliedTestcode = String(item.testcode || item.Testcode || item.TestCode || "").trim();
      const testcode = suppliedTestcode || (availableTestCodes.size === 1 ? [...availableTestCodes][0] : "");
      if (!testcode || (availableTestCodes.size > 0 && !availableTestCodes.has(testcode))) {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: keyChk,
          SUBCODE: subcode,
          testcode,
          Error_Message: availableTestCodes.size > 1 && !testcode
            ? `Test code is required to distinguish ${subcode} variants`
            : `Test code ${testcode || ""} is not configured for ${subcode}`,
        });
        continue;
      }
      let subsecion = String(item.SECTION || "").replace(/[\r\n\t\s]/g, "");
      let subFromSection = String(item.FROM_QST || "").replace(
        /[\r\n\t\s]/g,
        ""
      );
      let subToSection = String(item.TO_QST || "").replace(/[\r\n\t\s]/g, "");
      let subSubSection = String(item.SUB_SEC || "").replace(/[\r\n\t\s]/g, "");
      wherecondition = {};
      wherecondition.Dep_Name = keyChk;
      wherecondition.SUBCODE = subcode;
      wherecondition.testcode = testcode;
      wherecondition.SECTION = subsecion;
      wherecondition.FROM_QST = subFromSection;
      wherecondition.TO_QST = subToSection;
      wherecondition.SUB_SEC = subSubSection;


      data_existing = await valid_question.findOne({
        where: wherecondition,
      });
      if (!data_existing) {
        // // Format month and year as "Jan-2026"
        // const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // const evaMonth = item.Eva_Month ? monthNames[parseInt(item.Eva_Month) - 1] : null;
        // const evaYear = item.Eva_Year ? String(item.Eva_Year) : null;
        RecrodCnt = RecrodCnt + 1;
        await valid_question.create({
          Dep_Name: keyChk,
          SUBCODE: subcode,
          testcode,
          SECTION: subsecion,
          FROM_QST: subFromSection,
          TO_QST: subToSection,
          SUB_SEC: subSubSection,
          MARK_MAX: item.MARK_MAX,
          NOQST: item.NOQST,
          C_QST: item.C_QST,
          Eva_Mon_Year: `${semMonth}_${semYear}`,
        });
      } else {
        ErrorFlag = true;
        Error_responseData.push({
          Dep_Code: item.Dep_Code,
          SUBCODE: item.SUBCODE,
          Error_Message: "Department Master already exists in the database",
        });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else if (uploadFileType == 13) {
    let ErrorFlag = false;
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      let item = excelData[index];

      let keyChk = String(item.Employee_Code || "").replace(/[\r\n\t\s]/g, "");
      data_existing = await staff_master.findOne({
        where: { Eva_Id: keyChk },
      });
      if (!data_existing) {
        RecrodCnt = RecrodCnt + 1;
        await staff_master.create({
          Eva_Id: String(item.Employee_Code || "").replace(/[\r\n\t\s]/g, ""),
          FACULTY_NAME: item.Employee_Name,
          DESIGNATION: item.Designation,
          Email_Id: item.Email,
          Mobile_Number: item.Mobile_Number,
        });
      } else {
        Error_responseData.push({
          Employee_Code: item.Employee_Code,
          Staff_Name: item.Staff_Name,
          Error_Message: "Employee_Code already exists in the database",
          ErrorFlag: true,
        });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else if (uploadFileType == 14) {


    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      let item = excelData[index];
      let flname = `import${item.Valuvation}`;
      const data_Update = await db[flname].update({
        Checked: "NO",
        E_flg: "A",
        tflg: "A",

        Evaluator_Id: String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, ""),

      }, {
        where: {
          barcode: String(item.Dummy || "").replace(/[\r\n\t\s]/g, ""),
          subcode: String(item.SubCode || "").replace(/[\r\n\t\s]/g, ""),
        },
      });

      if (!data_Update) {
        Error_responseData.push({
          barcode: item.Dummy,
          subcode: item.SubCode,
          Error_Message: `No matching record found to update in ${flname}`,
        });
        ErrorFlag = true;
      } else {
        RecrodCnt = RecrodCnt + 1;
      }

    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt

    });

  } else if (uploadFileType == 6) {

    const Faculty_Data = await faculties.findAll({
    });
    const DateTime_Now = getCurrentISTDateTime();

    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {
      let item = excelData[index];
      let subcode = String(item.SubjectCode || "").replace(/[\r\n\t\s]/g, "");
      let DummyNo = String(item.Dummy_NO || "").replace(/[\r\n\t\s]/g, "");
      let flname = `import${item.Valuation_Type}`;

      console.log(`Processing record ${index + 1}/${TotalRecordCnt}: DummyNo=${DummyNo}, Subcode=${subcode}, Valuation_Type=${item.Valuation_Type}`);


      const Import_Data = await db[flname].findOne({
        where: {
          barcode: DummyNo,
          subcode: subcode,
        },
      });

      if (Import_Data) {
        RecrodCnt = RecrodCnt + 1;


        const existingReviewData = await db.student_result_data.findOne({
          where: {
            Dummy_NO: Import_Data.barcode,
            SubjectCode: Import_Data.subcode,
            Valuation_Type: item.Valuation_Type,
          }
        })

        // console.log(item["Student Name"], "Existing Review Data:", existingReviewData ? "Found" : "Not Found");
        // retrun
        if (!existingReviewData) {

          let Faculty_Row = Faculty_Data.find(faculty => { const Eva_Id = String(Import_Data.Evaluator_Id || "").replace(/[\r\n\t\s]/g, ""); return faculty.Eva_Id === Eva_Id });
          await db.student_result_data.create({
            Dummy_NO: Import_Data.barcode,
            RegisterNo: item.RegisterNo,
            SubjectCode: Import_Data.subcode,
            Dep_Name: Import_Data.Dep_Name,
            Eva_Mon_Year: Import_Data.Eva_Mon_Year,
            Evaluator_Id: Import_Data.Evaluator_Id,
            FACULTY_NAME: Faculty_Row ? Faculty_Row.FACULTY_NAME : null,
            Mobile_Number: Faculty_Row ? Faculty_Row.Mobile_Number : null,
            Email_Id: Faculty_Row ? Faculty_Row.Email_Id : null,
            Import_Date: DateTime_Now,
            studentname: item["Student Name"],
            StudentMobileno: item.StudentMobileno,
            StudentOfficalEmailID: item.StudentOfficalEmailID,
            StudentContactNo: item.StudentContactNo,
            StudentPersonalEmailID: item.StudentPersonalEmailID,
            Valuation_Type: item.Valuation_Type,
          });
          const facultData = await faculties.findOne({
            where: {
              Eva_Id: Import_Data.Evaluator_Id,
            },
          });
          if (facultData) {
            let RollData = facultData.Role ? facultData.Role.split(",").map((code) => code.trim()) : [];
            if (!RollData.includes("3")) {
              RollData.push("3");
            }
            let Dep_Name_Field = `Dep_Name_${3}`;
            let Dep_Code = facultData[Dep_Name_Field]
              ? facultData[Dep_Name_Field].split(",").map((code) => code.trim())
              : [];
            if (!Dep_Code.includes(Import_Data.Dep_Name)) {
              Dep_Code.push(Import_Data.Dep_Name);
            }
            let User_Roll_Admin = `User_Roll_Admin_${3}`;
            //.log("User_Roll_Admin", User_Roll_Admin);
            //return

            // Only fetch and update if the field doesn't already have data
            let updateFields = {
              Role: RollData.join(","),
              [Dep_Name_Field]: Dep_Code.join(","),
            };

            if (!facultData[User_Roll_Admin]) {
              let RollDataAdmin = await db.roll_master.findOne({ where: { rollName: 3 } });
              if (RollDataAdmin && RollDataAdmin.rollDescrption) {
                updateFields[User_Roll_Admin] = RollDataAdmin.rollDescrption;
              }
            }

            await facultData.update(updateFields);
          }
          console.log(`Existing review data for DummyNo=${DummyNo}, Subcode=${subcode}, Valuation_Type=${item.Valuation_Type}`);
          //return
        } else {
          ErrorFlag = true;
          Error_responseData.push({
            Dummy_NO: DummyNo,
            subcode: subcode,
            Error_Message: `No matching record found for Dummy No: ${DummyNo}, Subcode: ${subcode} in table ${flname}`,
          });
        }

      } else {
        ErrorFlag = true;
        Error_responseData.push({
          Dummy_NO: String(item.Dummy_NO || "").replace(/[\r\n\t\s]/g, ""),
          subcode: String(item.SubjectCode || "").replace(/[\r\n\t\s]/g, ""),
          Error_Message: `No matching record found for Dummy No: ${item.Dummy_NO}, Subcode: ${item.SubjectCode} in table import${item.Valuation_Type}`,
        });
      }
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else if (uploadFileType == 16) {


    const Sub_Master = await sub_master.findAll({
      where: {
        Dep_Name: String(degreeName).padStart(2, "0"),
        Eva_Mon_Year: `${semMonth}_${semYear}`,
      },
    });
    for (const item of excelData) {
      const subcode = String(item.SubjectCode || "").replace(/[\r\n\t\s]/g, "");
      const PaperCnt = parseInt(item.Papers, 10) || 0;
      const matchingSubMaster = Sub_Master.find(sub => sub.Subcode === subcode);
      if (!matchingSubMaster) {
        ErrorFlag = true;
        Error_responseData.push({
          Subcode: item.SubjectCode,
          SUBNAME: item.Subname,
          Papers: PaperCnt,
          Error_Message: `No matching Sub_Master record found for Subcode ${subcode}`,
        });
      } else {
        matchingSubMaster.no_Papers = PaperCnt;
        await matchingSubMaster.save();
      }
    }



    res.status(200).json({
      message: "File processed successfully",
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });

  } else if (uploadFileType == 17) {
    const readField = (row, keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return row[key];
        }
      }
      return "";
    };

    const normalizeText = (value) => {
      const cleaned = String(value ?? "").replace(/[\r\n\t]/g, "").trim();
      const lowered = cleaned.toLowerCase();
      if (!cleaned || lowered === "null" || lowered === "undefined" || cleaned === "-") {
        return "";
      }
      return cleaned;
    };

    if (!Array.isArray(excelData) || excelData.length === 0) {
      return res.status(200).json({
        Error_responseData,
        ErrorFlag: true,
        RecrodCnt: 0,
        TotalRecordCnt: 0,
        notFoundRows: [],
        notFoundCount: 0,
      });
    }

    TotalRecordCnt = excelData.length;
    const evaMonYear = `${semMonth}_${semYear}`;
    const normalizedDegreeName = String(degreeName || "").trim();
    const fallbackDepName = normalizedDegreeName && normalizedDegreeName !== "0"
      ? normalizedDegreeName.padStart(2, "0")
      : "";

    const extractedRows = [];
    const invalidRows = [];

    for (let index = 0; index < excelData.length; index++) {
      const row = excelData[index] || {};
      const regId = normalizeText(
        readField(row, [
          "REG ID",
          "REG_ID",
          "RegId",
          "RegisterNo",
          "Register No",
          "Reg No",
          "REGNO",
          "ID",
          "Id",
          "Eva_Id",
          "EVA_ID",
          "Employee_Code",
          "EMPLOYEE_CODE",
        ])
      );
      const courseCode = String(readField(row, ["COURSE CODE", "COURSE_CODE", "CourseCode", "SubjectCode"]))
        .trim();
      const dummy = String(readField(row, ["DUMMY", "Dummy", "DUMMY_NO", "Dummy_NO", "Barcode"]))
        .trim();
      const depCodeRaw = String(
        readField(row, ["Dep_Code", "DEP_CODE", "DepCode", "Dep Code", "DEP CODE"])
      ).trim();

      const depCode = depCodeRaw === "" ? fallbackDepName : depCodeRaw.padStart(2, "0");

      if (!regId || !courseCode || !dummy) {
        invalidRows.push({
          rowNumber: index + 1,
          regId,
          courseCode,
          dummy,
          depCode,
          error: "Missing REG ID / COURSE CODE / DUMMY",
        });
        continue;
      }

      extractedRows.push({
        rowNumber: index + 1,
        regId,
        courseCode,
        dummy,
        depCode,
        degreeName,
        evaMonYear,
      });
    }

    const Op = db.Sequelize.Op;
    const uniqueRegIds = [...new Set(extractedRows.map((row) => row.regId).filter(Boolean))];
    const existingFacultyRows = uniqueRegIds.length
      ? await db.faculties.findAll({
        where: { Eva_Id: { [Op.in]: uniqueRegIds } },
        attributes: ["Eva_Id"],
        raw: true,
      })
      : [];

    const existingEvaIdSet = new Set(
      existingFacultyRows.map((item) => String(item.Eva_Id || "").trim())
    );

    const facultyInsertRows = [];
    const facultyPendingSet = new Set();
    const currentMaxFacultyId = (await db.faculties.max("id")) || 0;
    let nextFacultyId = Number(currentMaxFacultyId) + 1;

    for (const row of extractedRows) {
      const evaId = String(row.regId || "").trim();
      if (!evaId || existingEvaIdSet.has(evaId) || facultyPendingSet.has(evaId)) {
        continue;
      }

      const hashedPassword = await bcrypt.hash(evaId, bcrypt.genSaltSync(10));
      facultyPendingSet.add(evaId);
      facultyInsertRows.push({
        id: nextFacultyId++,
        Eva_Id: evaId,
        Password: hashedPassword,
        Role: "8",
        FACULTY_NAME: evaId,
        Dep_Name: row.depCode || fallbackDepName || null,
        Dep_Name_8: row.depCode || fallbackDepName || null,
        Eva_Mon_Year: evaMonYear,
      });
    }

    if (facultyInsertRows.length > 0) {
      await db.faculties.bulkCreate(facultyInsertRows, { validate: true });
    }

    const uniqueDummies = [...new Set(extractedRows.map((row) => row.dummy))];
    const uniqueSubcodes = [...new Set(extractedRows.map((row) => row.courseCode))];

    const importRecords = uniqueDummies.length && uniqueSubcodes.length
      ? await student_import.findAll({
        where: {
          barcode: { [Op.in]: uniqueDummies },
          subcode: { [Op.in]: uniqueSubcodes },
        },
        attributes: ["id", "barcode", "subcode", "Evaluator_Id", "Checked"],
        raw: true,
      })
      : [];

    const importMap = new Map();
    importRecords.forEach((record) => {
      const key = `${record.barcode}__${record.subcode}`;
      if (!importMap.has(key)) {
        importMap.set(key, record);
      }
    });

    const matchedRows = [];
    const notFoundRows = [];

    for (const row of extractedRows) {
      const evaData = importMap.get(`${row.dummy}__${row.courseCode}`);
      if (evaData) {
        matchedRows.push({
          ...row,
          importId: evaData.id,
          evaluatorId: evaData.Evaluator_Id || null,
        });
      } else {
        notFoundRows.push({
          ...row,
          error: "No matching record found in import1 for barcode + subcode",
        });
      }
    }

    const matchedEvaluatorIds = [
      ...new Set(
        matchedRows
          .map((row) => String(row.evaluatorId || "").trim())
          .filter((value) => value !== "")
      ),
    ];

    const facultyRows = matchedEvaluatorIds.length
      ? await db.faculties.findAll({
        where: { Eva_Id: { [Op.in]: matchedEvaluatorIds } },
        attributes: ["Eva_Id", "FACULTY_NAME"],
        raw: true,
      })
      : [];

    const facultyMap = new Map();
    facultyRows.forEach((item) => {
      facultyMap.set(String(item.Eva_Id || "").trim(), item.FACULTY_NAME || null);
    });

    const existingRecords = matchedRows.length
      ? await studentResultData.findAll({
        where: {
          Dummy_NO: { [Op.in]: matchedRows.map((row) => row.dummy) },
          RegisterNo: { [Op.in]: matchedRows.map((row) => row.regId) },
          Exammonth: String(semMonth),
          ExamYear: String(semYear),
          Valuation_Type: 1,
        },
        attributes: ["Dummy_NO", "RegisterNo", "Exammonth", "ExamYear", "Valuation_Type"],
        raw: true,
      })
      : [];

    const existingKeySet = new Set(
      existingRecords.map(
        (item) =>
          `${item.Dummy_NO}__${item.RegisterNo}__${item.Exammonth}__${item.ExamYear}__${item.Valuation_Type}`
      )
    );

    const insertRows = [];
    for (const row of matchedRows) {
      const uniqueKey = `${row.dummy}__${row.regId}__${semMonth}__${semYear}__1`;
      if (existingKeySet.has(uniqueKey)) {
        continue;
      }

      insertRows.push({
        Dummy_NO: row.dummy,
        RegisterNo: row.regId,
        Dep_Name: row.depCode || fallbackDepName || null,
        Exammonth: String(semMonth),
        ExamYear: String(semYear),
        Evaluator_Id: row.evaluatorId ? String(row.evaluatorId) : null,
        FACULTY_NAME: row.evaluatorId ? facultyMap.get(String(row.evaluatorId).trim()) || null : null,
        Eva_Mon_Year: evaMonYear,
        Valuation_Type: 1,
        SubjectCode: row.courseCode,
      });
    }

    if (insertRows.length > 0) {
      await studentResultData.bulkCreate(insertRows);
    }

    RecrodCnt = insertRows.length;
    ErrorFlag = invalidRows.length > 0 || notFoundRows.length > 0;
    Error_responseData = [...invalidRows, ...notFoundRows];

    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt,
      extractedCount: extractedRows.length,
      matchedCount: matchedRows.length,
      facultyCreatedCount: facultyInsertRows.length,
      skippedExistingCount: matchedRows.length - insertRows.length,
      notFoundRows,
      notFoundCount: notFoundRows.length,
      invalidRows,
      invalidCount: invalidRows.length,
    });
  } else if (uploadFileType == 18) {
    let ErrorFlag = false;
    TotalRecordCnt = excelData.length;
    for (let index = 0; index < excelData.length; index++) {

      let item = excelData[index];

      let keyChk;
      if (item.Role == "9") {
        keyChk = String(item.Eva_Id || "").replace(/[\r\n\t\s]/g, "");
      } else {
        res.status(400).json({
          Error_responseData: [{
            Error_Message: "Invalid Role. Only Role 9 is allowed for this upload type."
          }],
          ErrorFlag: true,
          RecrodCnt,
          TotalRecordCnt
        });
        return;
      }
      data_existing = await faculties.findOne({
        where: {
          Eva_Id: keyChk,
        },
      });
      let Dep_Name_Field = `Dep_Name_${item.Role}`;
      let User_Roll_Admin = `User_Roll_Admin_${item.Role}`;
      let Role_Admin_Data = await db.roll_master.findOne({ where: { rollName: item.Role } });
      if (!data_existing) {
        RecrodCnt = RecrodCnt + 1;
        const staff_response = await staff_master.findOne({
          where: {
            Eva_Id: keyChk,
          },
        });

        let Candidate_Name = staff_response
          ? staff_response.FACULTY_NAME
          : null;
        let Candidate_email = staff_response ? staff_response.Email_Id : null;
        let Candidate_mobile = staff_response
          ? staff_response.Mobile_Number
          : null;

        const generatePasword = Math.random()
          .toString(36)
          .slice(-8)
          .toString()
          .toUpperCase();


        await faculties.create({
          Eva_Id: keyChk,
          // Dep_Name: String(item.Dep_Code || "").padStart(2, "0"),
          [Dep_Name_Field]: String(item.Dep_Code || "").padStart(2, "0"),
          Role: item.Role,
          FACULTY_NAME: item.FACULTY_NAME || Candidate_Name,
          Password: await bcrypt.hash(generatePasword, bcrypt.genSaltSync(10)),
          Temp_Password: generatePasword,
          ResetPass: 0,
          subcode: item.Role == 9 ? String(item.subcode || "").replace(/[\r\n\t\s]/g, "") : null,
          Eva_Subject:
            item.Role == 9
              ? String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
              : null,

          Email_Id: Candidate_email || item.Email_Id,
          Mobile_Number: Candidate_mobile || item.Mobile_Number,
          servername: req.get("host"),
          Eva_Mon_Year: `${semMonth}_${semYear}`,
          sms_status: "N",
          [User_Roll_Admin]: Role_Admin_Data ? (Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null) : null,

        });
        RecrodCnt = RecrodCnt + 1;


      } else {

        let Dep_Code;
        let isDuplicate = false;
        let RollChek;
        let RollUpdate;
        Dep_Code = data_existing[Dep_Name_Field]
          ? data_existing[Dep_Name_Field].split(",").map((code) => code.trim())
          : [];
        let subcode = data_existing.subcode
          ? data_existing.subcode.split(",").map((code) => code.trim())
          : [];
        let Eva_Subject = data_existing.Eva_Subject
          ? data_existing.Eva_Subject.split(",").map((code) => code.trim())
          : [];
        RollChek = data_existing.Role
          ? data_existing.Role.split(",").map((code) => code.trim())
          : [];
        RollUpdate = RollChek.find((role) => role == item.Role);
        if (!RollUpdate) {
          RollChek.push(item.Role);
        }

                  for (let i = 0; i < subcode.length; i++) {
            if (
              subcode[i] == item.subcode &&
              Eva_Subject[i] ==
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            ) {
              isDuplicate = true;
              break; // Skip to next iteration if all match
              //continue
            }
          }

          // Append new Dep_Code, subcode, and Eva_Subject
          if (!isDuplicate) {
            Dep_Code.push(String(item.Dep_Code || "").padStart(2, "0"));
            subcode.push(item.subcode);
            Eva_Subject.push(
              String(item.Eva_Subject || "").replace(/[\r\n\t\s]/g, "")
            );
            RecrodCnt = RecrodCnt + 1;
            await data_existing.update({
              [Dep_Name_Field]: Dep_Code.join(","),
              subcode: subcode.join(","),
              Eva_Subject: Eva_Subject.join(","),
              Role: RollChek.join(","),
              [User_Roll_Admin]: data_existing[User_Roll_Admin] || (Role_Admin_Data && Role_Admin_Data.rollDescrption ? JSON.parse(Role_Admin_Data.rollDescrption).join(',') : null),
            });
          }
      }
      console.log(`Processing record ${index + 1}/${TotalRecordCnt}`);
    }
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  } else {
    res.status(200).json({
      Error_responseData,
      ErrorFlag,
      RecrodCnt,
      TotalRecordCnt
    });
  }
});

const sampleFileDownload = (req, res, next) => {
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({
      success: false,
      message: "File name is required",
    });
  }

  const path = require("path");
  const fs = require("fs");
  let filePath = path.join(__dirname, "../sample-files", fileName);

  // Check if file exists, if not try case-insensitive match
  if (!fs.existsSync(filePath)) {
    const sampleDir = path.join(__dirname, "../sample-files");
    if (fs.existsSync(sampleDir)) {
      const files = fs.readdirSync(sampleDir);
      const match = files.find(f => f.toLowerCase() === fileName.toLowerCase());
      if (match) {
        filePath = path.join(sampleDir, match);
      }
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  const stat = fs.statSync(filePath);

  // Use res.download which handles everything properly
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        next(err);
      }
    } else {
    }
  });
};

const Image_Check = asyncHandler(async (req, res) => {
  let ErrorFlag = false;
  const Error_responseData = [];
  const fs = require('fs');
  const path = require('path');
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const subjects = await sub_master.findAll({ attributes: ['Subcode', 'testcode'], raw: true });
  const testCodes = new Map(subjects.map((subject) => [subject.Subcode, subject.testcode]));
  const s3 = process.env.AWS_BUCKET_NAME ? new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  }) : null;
  const roots = ['Move_AnswerSheet_Uploaded', 'AnswerSheet_Uploaded'];
  const pendingByTable = new Map();
  const unresolvedRecords = [];
  const updatesByTable = new Map();
  const s3ImageCounts = new Map();

  const queueUpdate = (tableName, id, districtCode, subcode) => {
    if (!updatesByTable.has(tableName)) updatesByTable.set(tableName, new Map());
    const updateKey = `${districtCode || ''}\u0000${subcode || ''}`;
    const groupedUpdates = updatesByTable.get(tableName);
    if (!groupedUpdates.has(updateKey)) {
      groupedUpdates.set(updateKey, {
        districtCode: districtCode || '',
        subcode: subcode || '',
        ids: [],
      });
    }
    groupedUpdates.get(updateKey).ids.push(id);
  };

  const indexS3Root = async (testCode, root) => {
    const prefix = `${root}/${testCode}/`;
    let continuationToken;
    do {
      const response = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      for (const item of response.Contents || []) {
        if (!item.Key || !/\.(jpg|jpeg|png)$/i.test(item.Key)) continue;
        const [districtFolder, folderSubcode, batchname] = item.Key.slice(prefix.length).split('/');
        if (!districtFolder || !folderSubcode || !batchname) continue;
        const districtPrefix = `${testCode}_`;
        if (!districtFolder.startsWith(districtPrefix)) continue;
        const districtCode = districtFolder.slice(districtPrefix.length);
        const key = `${root}\u0000${testCode}\u0000${districtCode}\u0000${folderSubcode}\u0000${batchname}`;
        s3ImageCounts.set(key, (s3ImageCounts.get(key) || 0) + 1);
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
  };

  try {
    const tableNames = ['import1', 'import2', 'import3', 'import4'];
    const pendingResults = await Promise.all(tableNames.map((tableName) =>
      db[tableName].findAll({
        where: { E_flg: 'I' },
        attributes: [
          'id', 'batchname', 'subcode', 'Eva_Mon_Year',
          'Dep_Name', 'dcode', 'ImgCnt',
          ...(tableName === 'import1' ? ['testcode'] : []),
        ],
        raw: true,
      })
    ));

    tableNames.forEach((tableName, index) => pendingByTable.set(tableName, pendingResults[index]));

    for (const [tableName, records] of pendingByTable) {
      for (const record of records) {
      const batchname = record.batchname;
      const Eva_Mon_Year = record.Eva_Mon_Year;
      const Dep_Name = record.Dep_Name;
      const imageDir = path.join(
        __dirname,
        "..",
        "uploads",
        Eva_Mon_Year,
        "ImgImp",
        Dep_Name,
        batchname
      );

      const expectedCount = parseInt(record.ImgCnt, 10) || 0;
      const correctedSubcode = getDay3SharedSubcode(
        String(record.testcode || '').trim(),
        String(record.Dep_Name || '').padStart(2, '0')
      );
      const imageCount = fs.existsSync(imageDir)
        ? fs.readdirSync(imageDir).filter((file) => /\.(jpg|jpeg|png)$/i.test(file)).length
        : 0;

      if (imageCount >= expectedCount && imageCount > 0) {
        queueUpdate(tableName, record.id, null, correctedSubcode);
      } else {
        unresolvedRecords.push({
          tableName,
          record,
          expectedCount,
          localImageCount: imageCount,
          testCode: String(record.testcode || testCodes.get(record.subcode) || '').trim(),
        });
      }
      }
    }

    if (s3 && unresolvedRecords.length > 0) {
      const testCodesToScan = [...new Set(
        unresolvedRecords.map(({ testCode }) => testCode).filter(Boolean)
      )];
      await Promise.all(testCodesToScan.flatMap((testCode) =>
        roots.map((root) => indexS3Root(testCode, root))
      ));
    }

    for (const { tableName, record, expectedCount, localImageCount, testCode } of unresolvedRecords) {
      let imageCount = localImageCount;
      let foundDistrict;
      const correctedSubcode = getDay3SharedSubcode(
        testCode,
        String(record.Dep_Name || '').padStart(2, '0')
      );
      const legacySubcode = String(record.subcode || '').replace(/[JN](?:11|12)(?=_)/, '');
      const subjectFolderAliases = {
        MATH_03: 'MATHS_03',
        MATHS_03: 'MATH_03',
      };
      const folderSubcodes = [...new Set([
        record.subcode,
        legacySubcode,
        correctedSubcode,
        subjectFolderAliases[record.subcode],
        subjectFolderAliases[legacySubcode],
      ].filter(Boolean))];
      const districts = [...new Set([
        record.dcode && String(record.dcode).padStart(2, '0'),
        ...Array.from({ length: 38 }, (_, index) => String(index + 1).padStart(2, '0')),
      ].filter(Boolean))];

      for (const folderSubcode of folderSubcodes) {
        for (const districtCode of districts) {
          for (const root of roots) {
            const key = `${root}\u0000${testCode}\u0000${districtCode}\u0000${folderSubcode}\u0000${record.batchname}`;
            const count = s3ImageCounts.get(key) || 0;
            if (count > imageCount) imageCount = count;
            if (count >= expectedCount && count > 0) {
              foundDistrict = districtCode;
              break;
            }
          }
          if (foundDistrict) break;
        }
        if (foundDistrict) break;
      }

      if (imageCount >= expectedCount && imageCount > 0) {
        queueUpdate(tableName, record.id, foundDistrict, correctedSubcode);
      } else {
        Error_responseData.push({
          batchname: record.batchname,
          Dep_Name: record.Dep_Name,
          subcode: record.subcode,
          Error_Message: imageCount === 0
            ? 'Image directory does not exist in local storage or S3'
            : `Insufficient images. Expected: ${expectedCount}, Found: ${imageCount}`,
        });
        ErrorFlag = true;
      }
    }

    for (const [tableName, groupedUpdates] of updatesByTable) {
      for (const { districtCode, subcode, ids } of groupedUpdates.values()) {
        for (let offset = 0; offset < ids.length; offset += 1000) {
          await db[tableName].update(
            {
              E_flg: 'N',
              ...(districtCode ? { dcode: districtCode } : {}),
              ...(subcode ? { subcode } : {}),
            },
            { where: { id: { [Op.in]: ids.slice(offset, offset + 1000) } } }
          );
        }
      }
    }
  } finally {
    s3?.destroy();
  }

  if (ErrorFlag == false) {
    res.status(200).json({
      message: "All images verified successfully",
      Error_responseData,
      ErrorFlag
    });
  } else {
    res.status(200).json({ Error_responseData, ErrorFlag });
  }
});

const getSubjectCode = asyncHandler(async (req, res) => {

  const { Dep_Name } = req.query;

  const subjects = await sub_master.findAll({
    where: {
      Dep_Name: Dep_Name,
    },
    attributes: ["Subcode", "SUBNAME"],
  });

  res.status(200).json(subjects);

});

const getTableCount = asyncHandler(async (req, res) => {

  const [import1Count, facultiesCount, subMasterCount, validSectionsCount, validQuestionCount] = await Promise.all([
    db.import1.count(),
    faculties.count(),
    sub_master.count(),
    valid_sections.count(),
    valid_question.count()
  ]);

  const tableCounts = {
    import1: import1Count,
    faculties: facultiesCount,
    sub_master: subMasterCount,
    valid_sections: validSectionsCount,
    valid_question: validQuestionCount
  };

  res.status(200).json(tableCounts);

});

module.exports = {
  exgeneralMasterData,
  sampleFileDownload,
  Image_Check,
  getSubjectCode,
  getTableCount,
};
