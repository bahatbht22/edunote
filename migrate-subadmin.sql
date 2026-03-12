-- Run this on Railway MySQL to add sub-admin support
-- Step 1: Add role and level_id columns to admins table
ALTER TABLE admins 
  ADD COLUMN role ENUM('super','sub') NOT NULL DEFAULT 'super' AFTER avatar,
  ADD COLUMN level_id INT NULL DEFAULT NULL AFTER role,
  ADD CONSTRAINT fk_admin_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;

-- Step 2: Make sure original admin is super
UPDATE admins SET role = 'super', level_id = NULL WHERE id = 1;
