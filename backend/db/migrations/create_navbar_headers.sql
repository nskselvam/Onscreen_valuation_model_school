-- ============================================================
-- Manual SQL: Create Navbar_headers table (PostgreSQL)
-- Auto-increment ID with SERIAL as Primary Key
-- ============================================================

-- Step 1: Create ENUM types (required by PostgreSQL)
DO $$ BEGIN
    CREATE TYPE "enum_Navbar_headers_user_Type" AS ENUM ('1', '2', '3');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_Navbar_headers_Nav_Status" AS ENUM ('active', 'inactive', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create Navbar_headers table
CREATE TABLE IF NOT EXISTS "Navbar_headers" (
    "id"                              SERIAL          PRIMARY KEY,
    "Nav_Main_Header_Name"            VARCHAR(100)    NOT NULL,
    "Nav_Main_Header_Name_Description" TEXT           DEFAULT NULL,
    "Nav_Header_1"                    INTEGER         NOT NULL DEFAULT 0,
    "Nav_Header_2"                    INTEGER         NOT NULL DEFAULT 0,
    "Nav_Header_3"                    INTEGER         NOT NULL DEFAULT 0,
    "Nav_Header_4"                    INTEGER         NOT NULL DEFAULT 0,
    "user_Type"                       "enum_Navbar_headers_user_Type"   NOT NULL,
    "user_Role"                       INTEGER         NOT NULL DEFAULT 0,
    "Nav_Status"                      "enum_Navbar_headers_Nav_Status"  NOT NULL DEFAULT 'active',
    "Nav_Icons"                       TEXT            DEFAULT NULL,
    "route_path"                      VARCHAR(200)    DEFAULT NULL,
    "createdAt"                       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"                       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Step 3: Reset sequence to start from 1 (if needed)
-- SELECT setval(pg_get_serial_sequence('"Navbar_headers"', 'id'), 1, false);

-- ============================================================
-- To run this script:
-- psql -U <username> -d <database_name> -f create_navbar_headers.sql
-- ============================================================
