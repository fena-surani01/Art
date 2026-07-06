const AttendanceModel = require('../models/attendanceModel');
const ArtistModel = require('../models/artistModel');

// Helper to format date to YYYY-MM-DD
const formatDate = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

exports.viewAttendance = (req, res) => {
    const admin = req.session.admin;
    const today = formatDate();
    const filterDate = req.query.date || today;

    if (admin.role === 'artist') {
        // Calculate week bounds
        const filterD = new Date(filterDate);
        const day = filterD.getDay();
        const diff = filterD.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(filterD.setDate(diff));
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            weekDates.push(formatDate(nextDay));
        }

        const startDate = weekDates[0];
        const endDate = weekDates[6];

        // Artist View: Get their attendance for the week
        AttendanceModel.getRecords({ artist_id: admin.id, start_date: startDate, end_date: endDate }, (err, records) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }
            
            // Transform records into a map
            const recordsMap = {};
            records.forEach(r => {
                recordsMap[formatDate(new Date(r.date))] = r;
            });

            // Build full week array
            const fullWeekRecords = weekDates.map(dateStr => {
                const todayStr = formatDate(new Date());
                let status = "Upcoming";
                if (dateStr < todayStr) status = "Absent"; // if past and no record, absent by default or W-OFF
                
                return recordsMap[dateStr] || {
                    date: dateStr,
                    status: status,
                    total_worked_seconds: 0
                };
            });
            
            AttendanceModel.getTodayAttendance(admin.id, (err, todayRecord) => {
                res.render('attendance', {
                    admin,
                    records: fullWeekRecords,
                    todayRecord,
                    filterDate
                });
            });
        });
    } else {
        // Admin View: Get overview and all records for the selected date
        AttendanceModel.getOverview(filterDate, (err, overview) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }
            
            AttendanceModel.getRecords({ date: filterDate }, (err, records) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database error");
                }
                
                // Get all artists to populate the "Mark Attendance" dropdown if needed
                ArtistModel.getAllArtist((err, artists) => {
                    res.render('attendance', {
                        admin,
                        records,
                        overview,
                        filterDate,
                        artists: artists || []
                    });
                });
            });
        });
    }
};

exports.checkIn = (req, res) => {
    const admin = req.session.admin;
    if (admin.role !== 'artist') return res.status(403).json({ success: false, message: "Only artists can check in." });

    AttendanceModel.checkIn(admin.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        if (result.alreadyCheckedIn) {
            return res.json({ success: false, message: "You have already checked in today." });
        }
        res.json({ success: true, message: "Checked in successfully!" });
    });
};

exports.checkOut = (req, res) => {
    const admin = req.session.admin;
    if (admin.role !== 'artist') return res.status(403).json({ success: false, message: "Only artists can check out." });

    AttendanceModel.checkOut(admin.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message || "Database error" });
        }
        if (result.alreadyCheckedOut) {
            return res.json({ success: false, message: "You have already checked out today." });
        }
        res.json({ success: true, message: "Checked out successfully!" });
    });
};

exports.adminUpdateStatus = (req, res) => {
    const admin = req.session.admin;
    if (admin.role === 'artist') return res.status(403).json({ success: false, message: "Unauthorized" });

    const { artist_id, date, status } = req.body;
    
    if (!artist_id || !date || !status) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    AttendanceModel.updateStatus(artist_id, date, status, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Attendance status updated!" });
    });
};

exports.requestLeave = (req, res) => {
    const admin = req.session.admin;
    if (admin.role !== 'artist') return res.status(403).json({ success: false, message: "Only artists can request leave." });
    
    const { type } = req.body;
    AttendanceModel.requestLeave(admin.id, type, (err) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        res.json({ success: true, message: "Status marked successfully!" });
    });
};

exports.getLiveStatus = (req, res) => {
    const admin = req.session.admin;
    if (admin.role !== 'artist') return res.status(403).json({ success: false });

    AttendanceModel.getTodayAttendance(admin.id, (err, record) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, record });
    });
};

exports.getArtistWeeklyData = (req, res) => {
    const admin = req.session.admin;
    if (admin.role !== 'artist') return res.status(403).json({ success: false });
    
    const filterDate = req.query.date || formatDate();
    const filterD = new Date(filterDate);
    const day = filterD.getDay();
    const diff = filterD.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(filterD.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        weekDates.push(formatDate(nextDay));
    }

    const startDate = weekDates[0];
    const endDate = weekDates[6];

    AttendanceModel.getRecords({ artist_id: admin.id, start_date: startDate, end_date: endDate }, (err, records) => {
        if (err) return res.status(500).json({ success: false });
        
        const recordsMap = {};
        records.forEach(r => recordsMap[formatDate(new Date(r.date))] = r);

        const fullWeekRecords = weekDates.map(dateStr => {
            const todayStr = formatDate(new Date());
            let status = "Upcoming";
            if (dateStr < todayStr) status = "Absent";
            return recordsMap[dateStr] || { date: dateStr, status: status, total_worked_seconds: 0 };
        });
        
        res.json({ success: true, records: fullWeekRecords });
    });
};

exports.getAdminDailyData = (req, res) => {
    const admin = req.session.admin;
    if (admin.role === 'artist') return res.status(403).json({ success: false });
    
    const filterDate = req.query.date || formatDate();
    
    AttendanceModel.getOverview(filterDate, (err, overview) => {
        if (err) return res.status(500).json({ success: false });
        AttendanceModel.getRecords({ date: filterDate }, (err, records) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, overview, records });
        });
    });
};
