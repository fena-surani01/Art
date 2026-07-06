const artModel = require('../models/artModel');
const artImageModel = require('../models/artImageModel');
const imagekit = require('../config/imagekit'); 
const fs = require('fs');
const path = require('path');


exports.addArtImagePage = (req, res) => {
    artModel.getAllArts((err, arts) => {
        if (err) {
            arts = [];
        }

        res.render('artImage/addArtImage', { arts });
    });
};

exports.addArtImageAPI = (req, res) => {
    const art_id = req.body.art_id;

    if (!art_id) {
        return res.json({ status: 'error', message: 'Please select art' });
    }

    if (!req.files || req.files.length === 0) {
        return res.json({ status: 'error', message: 'Please select images' });
    }

    let completed = 0;

    req.files.forEach(file => {
        // Upload to ImageKit instead of saving locally
        imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
            folder: '/admin/arts'
        }, (err, ikResponse) => {
            if (err) {
                return res.json({ status: 'error', message: err.message });
            }

            // Save ImageKit URL to DB instead of local path
            artImageModel.addArtImage(art_id, ikResponse.url, ikResponse.fileId, (dbErr, result) => {
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
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        res.json({
            status: 'success',
            data: result
        });
    });
};

exports.editArtImagePage = (req, res) => {
    artModel.getAllArts((err, arts) => {
        if (err) {
            arts = [];
        }

        res.render('artImage/editArtImage', { arts });
    });
};

exports.getSingleArtImageAPI = (req, res) => {
    const image_id = req.params.id;

    artImageModel.getArtImageById(image_id, (err, result) => {
        if (err) {
            return res.json({
                status: 'error',
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.json({
                status: 'error',
                message: 'Image not found'
            });
        }

        res.json({
            status: 'success',
            data: result[0]
        });
    });
};

exports.updateArtImageAPI = (req, res) => {
    const image_id = req.params.id;
    const art_id = req.body.art_id;

    if (!art_id) {
        return res.json({ status: 'error', message: 'Please select art' });
    }

    // First get old image record
    artImageModel.getArtImageById(image_id, (err, result) => {
        if (err || result.length === 0) {
            return res.json({ status: 'error', message: 'Image not found' });
        }

        const old_fileId = result[0].imagekit_file_id;

        if (req.file) {
            // Upload new image to ImageKit
            imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname,
                folder: '/admin/arts'
            }, (ikErr, ikResponse) => {
                if (ikErr) {
                    return res.json({ status: 'error', message: ikErr.message });
                }

                // Delete old image from ImageKit
                imagekit.deleteFile(old_fileId, (delErr) => {
                    if (delErr) {
                        console.log('Old ImageKit delete error:', delErr.message);
                    }
                });

                // Update DB with new URL and fileId
                artImageModel.updateArtImage(image_id, art_id, ikResponse.url, ikResponse.fileId, (dbErr) => {
                    if (dbErr) {
                        return res.json({ status: 'error', message: dbErr.message });
                    }

                    res.json({ status: 'success', message: 'Image updated successfully' });
                });
            });

        } else {
            // No new image — just update art_id
            artImageModel.updateArtImageWithoutFile(image_id, art_id, (dbErr) => {
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

        // console.log('ImageKit File ID to delete:', imagekit_file_id); // ← Add this

        artImageModel.deleteArtImage(image_id, (err) => {
            if (err) {
                return res.json({ status: 'error', message: err.message });
            }

            imagekit.deleteFile(imagekit_file_id, (ikErr, ikResult) => {
                // console.log('ImageKit delete error:', ikErr);   // ← Add this
                // console.log('ImageKit delete result:', ikResult); // ← Add this

                if (ikErr) {
                    return res.json({ status: 'error', message: 'DB deleted but ImageKit failed: ' + ikErr.message });
                }

                res.json({ status: 'success', message: 'Image deleted successfully' });
            });
        });
    });
};