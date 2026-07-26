document.addEventListener('DOMContentLoaded', () => {
    loadArts();
    loadReviews();
})

// Fetch Approved Reviews (Grouped per Art, 2 cards per row)
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews/approved');
        const data = await response.json();
        
        if (data.success && data.reviews && data.reviews.length > 0) {
            // Randomize reviews sequence on every page load
            for (let i = data.reviews.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [data.reviews[i], data.reviews[j]] = [data.reviews[j], data.reviews[i]];
            }

            document.getElementById('reviewsSection').style.display = 'block';
            let html = '';
            
            data.reviews.forEach(art => {
                let starsHtml = '';
                const roundedRating = Math.round(Number(art.avg_rating));
                for (let i = 1; i <= 5; i++) {
                    starsHtml += `<i class="bi bi-star-fill ${i <= roundedRating ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
                }

                let commentsHtml = '';
                art.comments.forEach(c => {
                    let commentStars = '';
                    for (let i = 1; i <= 5; i++) {
                        commentStars += `<i class="bi bi-star-fill ${i <= c.rating ? 'text-warning' : 'text-muted opacity-25'}" style="font-size: 0.8rem;"></i>`;
                    }
                    
                    commentsHtml += `
                    <div class="p-3 mb-2 rounded-3 bg-light border">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold text-dark small"><i class="bi bi-person-circle me-1 text-secondary"></i>${c.customer_name}</span>
                            <div>${commentStars}</div>
                        </div>
                        <p class="text-secondary mb-0 small fst-italic" style="font-family: 'Inter', sans-serif;">"${c.comment}"</p>
                    </div>
                    `;
                });
                
                html += `
                <div class="col-md-6 col-lg-6">
                    <div class="card shadow-sm rounded-4 p-4 h-100" style="background: #ffffff; border: none !important; border-top: 5px solid #DDCEF5 !important; min-height: 290px;">
                        
                        <!-- First Row: Image and Art Name -->
                        <div class="d-flex align-items-center mb-3">
                            <a href="/user/art/${art.art_id}" class="me-3 flex-shrink-0 text-decoration-none">
                                <img src="${art.art_image || '/images/default-art.jpg'}" 
                                     alt="${art.art_title}" 
                                     class="rounded-3 shadow-sm" 
                                     style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;">
                            </a>
                            <div class="flex-grow-1">
                                <h5 class="fw-bold mb-1">
                                    <a href="/user/art/${art.art_id}" class="text-dark text-decoration-none">
                                        ${art.art_title}
                                    </a>
                                </h5>
                                <a href="/user/art/${art.art_id}" class="btn btn-sm btn-outline-dark rounded-pill px-3 py-1 mt-1" style="font-size: 0.8rem;">
                                    <i class="bi bi-eye me-1"></i> View Details
                                </a>
                            </div>
                        </div>

                        <!-- Star Rating & Review Count -->
                        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <div class="text-warning fs-5">${starsHtml}</div>
                            <span class="fw-bold text-dark fs-6">${art.avg_rating} / 5</span>
                            <span class="text-muted small">(${art.review_count} ${art.review_count === 1 ? 'Review' : 'Reviews'})</span>
                        </div>

                        <!-- Scrollable Comments Section -->
                        <div class="comments-scroll-area flex-grow-1 pe-1" style="max-height: 180px; overflow-y: auto;">
                            ${commentsHtml}
                        </div>

                    </div>
                </div>
                `;
            });
            
            document.getElementById('reviewsContainer').innerHTML = html;
        }
    } catch (e) {
        console.error("Error loading reviews", e);
    }
}

// Art Cards
async function loadArts() {
    const response = await fetch('/api/arts')
    const arts = await response.json()

    // Randomize sequence of art cards on page load
    for (let i = arts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arts[i], arts[j]] = [arts[j], arts[i]];
    }

    let cartItemIds = [];
    try {
        const cartResponse = await fetch('/api/cart/items');
        const cartData = await cartResponse.json();
        if (cartData.success) {
            cartItemIds = cartData.artIds;
        }
    } catch (e) {
        console.error(e);
    }

    let html = '';

    arts.forEach(art => {
        html += `

       <div class="col-xl-3 col-lg-3 col-md-6 mb-4">

            <div class="art-card position-relative overflow-hidden" style="border: none !important; ${art.stock <= 0 ? 'border-top: 4px solid #dc3545 !important; filter: grayscale(0.3); opacity: 0.9;' : 'border-top: 4px solid #000000 !important;'}">

                ${art.stock <= 0 ? `
                    <div class="position-absolute top-0 end-0 bg-danger text-white px-3 py-1 fw-bold shadow-sm" style="z-index: 10; border-bottom-left-radius: 8px; font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase;">
                        Sold Out !
                    </div>
                ` : ''}

                <div class="art-image-wrapper position-relative">

                   <div id="carousel-${art.art_id}" class="carousel slide">
                        
                        <div class="carousel-indicators">

                            ${art.images.map((_, index) => `
                                <button
                                    type="button"
                                    data-bs-target="#carousel-${art.art_id}"
                                    data-bs-slide-to="${index}"
                                    class="${index === 0 ? 'active' : ''}"
                                    aria-label="Slide ${index + 1}">
                                </button>
                            `).join('')}

                        </div>

                            <div class="carousel-inner">

                                ${art.images.map((img, index) => `

                                    <div class="carousel-item ${index === 0 ? 'active' : ''}">

                                        <a href="/user/art/${art.art_id}">
                                            <img
                                                src="${img}"
                                                class="d-block w-100 art-image"
                                            >
                                        </a>

                                    </div>

                                `).join('')}

                            </div>

                            <button class="carousel-btn prev-btn"
                                    type="button"
                                    data-bs-target="#carousel-${art.art_id}"
                                    data-bs-slide="prev">
                                ❮
                            </button>

                            <button class="carousel-btn next-btn"
                                    type="button"
                                    data-bs-target="#carousel-${art.art_id}"
                                    data-bs-slide="next">
                                ❯
                            </button>
                        </div>

                </div>

                <div class="art-info p-3">

                    <span class="badge bg-dark rounded-pill px-3 py-1 mb-2 d-inline-block" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${art.category}
                    </span>

                    <h5 class="art-title fw-bold mb-1">
                        <a href="/user/art/${art.art_id}" class="text-decoration-none text-dark">${art.title}</a>
                    </h5>

                    <p class="art-artist text-muted small mb-2">
                        By <span class="fw-semibold text-dark">${art.artist_name}</span>
                    </p>

                    <p class="art-description text-secondary small mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; height: 2.8em;">
                        ${art.description || 'Authentic handcrafted masterpiece.'}
                    </p>

                    <div class="d-flex justify-content-between align-items-center">

                        <span class="art-price">
                            ₹${art.price}
                        </span>

                        <span class="art-rating" style="font-size: 0.95rem;">
                            ⭐ ${art.rating} 
                            <span class="text-muted ms-1" style="font-size: 0.8rem;">(${art.review_count} ${art.review_count === 1 ? 'Review' : 'Reviews'})</span>
                        </span>

                    </div>

                    ${art.stock > 0 ?
                (cartItemIds.includes(art.art_id) ?
                    `<button class="btn btn-success w-100 mt-3" onclick="window.location.href='/user/cart'">
                                Go to Bag
                            </button>`
                    :
                    `<button id="add-btn-${art.art_id}" class="btn art-btn w-100 mt-3" onclick="addToCart(${art.art_id})">
                                Add To Basket
                            </button>`)
                :
                `<button class="btn btn-outline-danger w-100 mt-3 fw-bold" style="border-width: 2px;" disabled>
                            Out of Stock
                        </button>`
            }

                </div>

            </div>

        </div>

        `
    });

    document.getElementById('artContainer').innerHTML = html

}

async function addToCart(artId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ artId })
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            if (typeof updateCartCount === 'function') updateCartCount();

            const btn = document.getElementById(`add-btn-${artId}`);
            if (btn) {
                btn.classList.remove('art-btn');
                btn.classList.add('btn-success');
                btn.innerText = 'Go to Bag';
                btn.onclick = () => window.location.href = '/user/cart';
            }
        } else {
            if (response.status === 401) {
                window.location.href = '/user/signin';
            } else {
                showToast(data.message || 'Failed to add item to basket', 'danger');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong', 'danger');
    }
}

function showToast(message, type) {
    const toastEl = document.getElementById('cartToast');
    if (!toastEl) return;

    const toastHeader = document.getElementById('toastHeader');
    const toastBody = document.getElementById('toastBody');
    const toastTitle = document.getElementById('toastTitle');

    toastHeader.className = `toast-header text-white bg-${type}`;
    toastTitle.innerText = type === 'success' ? 'Success' : 'Error';
    toastBody.innerText = message;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}