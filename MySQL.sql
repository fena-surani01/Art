CREATE TABLE art_images(

    image_id INT PRIMARY KEY AUTO_INCREMENT,

    art_id INT NOT NULL,

    image_path VARCHAR(255) NOT NULL,

    FOREIGN KEY (art_id)
    REFERENCES arts(art_id)
    ON DELETE CASCADE

);

CREATE TABLE arts(
    art_id INT PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    art_type VARCHAR(100),

    artist_name VARCHAR(150),

    price DECIMAL(10,2),

    art_size VARCHAR(50),

    image VARCHAR(255),

    rating DECIMAL(2,1) DEFAULT 4.5,

    total_reviews INT DEFAULT 0,

    stock INT DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);