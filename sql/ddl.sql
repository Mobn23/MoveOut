--
-- MoveOut data definition.
--

-- DROP TABLE IF EXISTS app_users;

CREATE TABLE app_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    password_hash VARCHAR(255) DEFAULT NULL,
    verification_token VARCHAR(255) DEFAULT NULL,
    `name` VARCHAR(25),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE NULL,
    `provider` ENUM('local', 'google') DEFAULT 'local',
    profile_picture VARCHAR(255) DEFAULT NULL,
    `role` ENUM('admin', 'user') DEFAULT 'user'
);

SHOW WARNINGS;

-- DROP TABLE IF EXISTS content_category;

CREATE TABLE content_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR (255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SHOW WARNINGS;

-- DROP TABLE IF EXISTS storage_boxes;

CREATE TABLE storage_boxes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    app_user_id INT,
    content_category_id INT,
    FOREIGN KEY (app_user_id) REFERENCES app_users(id),
    FOREIGN KEY (content_category_id) REFERENCES content_category(id)
);

SHOW WARNINGS;

CREATE INDEX idx_app_user_id ON storage_boxes(app_user_id);
CREATE INDEX idx_content_category_id ON storage_boxes(content_category_id);

-- DROP TABLE IF EXISTS labels_designs;

CREATE TABLE labels_designs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255),
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

SHOW WARNINGS;

-- DROP TABLE IF EXISTS boxes_labels;

CREATE TABLE boxes_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    storage_boxes_id INT UNIQUE,
    labels_designs_id INT,
    FOREIGN KEY (storage_boxes_id) REFERENCES storage_boxes(id),
    FOREIGN KEY (labels_designs_id) REFERENCES labels_designs(id)
);

CREATE INDEX idx_storage_boxes_id ON boxes_labels(storage_boxes_id);
CREATE INDEX idx_labels_designs_id ON boxes_labels(labels_designs_id);

SHOW WARNINGS;

-- DROP TABLE IF EXISTS combined_labels_with_qrcodes;

CREATE TABLE combined_labels_with_qrcodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    relative_combined_label_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    boxes_labels_id INT UNIQUE,
    FOREIGN KEY (boxes_labels_id) REFERENCES boxes_labels(id)
);

CREATE INDEX idx_boxes_labels_id ON combined_labels_with_qrcodes(boxes_labels_id);

SHOW WARNINGS;

-- DROP TABLE IF EXISTS boxes_content;

CREATE TABLE boxes_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text_content TEXT DEFAULT NULL,
    file_path TEXT DEFAULT NULL,
    original_name VARCHAR(255) DEFAULT NULL,
    file_type VARCHAR(100) DEFAULT NULL,
    file_size INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    storage_boxes_id INT,
    combined_labels_with_qrcodes_id INT,
    FOREIGN KEY (storage_boxes_id) REFERENCES storage_boxes(id),
    FOREIGN KEY (combined_labels_with_qrcodes_id) REFERENCES combined_labels_with_qrcodes(id)
);

-- indexes are like table of contenet that make the database go direct to the column of the index and to the foreign key instead of full-scan table.
CREATE INDEX idx_storage_boxes_id ON boxes_content(storage_boxes_id);
CREATE INDEX idx_combined_labels_with_qrcodes_id ON boxes_content(combined_labels_with_qrcodes_id);

SHOW WARNINGS;

CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    triggered_table_id TEXT, -- The table of the logs id. Here datatype TEXT cause i CONCAT ids with text.
    related_id TEXT, -- The ids related to the table of the logs. Here datatype TEXT cause i CONCAT ids with text.
    `action` VARCHAR(50), -- The type of action (INSERT, UPDATE, DELETE)
    affected_table VARCHAR(50), -- Which table was affected
    details TEXT, -- Any additional details (what fields were updated, etc.)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW WARNINGS;

-- IMPORTANT -> For a one-to-one relationship:
-- Unique Constraint: Use on the foreign key in one table to ensure that each record in this table corresponds to exactly one record in the related table.
-- Purpose: Prevents multiple records in the table from pointing to the same record in the related table, enforcing the one-to-one rule.
