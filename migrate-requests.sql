-- Migration: add combination change requests + level images
-- Run once on Railway MySQL

-- 1. Add image_url to levels table
ALTER TABLE levels ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER color;

-- 2. Create combination change requests table
CREATE TABLE IF NOT EXISTS combo_requests (
  id INT NOT NULL AUTO_INCREMENT,
  sub_admin_id INT NOT NULL,
  level_id INT NOT NULL,
  combo_id INT NOT NULL,
  request_type ENUM('edit','delete') NOT NULL DEFAULT 'edit',
  requested_data JSON NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (sub_admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
  FOREIGN KEY (combo_id) REFERENCES combinations(id) ON DELETE CASCADE
);
