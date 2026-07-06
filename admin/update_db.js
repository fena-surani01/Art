const db = require('./config/db');

const query = `
ALTER TABLE custom_requests
ADD COLUMN shipping_address text DEFAULT NULL,
ADD COLUMN shipping_city varchar(100) DEFAULT NULL,
ADD COLUMN shipping_state varchar(100) DEFAULT NULL,
ADD COLUMN shipping_zip varchar(20) DEFAULT NULL,
ADD COLUMN phone_number varchar(20) DEFAULT NULL,
ADD COLUMN payment_method varchar(50) DEFAULT 'COD',
ADD COLUMN payment_status varchar(50) DEFAULT 'Pending';
`;

db.query(query, (err, res) => {
    if (err) console.log(err);
    else console.log("Added columns successfully!");
    process.exit();
});
