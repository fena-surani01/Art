const { initTables } = require('./user/config/initDb');

console.log("Setting up all required database tables...");
initTables(() => {
    console.log("All tables verified and created successfully!");
    process.exit(0);
});

