BEGIN;

ALTER TABLE "testMaster"
    ADD COLUMN IF NOT EXISTS "day" INTEGER;

SELECT setval(
    pg_get_serial_sequence('"testMaster"', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM "testMaster"), 1),
    EXISTS (SELECT 1 FROM "testMaster")
);

CREATE TEMP TABLE dv003_testmaster_update (
    testcode TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    testdate TEXT NOT NULL,
    sessions TEXT NOT NULL,
    no_of_ques TEXT,
    type_of_exam TEXT,
    std TEXT,
    exam_desc TEXT,
    test_name TEXT NOT NULL,
    test_districts TEXT NOT NULL,
    checkflg TEXT NOT NULL,
    img_upload TEXT NOT NULL,
    key_upload TEXT NOT NULL,
    percentile_gen TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO dv003_testmaster_update VALUES
    ('26J11DV003', 4, '01-10-2026', '2', '15', '001', '11', 'DAY 4', 'MODEL SCHOOL DAY 4 JEE CLASS 11', '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38', 'N', 'N', 'N', 'N'),
    ('26J12DV003', 4, '01-10-2026', '2', '15', '001', '12', 'DAY 4', 'MODEL SCHOOL DAY 4 JEE CLASS 12', '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38', 'N', 'N', 'N', 'N'),
    ('26N11DV003', 4, '01-10-2026', '2', '20', '002', '11', 'DAY 4', 'MODEL SCHOOL DAY 4 NEET CLASS 11', '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38', 'N', 'N', 'N', 'N'),
    ('26N12DV003', 4, '01-10-2026', '2', '20', '002', '12', 'DAY 4', 'MODEL SCHOOL DAY 4 NEET CLASS 12', '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38', 'N', 'N', 'N', 'N');

UPDATE "testMaster" AS target
SET
    "day" = source.day,
    testdate = source.testdate,
    sessions = source.sessions,
    no_of_ques = source.no_of_ques,
    type_of_exam = source.type_of_exam,
    std = source.std,
    exam_desc = source.exam_desc,
    flg = '',
    checkflg = source.checkflg,
    "Img_Upload" = source.img_upload,
    "Key_Upload" = source.key_upload,
    percentile_gen = source.percentile_gen,
    "Test_Name" = source.test_name,
    test_districts = source.test_districts,
    repeaters = 'N',
    "updatedAt" = NOW()
FROM dv003_testmaster_update AS source
WHERE target.testcode = source.testcode;

INSERT INTO "testMaster" (
    testcode,
    "day",
    testdate,
    sessions,
    no_of_ques,
    type_of_exam,
    std,
    exam_desc,
    flg,
    checkflg,
    "Img_Upload",
    "Key_Upload",
    percentile_gen,
    "Test_Name",
    test_districts,
    repeaters,
    "createdAt",
    "updatedAt"
)
SELECT
    source.testcode,
    source.day,
    source.testdate,
    source.sessions,
    source.no_of_ques,
    source.type_of_exam,
    source.std,
    source.exam_desc,
    '',
    source.checkflg,
    source.img_upload,
    source.key_upload,
    source.percentile_gen,
    source.test_name,
    source.test_districts,
    'N',
    NOW(),
    NOW()
FROM dv003_testmaster_update AS source
WHERE NOT EXISTS (
    SELECT 1 FROM "testMaster" AS target WHERE target.testcode = source.testcode
);

SELECT testcode, "day", testdate, sessions, type_of_exam, std, "Test_Name"
FROM "testMaster"
WHERE testcode IN ('26J11DV003', '26J12DV003', '26N11DV003', '26N12DV003')
ORDER BY testcode;

COMMIT;
