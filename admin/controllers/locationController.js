const db = require('../config/db');

const locationController = {
    // ---- STATES ----
    getStatesPage: (req, res) => {
        if (!req.session.admin) return res.redirect('/admin/signin');
        
        db.query("SELECT * FROM states ORDER BY state_name ASC", (err, states) => {
            if (err) return res.status(500).send("Database Error");
            res.render('states', {
                admin: req.session.admin,
                title: 'Manage States',
                path: '/admin/locations/states',
                states: states
            });
        });
    },

    addState: (req, res) => {
        if (!req.session.admin) return res.status(401).json({ success: false });
        
        const { state_name } = req.body;
        db.query("INSERT INTO states (state_name) VALUES (?)", [state_name], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error adding state. Maybe it already exists.' });
            res.json({ success: true, message: 'State added successfully' });
        });
    },

    deleteState: (req, res) => {
        if (!req.session.admin) return res.status(401).json({ success: false });
        
        const { id } = req.params;
        db.query("DELETE FROM states WHERE id = ?", [id], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error deleting state. It may be linked to cities.' });
            res.json({ success: true, message: 'State deleted successfully' });
        });
    },

    // ---- CITIES ----
    getCitiesPage: (req, res) => {
        if (!req.session.admin) return res.redirect('/admin/signin');
        
        const query = `
            SELECT c.*, s.state_name 
            FROM cities c 
            JOIN states s ON c.state_id = s.id 
            ORDER BY s.state_name ASC, c.city_name ASC
        `;
        
        db.query(query, (err, cities) => {
            if (err) return res.status(500).send("Database Error");
            
            db.query("SELECT * FROM states ORDER BY state_name ASC", (err, states) => {
                if (err) return res.status(500).send("Database Error");
                
                res.render('cities', {
                    admin: req.session.admin,
                    title: 'Manage Cities',
                    path: '/admin/locations/cities',
                    cities: cities,
                    states: states
                });
            });
        });
    },

    addCity: (req, res) => {
        if (!req.session.admin) return res.status(401).json({ success: false });
        
        const { state_id, city_name } = req.body;
        db.query("INSERT INTO cities (state_id, city_name) VALUES (?, ?)", [state_id, city_name], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error adding city.' });
            res.json({ success: true, message: 'City added successfully' });
        });
    },

    deleteCity: (req, res) => {
        if (!req.session.admin) return res.status(401).json({ success: false });
        
        const { id } = req.params;
        db.query("DELETE FROM cities WHERE id = ?", [id], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error deleting city.' });
            res.json({ success: true, message: 'City deleted successfully' });
        });
    }
};

module.exports = locationController;
