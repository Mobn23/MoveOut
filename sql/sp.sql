--
-- Moveout DB procedures.
--

-- DROP PROCEDURE IF EXISTS insert_user;

DELIMITER $$

CREATE PROCEDURE insert_user(
    IN p_form_email VARCHAR(255),
    IN p_form_hashed_password VARCHAR(255),
    IN p_registering_verification_token VARCHAR(255),
    IN p_form_username VARCHAR(25),
    IN p_google_id VARCHAR(255),
    IN p_provider ENUM('local', 'google'),
    IN p_profile_picture VARCHAR(255)
)
BEGIN
    DECLARE user_count INT;

    -- Count how many users are in the table
    SELECT COUNT(*) INTO user_count FROM app_users;

    -- Insert user with 'admin' role if it is the first user, otherwise assign 'user' role
    IF user_count = 0 THEN
        INSERT INTO app_users(
            email, password_hash, verification_token, `name`,
            google_id, `provider`, profile_picture, `role`)
        VALUES(p_form_email, p_form_hashed_password, p_registering_verification_token,
            p_form_username, p_google_id, p_provider, p_profile_picture, 'admin');

    ELSE
        INSERT INTO app_users (
            email, password_hash, verification_token, `name`,
            google_id, `provider`, profile_picture, `role`
        )
        VALUES (p_form_email, p_form_hashed_password, p_registering_verification_token,
            p_form_username, p_google_id, p_provider, p_profile_picture, 'user');
    END IF;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE verify_user_by_token(
    IN p_verification_token VARCHAR(255)
)
BEGIN
    UPDATE app_users
    SET verified = TRUE, verification_token = NULL, updated_at = NOW()
    WHERE verification_token = p_verification_token;

    SELECT verified
    FROM app_users
    WHERE verification_token = p_verification_token;
END $$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE get_user_by_email(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT id, password_hash, `name`, `role`
    FROM app_users
    WHERE email = p_email;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE insert_category(
    IN p_name VARCHAR(255)
)
BEGIN
    INSERT INTO content_category (`name`) 
    VALUES (p_name);

    SELECT LAST_INSERT_ID() AS category_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_labels_designs()
BEGIN
    SELECT * FROM labels_designs;
END $$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE insert_storage_boxes(
    IN p_app_user_id INT,
    IN p_content_category_id INT
)
BEGIN
    INSERT INTO storage_boxes (app_user_id, content_category_id)
    VALUES (p_app_user_id, p_content_category_id);

    SELECT LAST_INSERT_ID() AS storage_box_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE insert_label(
    IN p_storage_boxes_id INT,
    IN p_labels_designs_id INT
)
BEGIN
    INSERT INTO boxes_labels (storage_boxes_id, labels_designs_id) 
    VALUES (p_storage_boxes_id, p_labels_designs_id);

    SELECT LAST_INSERT_ID() AS label_id;
END $$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE get_label_path_by_id(
    IN p_label_design_id INT
)
BEGIN
    SELECT image_path
    FROM labels_designs
    WHERE id = p_label_design_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE insert_to_combined_labels_with_qrcodes(
    IN p_relative_combined_label_path TEXT,
    IN p_boxes_labels_id INT
)
BEGIN
    INSERT INTO combined_labels_with_qrcodes (relative_combined_label_path, boxes_labels_id) 
    VALUES (p_relative_combined_label_path, p_boxes_labels_id);

    SELECT LAST_INSERT_ID() AS combined_label_with_qrcode_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE insert_to_boxes_content(
    IN p_text_content TEXT,
    IN p_file_path TEXT,
    IN p_original_name VARCHAR(255),
    IN p_file_type VARCHAR(100),
    IN p_file_size INT,
    IN p_storage_boxes_id INT,
    IN p_combined_labels_with_qrcodes_id INT
)
BEGIN
    INSERT INTO boxes_content (text_content, file_path, original_name, file_type, file_size, storage_boxes_id, combined_labels_with_qrcodes_id) 
    VALUES (p_text_content, p_file_path, p_original_name, p_file_type, p_file_size, p_storage_boxes_id, p_combined_labels_with_qrcodes_id);

    SELECT LAST_INSERT_ID() AS boxes_content_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_storage_boxes(
    IN p_app_user_id INT
)
BEGIN
    SELECT 
        sb.id AS box_id,
        cc.name AS category_name,
        lwc.relative_combined_label_path AS label_with_qr_path
    FROM 
        storage_boxes sb
    JOIN 
        content_category cc ON sb.content_category_id = cc.id
    LEFT JOIN
        boxes_labels bl ON sb.id = bl.storage_boxes_id
    LEFT JOIN
        combined_labels_with_qrcodes lwc ON bl.id = lwc.boxes_labels_id
    WHERE 
        sb.app_user_id = p_app_user_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE insert_google_user_data(
    IN p_email VARCHAR(255),
    IN p_name VARCHAR(25),
    IN p_verified BOOLEAN,
    IN p_google_id VARCHAR(255),
    IN p_provider ENUM('local', 'google'),
    IN p_profile_picture VARCHAR(255)
)
BEGIN
    INSERT INTO app_users (email, `name`, verified, google_id, `provider`, profile_picture) 
    VALUES (p_email, p_name, p_verified, p_google_id, p_provider,p_profile_picture);

    SELECT LAST_INSERT_ID() AS google_user_id;
END $$

DELIMITER ;

DELIMITER //

CREATE PROCEDURE delete_box_by_id(IN p_box_id INT)
BEGIN
    -- Start the transaction
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback the transaction if any error occurs
        ROLLBACK;
    END;

    -- Start a new transaction
    START TRANSACTION;

    -- Delete the combined labels with QR codes
    DELETE FROM combined_labels_with_qrcodes 
    WHERE boxes_labels_id IN (
        SELECT id FROM boxes_labels WHERE storage_boxes_id = p_box_id
    );

    -- Delete the box content
    DELETE FROM boxes_content WHERE storage_boxes_id = p_box_id;

    -- Delete the associated labels
    DELETE FROM boxes_labels WHERE storage_boxes_id = p_box_id;

    -- Finally, delete the storage box itself
    DELETE FROM storage_boxes WHERE id = p_box_id;

    -- Delete the associated labels
    DELETE FROM content_category WHERE id = p_box_id;

    -- Commit the transaction
    COMMIT;
END //

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_box_content(
    IN p_box_id INT
)
BEGIN
    SELECT 
        bc.id AS boxes_content_id,
        bc.text_content AS boxes_content_text,
        bc.file_path AS boxes_content_file_path,
        bc.original_name AS boxes_content_orginal_name,
        bc.file_type AS boxes_content_file_type,
        bc.file_size AS boxes_content_file_size,
        bc.storage_boxes_id AS storage_boxes_id,
        bc.combined_labels_with_qrcodes_id AS combined_lable_img_id,
        cc.name As category_name,
        cc.id AS category_id
    FROM 
        boxes_content bc
    JOIN
        content_category cc ON bc.storage_boxes_id = cc.id
    WHERE 
        bc.storage_boxes_id = p_box_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE get_label_data_by_storage_box_id(
    IN p_storage_box_id INT
)
BEGIN
    SELECT id, labels_designs_id
    FROM boxes_labels
    WHERE storage_boxes_id = p_storage_box_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE get_combined_label_with_qrcode_data_by_label_id(
    IN p_label_id INT
)
BEGIN
    SELECT id, relative_combined_label_path, created_at, boxes_labels_id
    FROM combined_labels_with_qrcodes
    WHERE boxes_labels_id = p_label_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE update_content_category(
    IN p_storage_box_id INT,
    IN p_updated_category VARCHAR (255)
)
BEGIN
    UPDATE content_category
    SET `name` = p_updated_category
    WHERE id = p_storage_box_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_whole_logs_table()
BEGIN
    SELECT *
    FROM activity_logs;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_all_users()
BEGIN
    SELECT *
    FROM app_users;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_all_labels()
BEGIN
    SELECT *
    FROM boxes_labels;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_all_categories()
BEGIN
    SELECT *
    FROM content_category;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE display_all_content()
BEGIN
    SELECT *
    FROM boxes_content;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE make_user_admin( IN p_user_id INT )
BEGIN
    UPDATE app_users
    SET `role` = 'admin'
    WHERE id = p_user_id;
END $$

DELIMITER ;


DELIMITER //

CREATE PROCEDURE delete_user_cascade(IN p_user_id INT)
BEGIN
    -- Declare variables to handle errors
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An error occurred while deleting the user and related data';
    END;

    -- Start transaction
    START TRANSACTION;

    -- First, we need to get all storage_boxes_ids associated with this user
    -- We'll store them in a temporary table for reference
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_storage_boxes 
    SELECT id, content_category_id FROM storage_boxes WHERE app_user_id = p_user_id;

    -- Delete entries from boxes_content
    -- This needs to happen first because it references both storage_boxes and combined_labels_with_qrcodes
    DELETE FROM boxes_content 
    WHERE storage_boxes_id IN (SELECT id FROM temp_storage_boxes);

    -- Delete from combined_labels_with_qrcodes
    -- This needs to happen before boxes_labels because it references boxes_labels
    DELETE FROM combined_labels_with_qrcodes 
    WHERE boxes_labels_id IN (
        SELECT id FROM boxes_labels 
        WHERE storage_boxes_id IN (SELECT id FROM temp_storage_boxes)
    );

    -- Delete from boxes_labels
    DELETE FROM boxes_labels 
    WHERE storage_boxes_id IN (SELECT id FROM temp_storage_boxes);

    -- Delete from storage_boxes
    -- This will also delete the references to content_category
    DELETE FROM storage_boxes 
    WHERE app_user_id = p_user_id;

    -- Now, delete categories that are not referenced by any other boxes
    DELETE FROM content_category 
    WHERE id IN (
        SELECT content_category_id 
        FROM temp_storage_boxes 
        WHERE content_category_id IS NOT NULL
        GROUP BY content_category_id
        HAVING COUNT(*) = 1
    );

    -- Now we can safely delete the user
    DELETE FROM app_users 
    WHERE id = p_user_id;

    -- Drop the temporary table
    DROP TEMPORARY TABLE IF EXISTS temp_storage_boxes;

    -- If everything succeeded, commit the transaction
    COMMIT;
END //

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE delete_piece_of_content(
    IN p_content_id INT
)
BEGIN
    DELETE FROM boxes_content
    WHERE id = p_content_id;
END $$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE return_role_status(
    IN p_user_id INT
)
BEGIN
    SELECT `role`
    FROM app_users
    WHERE id = p_user_id;
END $$

DELIMITER ;
