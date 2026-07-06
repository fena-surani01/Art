document.addEventListener('DOMContentLoaded', () => {
    loadArts();
    loadReviews();
})

// Fetch Approved Reviews
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews/approved');
        const data = await response.json();
        
        if (data.success && data.reviews && data.reviews.length > 0) {
            document.getElementById('reviewsSection').style.display = 'block';
            let html = '';
            
            data.reviews.forEach(review => {
                let stars = '';
                for(let i=1; i<=5; i++) {
                    stars += `<i class="bi bi-star-fill ${i <= review.rating ? 'text-warning' : 'text-muted opacity-25'}"></i>`;
                }
                
                html += `
                <div class="col-lg-4 col-md-6">
                    <div class="card h-100 border-0 shadow-sm rounded-4 p-4" style="background: linear-gradient(145deg, #ffffff, #fdfdfd);">
                        <div class="d-flex align-items-center mb-3">
                            <img src="${review.art_image || '/images/default-art.jpg'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;" class="shadow-sm me-3">
                            <div>
                                <h6 class="fw-bold mb-0">${review.customer_name}</h6>
                                <small class="text-muted">on ${review.art_title}</small>
                            </div>
                        </div>
                        <div class="mb-3">${stars}</div>
                        <p class="text-dark mb-0 mt-2" style="font-family: 'Caveat', cursive; font-size: 1.7rem; line-height: 1.2;">"${review.comment}"</p>
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

       <div class="col-lg-4 col-md-6 mb-4">

            <div class="art-card position-relative overflow-hidden" style="${art.stock <= 0 ? 'border-top: 4px solid #dc3545; filter: grayscale(0.3); opacity: 0.9;' : ''}">

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

                <div class="art-info">

                    <span class="art-category">
                        ${art.category}
                    </span>

                    <h5 class="art-title">
                        <a href="/user/art/${art.art_id}" class="text-decoration-none text-dark">${art.title}</a>
                    </h5>

                    <p class="art-artist">
                        By ${art.artist_name}
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