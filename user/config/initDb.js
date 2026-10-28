const db = require('./db');

const tables = [
    `CREATE TABLE IF NOT EXISTS states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        state_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        state_id INT NOT NULL,
        city_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS custom_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reference_image VARCHAR(255) DEFAULT NULL,
        description TEXT,
        size VARCHAR(50) DEFAULT NULL,
        format VARCHAR(50) DEFAULT NULL,
        qty INT DEFAULT 1,
        estimated_price DECIMAL(10,2) DEFAULT 0.00,
        imagekit_file_id VARCHAR(255) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        artist_status VARCHAR(50) DEFAULT 'Unassigned',
        assigned_artist_id INT DEFAULT NULL,
        show_in_gallery TINYINT(1) DEFAULT 0,
        customer_review TEXT DEFAULT NULL,
        rating DECIMAL(2,1) DEFAULT NULL,
        delivery_mail_sent TINYINT(1) DEFAULT 0,
        shipping_address TEXT DEFAULT NULL,
        shipping_city VARCHAR(100) DEFAULT NULL,
        shipping_state VARCHAR(100) DEFAULT NULL,
        shipping_zip VARCHAR(20) DEFAULT NULL,
        phone_number VARCHAR(20) DEFAULT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        shipping_address TEXT,
        shipping_city VARCHAR(100),
        shipping_state VARCHAR(100),
        shipping_zip VARCHAR(20),
        phone_number VARCHAR(20),
        payment_method VARCHAR(50) DEFAULT 'COD',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        delivered_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        art_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT DEFAULT NULL,
        art_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        rating DECIMAL(2,1) NOT NULL,
        comment TEXT,
        is_approved TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        art_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS returns (
        return_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        other_reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        estimated_pickup DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
];

const alterQueries = [
    "ALTER TABLE art_images MODIFY art_id INT NULL",
    "ALTER TABLE art_images ADD COLUMN custom_request_id INT NULL",
    "ALTER TABLE art_images ADD COLUMN category VARCHAR(50) DEFAULT 'Art'",
    "ALTER TABLE art_images ADD COLUMN imagekit_file_id VARCHAR(255) NULL",
    "ALTER TABLE user ADD COLUMN phone_number VARCHAR(20) NULL",
    "ALTER TABLE user ADD COLUMN address TEXT NULL",
    "ALTER TABLE user ADD COLUMN city VARCHAR(100) NULL",
    "ALTER TABLE user ADD COLUMN state VARCHAR(100) NULL",
    "ALTER TABLE user ADD COLUMN zip_code VARCHAR(20) NULL"
];

function initTables(callback) {
    let index = 0;

    function runNextTable() {
        if (index < tables.length) {
            const query = tables[index];
            index++;
            db.query(query, (err) => {
                if (err) console.error("Init table warning:", err.message);
                runNextTable();
            });
        } else {
            runAlters();
        }
    }

    let alterIdx = 0;
    function runAlters() {
        if (alterIdx < alterQueries.length) {
            const query = alterQueries[alterIdx];
            alterIdx++;
            db.query(query, () => {
                // Ignore duplicate column errors or syntax differences
                runAlters();
            });
        } else {
            console.log("Database schema initialized successfully.");
            if (callback) callback();
        }
    }

    runNextTable();
}

module.exports = { initTables };

