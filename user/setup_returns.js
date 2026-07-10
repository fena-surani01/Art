const db = require('./config/db');

const query = `
    CREATE TABLE IF NOT EXISTS returns (
        return_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        other_reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        estimated_pickup DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

db.query(query, (err, result) => {
    if (err) {
        console.error("Error creating table:", err);
    } else {
        console.log("Table 'returns' created successfully!");
    }
    process.exit(0);
});
