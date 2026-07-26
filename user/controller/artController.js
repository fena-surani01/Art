const artModel  =  require('../models/artModel')

const getArts = (req, res) => {

    artModel.getAllArts((err, result) => {

        if(err){
            return res.status(500).json(err);
        }

        const artsMap = {};

        result.forEach(row => {

            if(!artsMap[row.art_id]){

                artsMap[row.art_id] = {
                    art_id: row.art_id,
                    title: row.title,
                    category: row.category,
                    artist_name: row.artist_name,
                    description: row.description,
                    price: row.price,
                    rating: row.calculated_rating ? parseFloat(row.calculated_rating).toFixed(1) : (row.rating || 0),
                    review_count: row.review_count || 0,
                    stock: row.stock,
                    art_size: row.art_size,
                    art_type: row.art_type,
                    images:[]
                };
            }

            if(row.image_path){
                artsMap[row.art_id].images.push(row.image_path);
            }

        });

        const artsArray = Object.values(artsMap);

        // Randomize sequence so art cards appear in a different order on every load
        for (let i = artsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [artsArray[i], artsArray[j]] = [artsArray[j], artsArray[i]];
        }

        res.json(artsArray);

    });

};

const viewArtDetailsPage = (req, res) => {
    const artId = req.params.id;
    artModel.getArtByIdWithImages(artId, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        if (results.length === 0) {
            return res.status(404).send("Artwork not found");
        }

        const artData = {
            art_id: results[0].art_id,
            title: results[0].title,
            description: results[0].description,
            category: results[0].category,
            artist_name: results[0].artist_name,
            price: results[0].price,
            rating: results[0].calculated_rating ? parseFloat(results[0].calculated_rating).toFixed(1) : (results[0].rating || 0),
            total_reviews: results[0].review_count || 0,
            stock: results[0].stock,
            art_size: results[0].art_size,
            art_type: results[0].art_type,
            images: []
        };

        results.forEach(row => {
            if (row.image_path) {
                artData.images.push(row.image_path);
            }
        });

        if (artData.images.length === 0) {
            artData.images.push('/images/default-art.jpg');
        }

        // Fetch Approved Reviews for this Art
        const reviewsQuery = `
            SELECT r.rating, r.comment, r.created_at, u.name as customer_name
            FROM reviews r
            JOIN user u ON r.user_id = u.id
            WHERE r.art_id = ? AND r.is_approved = 1
            ORDER BY r.created_at DESC
        `;
        require('../config/db').query(reviewsQuery, [artId], (err, reviews) => {
            if (err) console.error("Error fetching reviews for art details:", err);
            
            res.render('artDetails', {
                art: artData,
                reviews: reviews || [],
                user: req.session.user
            });
        });
    });
};

module.exports = {
    getArts,
    viewArtDetailsPage
}