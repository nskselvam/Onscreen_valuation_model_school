BEGIN;

-- Keep inserts aligned with the current highest user ID.
SELECT setval(
    '"user_details_id_seq1"'::regclass,
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM user_details), 1),
    EXISTS (SELECT 1 FROM user_details)
);

CREATE TEMP TABLE camp_teacher_fix (
    teacher_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    district_code TEXT NOT NULL,
    examiner_subcode TEXT NOT NULL,
    temp_password TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO camp_teacher_fix
    (teacher_name, mobile, district_code, examiner_subcode, temp_password)
VALUES
    ('SELLADURAI G',       '8526105987', '32', 'CHEMISTRYJ11_02,CHEMISTRYN11_08,CHEMISTRY_02', 'Ms@S8K2Q5'),
    ('DAYANA JULIET M',    '9994545549', '22', 'MATHSJ12_06,MATHS_03',                         'Ms@D9J4L7'),
    ('RAJASEKAR',          '9750374092', '06', 'CHEMISTRYN12_11,CHEMISTRY_02',                 'Ms@R7C3P8'),
    ('SEETHALAKSHMI',      '7092294512', '05', 'PHYSICSJ12_04,PHYSICS_01',                     'Ms@S7P5N2'),
    ('SASIKUMAR R',        '9043432758', '26', 'PHYSICSJ12_04,PHYSICS_01',                     'Ms@S9V4K6'),
    ('ARTHI',              '9790500907', '26', 'CHEMISTRYN12_11,CHEMISTRY_02',                 'Ms@A8C2M7'),
    ('AMBIKA D',           '7010142560', '01', 'BIOLOGYN11_09,BIOLOGY_04',                     'Ms@A7B5Q9'),
    ('KANMANI K',          '8012629380', '01', 'MATHSJ11_03,MATHS_03',                         'Ms@K8M3R6'),
    ('MARISELVAM',         '8508153652', '24', 'BIOLOGYN12_12,BIOLOGY_04',                     'Ms@M7B2N8'),
    ('DURAI S',            '9952189087', '24', 'BIOLOGYN11_09,BIOLOGY_04',                     'Ms@D8Z4P6'),
    ('VEDIYAPPAN',         '9543234118', '13', 'PHYSICSJ12_04,PHYSICS_01',                     'Ms@V7P3K9'),
    ('BALAJI I',           '9600801058', '13', 'BIOLOGYN11_09,BIOLOGY_04',                     'Ms@B8N5R2'),
    ('SATHIYAVANI S',      '9626727794', '13', 'BIOLOGYN11_09,BIOLOGY_04',                     'Ms@S6B4Q8'),
    ('LOGALAKSHMI',        '8838539028', '13', 'PHYSICSJ11_01,PHYSICSN11_07,PHYSICS_01',       'Ms@L9P2V7'),
    ('SAGADEVAN',          '9095269005', '13', 'BIOLOGYN11_09,BIOLOGY_04',                     'Ms@S8B3M5'),
    ('MURUGANANDAM R',     '8883609066', '29', 'PHYSICSJ12_04,PHYSICS_01',                     'Ms@M6P4R9'),
    ('MURALITHARAN R',     '9786609208', '18', 'MATHSJ11_03,MATHS_03',                         'Ms@M8J2Q6'),
    ('NAJUMMUN NISHA S',   '8056391405', '29', 'PHYSICSN12_10,PHYSICS_01',                     'Ms@N7P5C3'),
    ('JAMEER BASHA F',     '8675161681', '01', 'PHYSICSJ11_01,PHYSICSN11_07,PHYSICS_01',       'Ms@J9P4V2');

-- Reset and correct accounts that already exist. Match by mobile first so
-- interchanged names are restored to the correct contact number while the
-- existing staff-code User_Id remains unchanged for valuation history.
WITH matched AS (
    SELECT DISTINCT ON (f.mobile)
        f.*,
        u.id AS user_id
    FROM camp_teacher_fix f
    JOIN user_details u
      ON u."Mobile_Number" = f.mobile
      OR u."User_Id" = f.mobile
    ORDER BY
        f.mobile,
        CASE WHEN u."Mobile_Number" = f.mobile THEN 0 ELSE 1 END,
        u.id
)
UPDATE user_details u
SET
    "User_Name" = m.teacher_name,
    "Mobile_Number" = m.mobile,
    "D_Code" = m.district_code,
    "Role" = '11',
    "Password" = NULL,
    "Temp_Password" = m.temp_password,
    "ResetPass" = 'N',
    "Email_Id" = COALESCE(NULLIF(u."Email_Id", ''), m.mobile || '@modelschool.local'),
    activestatus = 'Active',
    "Login_Status" = 'N',
    examiner_subcode = m.examiner_subcode,
    "updatedAt" = NOW()
FROM matched m
WHERE u.id = m.user_id;

-- Create accounts that do not exist. The mobile number becomes the login ID.
INSERT INTO user_details (
    "User_Id",
    "User_Name",
    "Mobile_Number",
    "D_Code",
    "Role",
    "Password",
    "Temp_Password",
    "ResetPass",
    "Email_Id",
    activestatus,
    "Login_Status",
    examiner_subcode,
    "createdAt",
    "updatedAt"
)
SELECT
    f.mobile,
    f.teacher_name,
    f.mobile,
    f.district_code,
    '11',
    NULL,
    f.temp_password,
    'N',
    f.mobile || '@modelschool.local',
    'Active',
    'N',
    f.examiner_subcode,
    NOW(),
    NOW()
FROM camp_teacher_fix f
WHERE NOT EXISTS (
    SELECT 1
    FROM user_details u
    WHERE u."Mobile_Number" = f.mobile
       OR u."User_Id" = f.mobile
);

-- Return the credentials to distribute. Existing staff-code IDs are retained;
-- newly created users receive their mobile number as User_Id.
SELECT
    u."User_Id" AS login_id,
    f.teacher_name,
    f.mobile,
    f.temp_password,
    f.district_code,
    f.examiner_subcode,
    u."ResetPass",
    u.activestatus
FROM camp_teacher_fix f
JOIN LATERAL (
    SELECT u.*
    FROM user_details u
    WHERE u."Mobile_Number" = f.mobile
       OR u."User_Id" = f.mobile
    ORDER BY
        CASE WHEN u."Mobile_Number" = f.mobile THEN 0 ELSE 1 END,
        u.id
    LIMIT 1
) u ON TRUE
ORDER BY f.teacher_name;

COMMIT;

-- Workbook rows 22 and 23 were intentionally skipped because Teacher Name,
-- Contact Number, and issue details are missing.