--
-- Logging triggers to capture DB activities.
--


DELIMITER $$

CREATE TRIGGER log_user_insertion
AFTER INSERT ON app_users
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('User id: ', NEW.id), 'No related ids (foreign keys)' ,'INSERT', 'app_users', CONCAT('New ', NEW.provider, ' user created: ', NEW.email));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_category_insertion
AFTER INSERT ON content_category
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Category id: ', NEW.id), 'No related ids (foreign keys)', 'INSERT', 'content_category', CONCAT('New category created: ', NEW.name));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_storage_boxes_insertion
AFTER INSERT ON storage_boxes
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Box id: ', NEW.id), CONCAT('app_user_id: ', NEW.app_user_id,', content_category_id: ', NEW.content_category_id),'INSERT', 'storage_boxes', 'New box created');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_labels_designs_insertion
AFTER INSERT ON labels_designs
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Label design id: ', NEW.id), 'No related ids (foreign keys)', 'INSERT', 'labels_designs', 'New label design created');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_boxes_labels_insertion
AFTER INSERT ON boxes_labels
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Label id: ', NEW.id), CONCAT('storage_boxes_id: ', NEW.storage_boxes_id,', labels_designs_id: ', NEW.labels_designs_id),'INSERT', 'boxes_labels', 'New Label created');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_combined_labels_with_qrcodes_insertion
AFTER INSERT ON combined_labels_with_qrcodes
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Combined label with QR code id: ', NEW.id), CONCAT('boxes_labels_id: ', NEW.boxes_labels_id),'INSERT', 'combined_labels_with_qrcodes', 'New Label with QR code combined');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_boxes_content_insertion
AFTER INSERT ON boxes_content
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Content id: ', NEW.id), 'Each file uploaded creates a record in content table so related ids are for the whole table not for each insertion','INSERT', 'boxes_content', CONCAT('New box content ', NEW.file_type ,' inserted'));
END $$

DELIMITER ;


-- Updating, deleting triggers
DELIMITER $$

CREATE TRIGGER log_user_update
AFTER UPDATE ON app_users
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('User id: ', NEW.id), 'No related ids (foreign keys)', 'UPDATE', 'app_users', 
        CONCAT('User updated - Old email: ', OLD.email, ', New email: ', NEW.email, 
               ', Old role: ', OLD.role, ', New role: ', NEW.role));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_category_update
AFTER UPDATE ON content_category
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Category id: ', NEW.id), 'No related ids (foreign keys)', 'UPDATE', 'content_category', 
        CONCAT('Category updated to: ', NEW.name));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_storage_boxes_update
AFTER UPDATE ON storage_boxes
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Box id: ', NEW.id), 
        CONCAT('app_user_id: ', NEW.app_user_id,', content_category_id: ', NEW.content_category_id),
        'UPDATE', 'storage_boxes', 'Box information updated');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_boxes_content_update
AFTER UPDATE ON boxes_content
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Content id: ', NEW.id), 
        CONCAT('storage_boxes_id: ', NEW.storage_boxes_id), 
        'UPDATE', 'boxes_content', 
        CONCAT('Content updated - Type: ', NEW.file_type));
END $$

DELIMITER ;

-- Delete triggers
DELIMITER $$

CREATE TRIGGER log_user_deletion
BEFORE DELETE ON app_users
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('User id: ', OLD.id), 'No related ids (foreign keys)', 'DELETE', 'app_users', 
        CONCAT('User deleted with all its data: ', OLD.email));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_category_deletion
BEFORE DELETE ON content_category
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Category id: ', OLD.id), 'No related ids (foreign keys)', 'DELETE', 'content_category', 
        CONCAT('Category deleted: ', OLD.name));
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_storage_boxes_deletion
BEFORE DELETE ON storage_boxes
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Box id: ', OLD.id), 
        CONCAT('app_user_id: ', OLD.app_user_id,', content_category_id: ', OLD.content_category_id),
        'DELETE', 'storage_boxes', 'Box deleted with all its data');
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER log_boxes_content_deletion
BEFORE DELETE ON boxes_content
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (triggered_table_id, related_id, `action`, affected_table, details)
    VALUES (CONCAT('Content id: ', OLD.id), 
        CONCAT('storage_boxes_id: ', OLD.storage_boxes_id),
        'DELETE', 'boxes_content', 
        CONCAT('Content deleted - Type: ', OLD.file_type));
END $$

DELIMITER ;