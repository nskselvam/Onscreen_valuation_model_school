const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const User_Details = db.User_Details;
const { Sequelize, Op } = require("sequelize");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const generatePasword = require("../utils/passwordGenerate");


const getAllUserData = asyncHandler(async (req, res) => {
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search    = (req.query.search || '').trim();
    const resetPass = req.query.ResetPass;
    const offset    = (page - 1) * limit;

    const whereClause = {};
    if (search) {
        whereClause[Op.or] = [
            { User_Name: { [Op.iLike]: `%${search}%` } },
            { Email_Id:  { [Op.iLike]: `%${search}%` } },
            { User_Id:   { [Op.iLike]: `%${search}%` } },
            { D_Code:    { [Op.iLike]: `%${search}%` } },
            { Role:      { [Op.iLike]: `%${search}%` } },
        ];
    }
    if (resetPass !== undefined && resetPass !== '') {
        whereClause.ResetPass = resetPass;
    }

    const { count, rows } = await User_Details.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['User_Name', 'ASC']],
    });

    // Fetch role master data
    const roleMasters = await db.user_role_masters.findAll({
        attributes: ['user_role_code', 'user_role'],
        order: [['user_role_code', 'ASC']]
    });

    res.status(200).json({
        status: 'success',
        data:  rows,
        roleMasters: roleMasters,
        total: count,
        page,
        limit,
    });
})

const getLoggedInUsers = asyncHandler(async (req, res) => {
    const loggedInUsers = await User_Details.findAll({
        where: {
            Login_Status: 'Y'
        },
        attributes: [
            'id',
            'User_Id',
            'User_Name',
            'Email_Id',
            'Role',
            'D_Code',
            'Mobile_Number',
            'Login_Status',
            'User_Roll_Admin_0',
            'User_Roll_Admin_1',
            'User_Roll_Admin_2'
        ],
        order: [['User_Name', 'ASC']]
    });

    // Fetch role master data
    const roleMasters = await db.user_role_masters.findAll({
        attributes: ['user_role_code', 'user_role'],
        order: [['user_role_code', 'ASC']]
    });

    res.status(200).json({
        status: 'success',
        data: loggedInUsers,
        roleMasters: roleMasters,
        count: loggedInUsers.length
    });
})

const createUserData = asyncHandler(async (req, res) => {
    const { Role, User_Id, User_Name, Email_Id, D_Code, Mobile_Number, Password } = req.body;

    // Validate required fields
    if (!Role || !User_Id || !User_Name || !Email_Id) {
        throw new AppError('Role, User ID, name, and email are required', 400);
    }

    const trimmedUserId = User_Id.toString().trim();
    const trimmedEmail = Email_Id.toString().trim();

    // District code validation for district users
    if (String(Role) !== '0' && D_Code) {
        if (!D_Code.toString().trim()) {
            throw new AppError('D_Code is required for this user role', 400);
        }
    }

    // Check if user with this email or user id already exists
    const existingUserById = await User_Details.findOne({
        where: { User_Id: trimmedUserId }
    });

    if (existingUserById) {
        throw new AppError(`User ID '${trimmedUserId}' is already taken. Please choose a different User ID.`, 400);
    }

    const existingUserByEmail = await User_Details.findOne({
        where: { Email_Id: trimmedEmail }
    });

    if (existingUserByEmail) {
        throw new AppError(`Email '${trimmedEmail}' is already registered. Please use a different email.`, 400);
    }

    const passwordProvided = Password && Password.toString().trim();
    const tempPassword = passwordProvided ? null : generatePasword();
    const passwordToHash = passwordProvided ? Password.toString().trim() : tempPassword;
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Get role permissions from roll_master table
    const User_Roll_Admin_Field = `User_Roll_Admin_${Role}`;
    const roleAdminData = await db.roll_master.findOne({ 
        where: { rollName: parseInt(Role) } 
    });

    // Build user data object with only essential fields
    const userData = {
        User_Id: trimmedUserId,
        User_Name: User_Name.trim(),
        Email_Id: trimmedEmail,
        Role: Role.toString(),
        Password: hashedPassword,
        Temp_Password: passwordProvided ? null : tempPassword,
        ResetPass: passwordProvided ? 'Y' : 'N',
        token_version: 0,
        [User_Roll_Admin_Field]: roleAdminData && roleAdminData.rollDescrption 
            ? JSON.parse(roleAdminData.rollDescrption).join(',') 
            : null,
        ...(D_Code ? { D_Code: D_Code.toString().trim() } : {}),
        ...(Mobile_Number ? { Mobile_Number: Mobile_Number.toString().trim() } : {})
    };

    // Create new user
    const newUser = await User_Details.create(userData);

    console.log('New user created:', newUser.id, 'Email:', newUser.Email_Id);

    // Send welcome email with temporary password
    let emailStatus = 'Not sent';
    try {
        const { sendEmail } = require('../utils/sendmail');
        
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Welcome to Government Institution</h2>
                <p>Hello <strong>${newUser.User_Name}</strong>,</p>
                <p>Your account has been created successfully. Below are your login credentials:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${newUser.Email_Id}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong></p>
                    <p style="font-size: 18px; color: #27ae60; font-weight: bold; letter-spacing: 2px;">${tempPassword}</p>
                </div>
                <p><strong style="color: #e74c3c;">Important:</strong> You must change this password immediately after your first login.</p>
                <p>Please keep this information secure and do not share it with anyone.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        `;

        const result = await sendEmail(
            newUser.Email_Id,
            'Welcome - Your Account Has Been Created',
            emailBody
        );

        if (result.success) {
            emailStatus = 'Sent';
            // Update Mailer field to 'Y' (email sent)
            newUser.Mailer = 'Y';
            await newUser.save();
            console.log('✅ Welcome email sent to:', newUser.Email_Id);
        } else {
            emailStatus = 'Failed';
            console.error('❌ Email sending failed:', result.error);
        }
    } catch (emailError) {
        console.error('Email sending error:', emailError);
        emailStatus = 'Failed';
    }

    res.status(201).json({
        status: 'success',
        message: 'User created successfully. Welcome email sent with temporary password.',
        data: {
            id: newUser.id,
            User_Name: newUser.User_Name,
            Email_Id: newUser.Email_Id,
            Role: newUser.Role,
            emailStatus: emailStatus,
            Temp_Password: tempPassword  // Return temp password for admin reference
        }
    });
});

const deleteUserData = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    console.log('Delete request for userId:', userId, 'Type:', typeof userId);

    // Parse userId as integer if it's a numeric string
    const numericId = parseInt(userId);
    const isNumeric = !isNaN(numericId) && numericId.toString() === userId.toString();

    // Delete entire user by id (integer) or Email_Id (string)
    const deletedUser = await User_Details.destroy({
        where: isNumeric 
            ? { id: numericId }  // Use numeric comparison for id
            : { Email_Id: userId }  // Use string comparison for email
    });

    if (!deletedUser) {
        throw new AppError('User not found or failed to delete', 404);
    }

    console.log('User deleted successfully:', userId);

    res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
    });
});

const addUpdateSubjectData = asyncHandler(async (req, res) => {
    const {
        Subject_Code,
        Evaluation_Type,
        Camp_Id,
        Camp_Officer_Id,
        Total_Paper_In_Each_Subject,
        Dep_Name,
        Examiner_Valuation_Status,
        Eva_Id,
        id,
        mode,
        selectedRole,
        chief_examiner
    } = req.body;

    const index = id;
    let Dep_Name_Field = `Dep_Name_${selectedRole}`;
    const user = await User_Details.findOne({ where: { Email_Id: Eva_Id } });
    // if (!user) {
    //     throw new AppError('User not found', 404);
    // }
    let subcode = user.subcode ? user.subcode.split(",") : [];
    let Eva_Subject = user.Eva_Subject ? user.Eva_Subject.split(",") : [];
    let Camp_id = user.Camp_id ? user.Camp_id.split(",") : [];
    let camp_offcer_id_examiner = user.camp_offcer_id_examiner ? user.camp_offcer_id_examiner.split(",") : [];
    let Sub_Max_Paper = user.Sub_Max_Paper ? user.Sub_Max_Paper.split(",") : [];
    let Valuation_Status = user.Examiner_Valuation_Status ? user.Examiner_Valuation_Status.split(",") : [];
    let Dep_Code = user[Dep_Name_Field] ? user[Dep_Name_Field].split(",") : [];
    let Chief_subcode = user.Chief_subcode ? user.Chief_subcode.split(",") : [];
    let Chief_Eva_Subject = user.Chief_Eva_Subject ? user.Chief_Eva_Subject.split(",") : [];
    let Camp_id_chief = user.Camp_id_chief ? user.Camp_id_chief.split(",") : [];
    let camp_offcer_id_chief = user.camp_offcer_id_chief ? user.camp_offcer_id_chief.split(",") : [];
    let Chief_Valuation_Status = user.Chief_Valuation_Status ? user.Chief_Valuation_Status.split(",") : [];
    let chief_examiner_tbl = user.chief_examiner ? user.chief_examiner.split(",") : [];

    let evaluationSubjectsArray = [];
    let chiefExaminerSubjectsArray = [];

    for (let i = 0; i < subcode.length; i++) {

        evaluationSubjectsArray.push({
            sub_code: subcode[i],
            Camp_id: Camp_id[i],
            camp_offcer_id_examiner: camp_offcer_id_examiner[i],
            Sub_Max_Paper: Sub_Max_Paper[i],
            Eva_Subject: Eva_Subject[i],
            Dep_Code: Dep_Code[i]
        });
    }

    for (let i = 0; i < Chief_subcode.length; i++) {

        chiefExaminerSubjectsArray.push({
            sub_code: Chief_subcode[i],
            Camp_id: Camp_id_chief[i],
            camp_offcer_id_chief: camp_offcer_id_chief[i],
            Chief_Eva_Subject: Chief_Eva_Subject[i],
            Dep_Code: Dep_Code[i],
            chief_examiner: chief_examiner_tbl[i]
        });
    }

    //return


    if (selectedRole === '1') {

        if (mode === 'add') {

            if (Chief_subcode.includes(Subject_Code) && Chief_Eva_Subject.includes(Evaluation_Type) && chief_examiner_tbl.includes(chief_examiner)) {
                throw new AppError('Subject already exists for the user', 400);
            }
            Chief_subcode.push(Subject_Code);
            Chief_Eva_Subject.push(Evaluation_Type);
            Camp_id_chief.push(Camp_Id);
            camp_offcer_id_chief.push(Camp_Officer_Id);
            Chief_Valuation_Status.push(Examiner_Valuation_Status);
            chief_examiner_tbl.push(chief_examiner);
            Dep_Code.push(Dep_Name);
            user.Chief_subcode = Chief_subcode.join(",");
            user.Chief_Eva_Subject = Chief_Eva_Subject.join(",");
            user.Camp_id_chief = Camp_id_chief.join(",");
            user.camp_offcer_id_chief = camp_offcer_id_chief.join(",");
            user.Chief_Valuation_Status = Chief_Valuation_Status.join(",");
            user.chief_examiner = chief_examiner_tbl.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();
        } else if (mode === 'edit') {
            if (index === -1) {
                throw new AppError('Subject not found for the user', 404);
            }
            if (Chief_subcode[index] == Subject_Code && Chief_Eva_Subject[index] == Evaluation_Type && Camp_id_chief[index] == Camp_Id && camp_offcer_id_chief[index] == Camp_Officer_Id && Chief_Valuation_Status[index] == Examiner_Valuation_Status && chief_examiner_tbl[index] == chief_examiner) {

                throw new AppError('Subject code already exists for the user', 400);

            }

            if (Chief_subcode[index] !== Subject_Code) {
                if (Chief_subcode.includes(Subject_Code) && chief_examiner_tbl.includes(chief_examiner) && Evaluation_Type == Chief_Eva_Subject[index]) {
                    throw new AppError('Subject code already exists for the user in the same evaluation type', 400);
                }
            }

            Chief_subcode[index] = Subject_Code;
            Chief_Eva_Subject[index] = Evaluation_Type;
            Camp_id_chief[index] = Camp_Id;
            camp_offcer_id_chief[index] = Camp_Officer_Id;
            Chief_Valuation_Status[index] = Examiner_Valuation_Status;
            chief_examiner_tbl[index] = chief_examiner;
            user.Chief_subcode = Chief_subcode.join(",");
            user.Chief_Eva_Subject = Chief_Eva_Subject.join(",");
            user.Camp_id_chief = Camp_id_chief.join(",");
            user.camp_offcer_id_chief = camp_offcer_id_chief.join(",");
            user.Chief_Valuation_Status = Chief_Valuation_Status.join(",");
            user.chief_examiner = chief_examiner_tbl.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();

        } else if (mode === 'delete') {

 


            let index = chiefExaminerSubjectsArray.findIndex(item => item.sub_code === Subject_Code && item.Chief_Eva_Subject === Evaluation_Type && item.chief_examiner === chief_examiner);
            if (index === -1) {
                throw new AppError('Subject not found for the user', 404);
            }
            Chief_subcode.splice(index, 1);
            Chief_Eva_Subject.splice(index, 1);
            Camp_id_chief.splice(index, 1);
            camp_offcer_id_chief.splice(index, 1);
            Chief_Valuation_Status.splice(index, 1);
            chief_examiner_tbl.splice(index, 1);
            Dep_Code.splice(index, 1);
            user.Chief_subcode = Chief_subcode.join(",");
            user.Chief_Eva_Subject = Chief_Eva_Subject.join(",");
            user.Camp_id_chief = Camp_id_chief.join(",");
            user.camp_offcer_id_chief = camp_offcer_id_chief.join(",");
            user.Chief_Valuation_Status = Chief_Valuation_Status.join(",");
            user.chief_examiner = chief_examiner_tbl.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();
        }
    } else if (selectedRole === '2') {
        if (mode === 'add') {

            if (subcode.includes(Subject_Code) && Eva_Subject.includes(Evaluation_Type)) {
                throw new AppError('Subject already exists for the user', 400);
            }
            subcode.push(Subject_Code);
            Eva_Subject.push(Evaluation_Type);
            Camp_id.push(Camp_Id);
            camp_offcer_id_examiner.push(Camp_Officer_Id);
            Sub_Max_Paper.push(Total_Paper_In_Each_Subject);
            Valuation_Status.push(Examiner_Valuation_Status);
            Dep_Code.push(Dep_Name);
            user.subcode = subcode.join(",");
            user.Eva_Subject = Eva_Subject.join(",");
            user.Camp_id = Camp_id.join(",");
            user.camp_offcer_id_examiner = camp_offcer_id_examiner.join(",");
            user.Sub_Max_Paper = Sub_Max_Paper.join(",");
            user.Examiner_Valuation_Status = Valuation_Status.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();

        } else if (mode === 'edit') {

            if (index === -1) {
                throw new AppError('Subject not found for the user', 404);
            }
            if (subcode[index] == Subject_Code && Eva_Subject[index] == Evaluation_Type && Camp_id[index] == Camp_Id && camp_offcer_id_examiner[index] == Camp_Officer_Id && Sub_Max_Paper[index] == Total_Paper_In_Each_Subject && Valuation_Status[index] == Examiner_Valuation_Status && Dep_Code[index] == Dep_Name) {

                throw new AppError('Subject code already exists for the user', 400);

            }

            if (subcode[index] !== Subject_Code) {
                if (subcode.includes(Subject_Code) && Evaluation_Type == Eva_Subject[index]) {
                    throw new AppError('Subject code already exists for the user in the same evaluation type', 400);
                }
            }

            subcode[index] = Subject_Code;
            Eva_Subject[index] = Evaluation_Type;
            Camp_id[index] = Camp_Id;
            camp_offcer_id_examiner[index] = Camp_Officer_Id;
            Sub_Max_Paper[index] = Total_Paper_In_Each_Subject;
            Valuation_Status[index] = Examiner_Valuation_Status;
            Dep_Code[index] = Dep_Name;
            user.subcode = subcode.join(",");
            user.Eva_Subject = Eva_Subject.join(",");
            user.Camp_id = Camp_id.join(",");
            user.camp_offcer_id_examiner = camp_offcer_id_examiner.join(",");
            user.Sub_Max_Paper = Sub_Max_Paper.join(",");
            user.Examiner_Valuation_Status = Valuation_Status.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();
        } else if (mode === 'delete') {
            // if (index === undefined || index === null || index < 0) {
            //     throw new AppError('Invalid index for delete', 400);
            // }
        
            let index = evaluationSubjectsArray.findIndex(item => item.sub_code === Subject_Code && item.Eva_Subject === Evaluation_Type);
            if (index === -1) {
                throw new AppError('Subject not found for the user', 404);
            }
            subcode.splice(index, 1);
            Eva_Subject.splice(index, 1);
            Camp_id.splice(index, 1);
            camp_offcer_id_examiner.splice(index, 1);
            Sub_Max_Paper.splice(index, 1);
            Valuation_Status.splice(index, 1);
            Dep_Code.splice(index, 1);
            user.subcode = subcode.join(",");
            user.Eva_Subject = Eva_Subject.join(",");
            user.Camp_id = Camp_id.join(",");
            user.camp_offcer_id_examiner = camp_offcer_id_examiner.join(",");
            user.Sub_Max_Paper = Sub_Max_Paper.join(",");
            user.Examiner_Valuation_Status = Valuation_Status.join(",");
            user[Dep_Name_Field] = Dep_Code.join(",");
            await user.save();
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Subject data updated successfully',
    });

});


const updateGeneralBioData = asyncHandler(async (req, res) => {

    const {
        User_Id,
        User_Name,
        Email_Id,
        D_Code,
        Mobile_Number,
        Password,
        Role,
        Max_Paper,
        id,
    } = req.body;
    
    const user = await User_Details.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (User_Id !== undefined) {
        const trimmedUserId = User_Id ? User_Id.toString().trim() : '';
        if (!trimmedUserId) {
            throw new AppError('User ID cannot be empty', 400);
        }
        const existingUserId = await User_Details.findOne({
            where: {
                User_Id: trimmedUserId,
                id: { [Op.ne]: id }
            }
        });
        if (existingUserId) {
            throw new AppError('User ID is already in use', 400);
        }
        user.User_Id = trimmedUserId;
    }

    if (Email_Id !== undefined) {
        const trimmedEmail = Email_Id ? Email_Id.toString().trim() : '';
        if (!trimmedEmail) {
            throw new AppError('Email cannot be empty', 400);
        }
        const existingEmail = await User_Details.findOne({
            where: {
                Email_Id: trimmedEmail,
                id: { [Op.ne]: id }
            }
        });
        if (existingEmail) {
            throw new AppError('Email is already in use', 400);
        }
        user.Email_Id = trimmedEmail;
    }

    if (User_Name !== undefined) {
        user.User_Name = User_Name;
    }
    if (D_Code !== undefined) {
        user.D_Code = D_Code ? D_Code.toString().trim() : null;
    }
    if (Role !== undefined) {
        user.Role = Role;
    }
    if (Mobile_Number !== undefined) {
        user.Mobile_Number = Mobile_Number;
    }
    if (Password !== undefined && Password.toString().trim()) {
        const hashedPassword = await bcrypt.hash(Password.toString().trim(), 10);
        user.Password = hashedPassword;
        user.Temp_Password = null;
        user.ResetPass = 'Y';
    }
    if (Role === "2" && Max_Paper !== undefined) {
        user.Max_Paper = Max_Paper;
    }
    if (Role === "4" && req.body.Camp_id_Camp !== undefined) {
        user.Camp_id_Camp = req.body.Camp_id_Camp;
    }
    
    await user.save();
    
    res.status(200).json({
        status: 'success',
        message: 'General bio data updated successfully',
    });

})

const getAllUserDataError = asyncHandler(async (req, res) => {
    const faculties_Data = await User_Details.findAll({
        where: { vflg: '1' }
    });
    if (!faculties_Data) {
        throw new AppError('No user data found', 404);
    }
    res.status(200).json({
        status: 'success',
        data: faculties_Data,
    });
});

const updateFacultyRawFields = asyncHandler(async (req, res) => {
    const { id, ...fields } = req.body;

    const user = await User_Details.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const allowedFields = [
        'subcode', 'Eva_Subject', 'Sub_Max_Paper', 'camp_offcer_id_examiner',
        'Camp_id', 'Examiner_Valuation_Status', 'Dep_Name_2',
        'Chief_subcode', 'Chief_Eva_Subject', 'chief_examiner',
        'camp_offcer_id_chief', 'Camp_id_chief', 'Chief_Valuation_Status', 'Dep_Name_1'
    ];

    allowedFields.forEach(f => {
        if (fields[f] !== undefined) user[f] = fields[f];
    });

    // Reset vflg after manual fix so it can be re-checked
    user.vflg = '0';
    user.Remarks_Gen = null;

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'User fields updated successfully',
    });
});

const getAllUserRollData = asyncHandler(async (req, res) => {

    // Fetch user data with only necessary fields for role allocation
    const allUserData = await User_Details.findAll({
        attributes: [
            'id',
            'User_Id',
            'User_Name',
            'D_Code',
            'Role',
            'Email_Id',
            'Mobile_Number',
            'User_Roll_Admin_0',
            'User_Roll_Admin_1',
            'User_Roll_Admin_2',
            'User_Roll_Admin_3',
            'User_Roll_Admin',
            'User_Roll_Admin_4',
            'User_Roll_Admin_5',
            'User_Roll_Admin_6',
            'User_Roll_Admin_7',
            'User_Roll_Admin_8',
            'User_Roll_Admin_9'
        ],
        order: [['User_Name', 'ASC']]
    });

    const NavbarDataDetails = await db.navbar_header.findAll({
        order: [
            ['Nav_Header_1', 'ASC'],
            ['Nav_Header_2', 'ASC']
        ]
    });

    const MainHeaderData = NavbarDataDetails.filter(item => item.Nav_Header_2 == '0');

    if (!NavbarDataDetails) {
        throw new AppError('No navbar data found', 404);
    }

    // Fetch role master data
    const roleMasters = await db.user_role_masters.findAll({
        attributes: ['user_role_code', 'user_role'],
        order: [['user_role_code', 'ASC']]
    });

    res.status(200).json({
        status: 'success',
        data_header: MainHeaderData,
        data_complete: NavbarDataDetails,
        UserDetails: allUserData,
        roleMasters: roleMasters
    });
});

const createNavbarItem = asyncHandler(async (req, res) => {
    const {
        Nav_Main_Header_Name,
        Nav_Main_Header_Name_Description,
        Nav_Header_1,
        Nav_Header_2,
        Nav_Header_3,
        Nav_Header_4,
        user_Type,
        user_Role,
        Nav_Status,
        Nav_Icons,
        route_path
    } = req.body;

    if (!Nav_Main_Header_Name || Nav_Main_Header_Name.trim() === '') {
        throw new AppError('Navigation name is required', 400);
    }

    const newNavbarItem = await db.navbar_header.create({
        Nav_Main_Header_Name,
        Nav_Main_Header_Name_Description: Nav_Main_Header_Name_Description || '',
        Nav_Header_1: Nav_Header_1 || 0,
        Nav_Header_2: Nav_Header_2 || 0,
        Nav_Header_3: Nav_Header_3 || 0,
        Nav_Header_4: Nav_Header_4 || 0,
        user_Type: user_Type || 1,
        user_Role: user_Role || '0',
        Nav_Status: Nav_Status !== undefined ? Nav_Status : 1,
        Nav_Icons: Nav_Icons || null,
        route_path: route_path || null
    });

    res.status(201).json({
        status: 'success',
        message: 'Navbar item created successfully',
        data: newNavbarItem
    });
});

const updateNavbarItem = asyncHandler(async (req, res) => {
    const {
        id,
        Nav_Main_Header_Name,
        Nav_Main_Header_Name_Description,
        Nav_Header_1,
        Nav_Header_2,
        Nav_Header_3,
        Nav_Header_4,
        user_Type,
        user_Role,
        Nav_Status,
        Nav_Icons,
        route_path
    } = req.body;

    if (!id) {
        throw new AppError('Navbar item ID is required', 400);
    }

    const navbarItem = await db.navbar_header.findByPk(id);
    if (!navbarItem) {
        throw new AppError('Navbar item not found', 404);
    }

    if (!Nav_Main_Header_Name || Nav_Main_Header_Name.trim() === '') {
        throw new AppError('Navigation name is required', 400);
    }

    navbarItem.Nav_Main_Header_Name = Nav_Main_Header_Name;
    navbarItem.Nav_Main_Header_Name_Description = Nav_Main_Header_Name_Description || '';
    navbarItem.Nav_Header_1 = Nav_Header_1 || 0;
    navbarItem.Nav_Header_2 = Nav_Header_2 || 0;
    navbarItem.Nav_Header_3 = Nav_Header_3 || 0;
    navbarItem.Nav_Header_4 = Nav_Header_4 || 0;
    navbarItem.user_Type = user_Type || '0';
    navbarItem.user_Role = user_Role || '0';
    navbarItem.Nav_Status = Nav_Status || 0;
    navbarItem.Nav_Icons = Nav_Icons || null;
    navbarItem.route_path = route_path || null;

    await navbarItem.save();

    res.status(200).json({
        status: 'success',
        message: 'Navbar item updated successfully',
        data: navbarItem
    });
});

const deleteNavbarItem = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        throw new AppError('Navbar item ID is required', 400);
    }

    const navbarItem = await db.navbar_header.findByPk(id);
    if (!navbarItem) {
        throw new AppError('Navbar item not found', 404);
    }

    await navbarItem.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Navbar item deleted successfully'
    });
});

// Roll Master CRUD Operations
const getAllRollMasters = asyncHandler(async (req, res) => {
    const rollMasters = await db.roll_master.findAll({
        order: [['id', 'ASC']]
    });

    // Get navbar headers where user_Role is 0
    const navbarHeaders = await db.navbar_header.findAll({
        where: {
            user_Role: '0'
        },
        order: [['Nav_Header_1', 'ASC'], ['Nav_Header_2', 'ASC']]
    });

    // Fetch role master data
    const userRoleMasters = await db.user_role_masters.findAll({
        attributes: ['user_role_code', 'user_role'],
        order: [['user_role_code', 'ASC']]
    });

    res.status(200).json({
        status: 'success',
        rollMasters: rollMasters,
        navbarHeaders: navbarHeaders,
        userRoleMasters: userRoleMasters
    });
});

const createRollMaster = asyncHandler(async (req, res) => {
    const { rollName, rollDescrption, rollStatus } = req.body;


    if (rollName === undefined || rollName === null || rollName === '') {
        throw new AppError('Roll name is required', 400);
    }

    // Parse the array from rollDescrption: [navHeader1, ...navHeader2IDs]
    let parsedArray;
    try {
        parsedArray = JSON.parse(rollDescrption || '[]');
    } catch (error) {
        throw new AppError('Invalid rollDescrption format', 400);
    }

    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
        throw new AppError('Invalid rollDescrption format', 400);
    }

    // Extract navHeader1 (first element) and navHeader2 (remaining elements)
    const navHeader1 = parsedArray[0];
    const selectedHeaderIds = parsedArray.slice(1);

    if (!navHeader1) {
        throw new AppError('Main Header Level 1 is required', 400);
    }

    if (selectedHeaderIds.length === 0) {
        throw new AppError('At least one navbar header must be selected', 400);
    }

    // Check if a roll master with the same rollName already exists
    const existingRollMaster = await db.roll_master.findOne({
        where: {
            rollName
        }
    });

    if (existingRollMaster) {
        // Append to existing rollDescrption array without duplicates
        try {
            const existingArray = JSON.parse(existingRollMaster.rollDescrption || '[]');
            if (Array.isArray(existingArray)) {
                // Merge arrays and remove duplicates
                const mergedArray = [...new Set([...existingArray, ...parsedArray])];
                existingRollMaster.rollDescrption = JSON.stringify(mergedArray);
                existingRollMaster.rollStatus = rollStatus !== undefined ? rollStatus : existingRollMaster.rollStatus;
                await existingRollMaster.save();

                res.status(200).json({
                    status: 'success',
                    message: 'Roll master updated - navbar headers appended successfully',
                    data: existingRollMaster
                });
                return;
            }
        } catch (error) {
            throw new AppError('Error merging navbar headers', 500);
        }
    }

    const newRollMaster = await db.roll_master.create({
        rollName,
        rollDescrption: rollDescrption || '',
        rollStatus: rollStatus !== undefined ? rollStatus : 1
    });

    res.status(201).json({
        status: 'success',
        message: 'Roll master created successfully',
        data: newRollMaster
    });
});

const updateRollMaster_Final = asyncHandler(async (req, res) => {
    const { id, rollName, rollDescrption, rollStatus } = req.body;


    

    if (!id) {
        throw new AppError('Roll master ID is required', 400);
    }

    const rollMaster = await db.roll_master.findByPk(id);
    if (!rollMaster) {
        throw new AppError('Roll master not found', 404);
    }

    if (rollName === undefined || rollName === null || rollName === '') {
        throw new AppError('Roll name is required', 400);
    }

    // Parse the array from rollDescrption: [navHeader1, ...navHeader2IDs]
    let parsedArray;
    try {
        parsedArray = JSON.parse(rollDescrption || '[]');
    } catch (error) {
        throw new AppError('Invalid rollDescrption format', 400);
    }

    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
        throw new AppError('Invalid rollDescrption format', 400);
    }

    // Extract navHeader1 (first element) and navHeader2 (remaining elements)
    const navHeader1 = parsedArray[0];
    const selectedHeaderIds = parsedArray.slice(1);

    if (!navHeader1) {
        throw new AppError('Main Header Level 1 is required', 400);
    }

    if (selectedHeaderIds.length === 0) {
        throw new AppError('At least one navbar header must be selected', 400);
    }

    // Check if another roll master with the same rollName exists (excluding current record)
    const existingRollMaster = await db.roll_master.findOne({
        where: {
            rollName,
            id: { [Op.ne]: id } // Exclude the current record being updated
        }
    });


    if (existingRollMaster) {
        // Merge with existing record
        try {
            const existingArray = JSON.parse(existingRollMaster.rollDescrption || '[]');
            if (Array.isArray(existingArray)) {
                // Merge arrays and remove duplicates
                const mergedArray = [...new Set([...existingArray, ...parsedArray])];
                existingRollMaster.rollDescrption = JSON.stringify(mergedArray);
                existingRollMaster.rollStatus = rollStatus !== undefined ? rollStatus : existingRollMaster.rollStatus;
                await existingRollMaster.save();

                // Delete the current record since we merged it into existing one
                await rollMaster.destroy();

                res.status(200).json({
                    status: 'success',
                    message: 'Roll master merged - navbar headers appended successfully',
                    data: existingRollMaster
                });
                return;
            }
        } catch (error) {
            throw new AppError('Error merging navbar headers', 500);
        }
    }

    // Merge new data with existing rollDescrption array to avoid duplicates
    let finalRollDescrption;
    try {
        const currentArray = JSON.parse(rollMaster.rollDescrption || '[]');
        if (Array.isArray(currentArray) && currentArray.length > 0) {
            // Merge current array with new array and remove duplicates
            const mergedArray = [...new Set([...currentArray, ...parsedArray])];
            finalRollDescrption = JSON.stringify(mergedArray);
        } else {
            finalRollDescrption = rollDescrption || '';
        }
    } catch (error) {
        finalRollDescrption = rollDescrption || '';
    }

    rollMaster.rollName = rollName;
    //rollMaster.rollDescrption = finalRollDescrption;
    rollMaster.rollDescrption = rollDescrption || '';
    rollMaster.rollStatus = rollStatus !== undefined ? rollStatus : rollMaster.rollStatus;

    await rollMaster.save();

    res.status(200).json({
        status: 'success',
        message: 'Roll master updated successfully',
        data: rollMaster
    });
});

const deleteRollMaster = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        throw new AppError('Roll master ID is required', 400);
    }

    const rollMaster = await db.roll_master.findByPk(id);
    if (!rollMaster) {
        throw new AppError('Roll master not found', 404);
    }

    await rollMaster.destroy();

    res.status(200).json({
        status: 'success',
        message: 'Roll master deleted successfully'
    });
});

// Update User Roll Admin - Assign Navbar items to user
const updateUserRollAdmin = asyncHandler(async (req, res) => {
    const { userId, evaId, userRollAdmin, roleColumn } = req.body;


    if (!userId && !evaId) {
        throw new AppError('User ID or Eva ID is required', 400);
    }

    // Determine which role column to update (default to User_Roll_Admin if not specified)
    const fieldName = roleColumn !== undefined ? `User_Roll_Admin_${roleColumn}` : 'User_Roll_Admin';

    // Find user by either id or Email_Id
    const whereClause = userId ? { id: userId } : { Email_Id: evaId };
    const user = await User_Details.findOne({ where: whereClause });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Update the specific User_Roll_Admin field
    const updateData = {
        [fieldName]: userRollAdmin
    };
    
    await user.update(updateData);

    res.status(200).json({
        success: true,
        message: `${fieldName} updated successfully`,
        data: {
            id: user.id,
            Email_Id: user.Email_Id,
            User_Name: user.User_Name,
            [fieldName]: user[fieldName]
        }
    });
});

const UpdaterollMaster = asyncHandler(async (req, res) => {

    let { ExaminerRoll } = req.body;

    // If ExaminerRoll is not provided or empty, fetch ALL users from database
    if (!ExaminerRoll || !Array.isArray(ExaminerRoll) || ExaminerRoll.length === 0) {
        console.log('🔄 Fetching all users from database...');
        ExaminerRoll = await User_Details.findAll({
            attributes: ['id', 'User_Name', 'Role'],
            where: {
                Role: { [Op.ne]: null } // Only users with a role assigned
            },
            order: [['id', 'ASC']]
        });
        console.log(`📊 Found ${ExaminerRoll.length} users to process`);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of ExaminerRoll) {
        let RollData = item.Role ? item.Role.split(",") : [];
       
        if (RollData.length === 0) {
            skippedCount++;
            continue;
        }
        
        for (let i = 0; i < RollData.length; i++) {
            const roleId = RollData[i].trim();
            let flnameRollMaster = "User_Roll_Admin_" + roleId;
            
            if (roleId === '') {
                continue;
            }
            
            const rollName = parseInt(roleId);
            
            // Query roll_masters table to get navbar assignments for this role
            const existingRollMaster = await db.roll_master.findOne({
                where: {
                    rollName: rollName
                }
            });

            if (existingRollMaster) {
                try {
                    // Parse the navbar IDs from roll_masters.rollDescrption (JSON array)
                    const navbarArray = JSON.parse(existingRollMaster.rollDescrption || '[]');
                    
                    // Ensure it's an array of unique values
                    const mergedArray = [...new Set(navbarArray)];

                    // Update the User_Details record with navbar assignments for this role
                    // Store as comma-separated string to match existing format
                    const [updateCount] = await User_Details.update(
                        { [flnameRollMaster]: mergedArray.join(",") },
                        { where: { id: item.id } }
                    );
                    
                    if (updateCount === 0) {
                        console.warn(`⚠️ No user updated for id: ${item.id}, field: ${flnameRollMaster}`);
                    } else {
                        updatedCount++;
                        console.log(`✅ Updated user id: ${item.id}, field: ${flnameRollMaster}, rollName: ${rollName}, navbars: ${mergedArray.join(",")}`);
                    }

                } catch (error) {
                    console.error('❌ Error updating user navbar assignments:', error);
                    throw new AppError('Error updating user navbar assignments: ' + error.message, 500);
                }
            } else {
                console.warn(`⚠️ Role ${roleId} (rollName: ${rollName}) not found in roll_masters table`);
            }
        }
    }

    res.status(201).json({
        status: 'success',
        message: 'Roll master processed successfully',
        updated: updatedCount,
        skipped: skippedCount,
        total: ExaminerRoll.length
    });
});

// Reset User Password - Admin can reset any user's password
const resetUserPassword = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        throw new AppError('User ID is required', 400);
    }

    // Find user by id
    const user = await User_Details.findByPk(id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.Email_Id) {
        throw new AppError('User email not found. Cannot send password reset email.', 400);
    }

    // Generate new password
    const newPassword = generatePasword();
    const hashedPassword = await bcrypt.hash(newPassword, bcrypt.genSaltSync(10));

    // Update user password
    user.User_Pass = hashedPassword;
    user.Temp_Password = newPassword;
    user.ResetPass = 'N'; // Mark as temporary password - user must change on login (N = not reset)
    
    await user.save();

    // Send email with new password
    let emailStatus = 'Not sent';
    try {
        const { sendEmail } = require('../utils/sendmail');
        
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Password Reset Notification</h2>
                <p>Hello <strong>${user.User_Name || 'User'}</strong>,</p>
                <p>Your password has been reset by an administrator.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Your temporary password is:</strong></p>
                    <p style="font-size: 18px; color: #e74c3c; font-weight: bold; letter-spacing: 2px;">${newPassword}</p>
                </div>
                <p><strong style="color: #e74c3c;">Important:</strong> You must change this password immediately after logging in.</p>
                <p>If you did not request this password reset, please contact your administrator immediately.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        `;

        const result = await sendEmail(
            user.Email_Id,
            'Password Reset - Government Institution',
            emailBody
        );

        if (result.success) {
            emailStatus = 'Sent';
            // Update Mailer field to 'Y' (email sent)
            user.Mailer = 'Y';
            await user.save();
        } else {
            emailStatus = 'Failed';
        }
    } catch (emailError) {
        console.error('Email sending error:', emailError);
        emailStatus = 'Failed';
    }

    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully. Email sent to user.',
        data: {
            userId: user.id,
            User_Name: user.User_Name,
            email: user.Email_Id,
            emailStatus: emailStatus,
        }
    });
});

// Reset All Login Status - Admin function to clean up stuck Login_Status='Y'
const resetAllLoginStatus = asyncHandler(async (req, res) => {
    // Count users currently showing as logged in
    const beforeCount = await User_Details.count({
        where: {
            Login_Status: 'Y'
        }
    });
    
    // Update all users to Login_Status='N'
    const result = await User_Details.update(
        { Login_Status: 'N' },
        { 
            where: {
                Login_Status: 'Y'
            }
        }
    );
    
    const updatedCount = result[0]; // Number of rows updated
    
    res.status(200).json({
        status: 'success',
        message: `Reset login status for ${updatedCount} users`,
        data: {
            beforeCount,
            updatedCount
        }
    });
});

module.exports = {
    getAllUserData,
    getLoggedInUsers,
    createUserData,
    deleteUserData,
    addUpdateSubjectData,
    updateGeneralBioData,
    getAllUserDataError,
    updateFacultyRawFields,
    getAllUserRollData,
    createNavbarItem,
    updateNavbarItem,
    deleteNavbarItem,
    getAllRollMasters,
    resetAllLoginStatus,
    createRollMaster,
    updateRollMaster_Final,
    deleteRollMaster,
    updateUserRollAdmin,
    UpdaterollMaster,
    resetUserPassword
};
