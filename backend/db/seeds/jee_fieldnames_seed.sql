-- Insert field name mappings for JEE Marks Report
-- ex_code is the backend database field name
-- og_desc is the frontend display name

INSERT INTO jee_fieldnames (ex_code, og_desc, "createdAt", "updatedAt") VALUES
('Test_Code', 'Test_Code', NOW(), NOW()),
('BATCHNAME', 'District_Code', NOW(), NOW()),
('District_Name', 'District_Name', NOW(), NOW()),
('Candidate_Name', 'Candidate_Name', NOW(), NOW()),
('ROLLNO', 'Emis_No', NOW(), NOW()),
('TOTAL', 'Overall_Total', NOW(), NOW()),
('CORRECT', 'Overall_Correct', NOW(), NOW()),
('WRONG', 'Overall_Wrong', NOW(), NOW()),
('BLANK', 'Overall_Blank', NOW(), NOW()),
('Phy_C', 'Physics_Correct', NOW(), NOW()),
('Phy_W', 'Physics_Wrong', NOW(), NOW()),
('Phy_B', 'Physics_Blank', NOW(), NOW()),
('Che_C', 'Chemistry_Correct', NOW(), NOW()),
('Che_W', 'Chemistry_Wrong', NOW(), NOW()),
('Che_B', 'Chemistry_Blank', NOW(), NOW()),
('Mat_C', 'Maths_Correct', NOW(), NOW()),
('Mat_W', 'Maths_Wrong', NOW(), NOW()),
('Mat_B', 'Maths_Blank', NOW(), NOW()),
('Phy_Tot', 'Physics_Total', NOW(), NOW()),
('che_Tot', 'Chemistry_Total', NOW(), NOW()),
('Mat_Tot', 'Maths_Total', NOW(), NOW())
ON CONFLICT (ex_code) DO UPDATE SET
    og_desc = EXCLUDED.og_desc,
    "updatedAt" = NOW();
