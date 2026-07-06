const db = require('../config/db');

const query1 = `
CREATE TABLE IF NOT EXISTS states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const query2 = `
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state_id INT NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);
`;

db.query(query1, (err, res) => {
    if (err) {
        console.error("Error creating states table:", err);
        process.exit();
    }
    console.log("States table created successfully!");
    
    db.query(query2, (err, res) => {
        if (err) {
            console.error("Error creating cities table:", err);
            process.exit();
        }
        console.log("Cities table created successfully!");
        process.exit();
    });
});
