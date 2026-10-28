const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/7pkfp2th6j";

function formatImageUrl(imagePath) {
    if (!imagePath) {
        return '/images/default-art.jpg';
    }
    const pathStr = String(imagePath).trim();
    if (!pathStr) {
        return '/images/default-art.jpg';
    }
    // Already full URL (ImageKit full URL or external)
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
        return pathStr;
    }
    // Local uploaded file
    if (pathStr.startsWith('/uploads/') || pathStr.startsWith('uploads/')) {
        return pathStr.startsWith('/') ? pathStr : '/' + pathStr;
    }
    // Local images folder
    if (pathStr.startsWith('/images/')) {
        return pathStr;
    }
    // Stored in ImageKit: prefix with ImageKit endpoint
    const cleanPath = pathStr.startsWith('/') ? pathStr.substring(1) : pathStr;
    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}`;
}

module.exports = { formatImageUrl, IMAGEKIT_URL_ENDPOINT };

