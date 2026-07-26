const artModel = require('../models/artModel');
const artImageModel = require('../models/artImageModel');
const imagekit = require('../config/imagekit'); 
const db = require('../config/db');

exports.addArtImagePage = (req, res) => {
    artModel.getAllArts((err, arts) => {
        if (err) arts = [];

        const customReqQuery = `
            SELECT cr.request_id, u.name as customer_name 
            FROM custom_requests cr 
            LEFT JOIN user u ON cr.user_id = u.id 
            ORDER BY cr.request_id DESC
        `;
        db.query(customReqQuery, (reqErr, customRequests) => {
            if (reqErr) customRequests = [];
            res.render('artImage/addArtImage', { arts, customRequests: customRequests || [] });
        });
    });
};

exports.addArtImageAPI = (req, res) => {
    const category = req.body.category || 'Art';
    const art_id = req.body.art_id || null;
    const custom_request_id = req.body.custom_request_id || null;

    if (category === 'Art' && !art_id) {
        return res.json({ status: 'error', message: 'Please select an Art' });
    }
    if (category === 'Custom Art' && !custom_request_id) {
        return res.json({ status: 'error', message: 'Please select a Custom Art request' });
    }

    if (!req.files || req.files.length === 0) {
        return res.json({ status: 'error', message: 'Please select images' });
    }

    let completed = 0;

    req.files.forEach(file => {
        imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
            folder: '/admin/arts'
        }, (err, ikResponse) => {
            if (err) {
                return res.json({ status: 'error', message: err.message });
            }

            artImageModel.addArtImage(category, art_id, custom_request_id, ikResponse.url, ikResponse.fileId, (dbErr, result) => {
                completed++;

                if (dbErr) {
                    return res.json({ status: 'error', message: dbErr.message });
                }

                if (completed === req.files.length) {
                    res.json({ status: 'success', message: 'Images added successfully' });
                }
            });
        });
    });
};

exports.viewArtImagePage = (req, res) => {
    res.render('artImage/viewArtImage');
};

exports.getArtImagesAPI = (req, res) => {
    artImageModel.getAllArtImages((err, result) => {
        if (err) {
            return res.json({ status: 'error', message: err.message });
        }
        res.json({ status: 'success', data: result });
    });
};

exports.editArtImagePage = (req, res) => {
    artModel.getAllArts((err, arts) => {
        if (err) arts = [];

        const customReqQuery = `
            SELECT cr.request_id, u.name as customer_name 
            FROM custom_requests cr 
            LEFT JOIN user u ON cr.user_id = u.id 
            ORDER BY cr.request_id DESC
        `;
        db.query(customReqQuery, (reqErr, customRequests) => {
            if (reqErr) customRequests = [];
            res.render('artImage/editArtImage', { arts, customRequests: customRequests || [] });
        });
    });
};

exports.getSingleArtImageAPI = (req, res) => {
    const image_id = req.params.id;

    artImageModel.getArtImageById(image_id, (err, result) => {
        if (err) {
            return res.json({ status: 'error', message: err.message });
        }
        if (result.length === 0) {
            return res.json({ status: 'error', message: 'Image not found' });
        }
        res.json({ status: 'success', data: result[0] });
    });
};

exports.updateArtImageAPI = (req, res) => {
    const image_id = req.params.id;
    const category = req.body.category || 'Art';
    const art_id = req.body.art_id || null;
    const custom_request_id = req.body.custom_request_id || null;

    if (category === 'Art' && !art_id) {
        return res.json({ status: 'error', message: 'Please select an Art' });
    }
    if (category === 'Custom Art' && !custom_request_id) {
        return res.json({ status: 'error', message: 'Please select a Custom Art request' });
    }

    artImageModel.getArtImageById(image_id, (err, result) => {
        if (err || result.length === 0) {
            return res.json({ status: 'error', message: 'Image not found' });
        }

        const old_fileId = result[0].imagekit_file_id;

        if (req.file) {
            imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname,
                folder: '/admin/arts'
            }, (ikErr, ikResponse) => {
                if (ikErr) {
                    return res.json({ status: 'error', message: ikErr.message });
                }

                if (old_fileId) {
                    imagekit.deleteFile(old_fileId, (delErr) => {
                        if (delErr) console.log('Old ImageKit delete error:', delErr.message);
                    });
                }

                artImageModel.updateArtImage(image_id, category, art_id, custom_request_id, ikResponse.url, ikResponse.fileId, (dbErr) => {
                    if (dbErr) {
                        return res.json({ status: 'error', message: dbErr.message });
                    }
                    res.json({ status: 'success', message: 'Image updated successfully' });
                });
            });

        } else {
            artImageModel.updateArtImageWithoutFile(image_id, category, art_id, custom_request_id, (dbErr) => {
                if (dbErr) {
                    return res.json({ status: 'error', message: dbErr.message });
                }
                res.json({ status: 'success', message: 'Image updated successfully' });
            });
        }
    });
};

exports.deleteArtImageAPI = (req, res) => {
    const image_id = req.params.id;

    artImageModel.getArtImageById(image_id, (err, result) => {
        if (err || result.length === 0) {
            return res.json({ status: 'error', message: 'Image not found' });
        }

        const imagekit_file_id = result[0].imagekit_file_id;

        artImageModel.deleteArtImage(image_id, (err) => {
            if (err) {
                return res.json({ status: 'error', message: err.message });
            }

            if (imagekit_file_id) {
                imagekit.deleteFile(imagekit_file_id, (ikErr) => {
                    if (ikErr) {
                        return res.json({ status: 'error', message: 'DB deleted but ImageKit failed: ' + ikErr.message });
                    }
                    res.json({ status: 'success', message: 'Image deleted successfully' });
                });
            } else {
                res.json({ status: 'success', message: 'Image deleted successfully' });
            }
        });
    });
};