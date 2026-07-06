document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('art-action-container');
    if (!container) return;

    const artId = parseInt(container.getAttribute('data-art-id'));
    const stock = parseInt(container.getAttribute('data-stock'));

    // Fetch user cart item IDs
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

    if (stock > 0) {
        if (cartItemIds.includes(artId)) {
            container.innerHTML = `
                <button class="btn btn-success w-100 py-3 fs-5 mt-3 fw-semibold shadow-sm" onclick="window.location.href='/user/cart'">
                    <i class="bi bi-bag-check-fill me-2"></i> Go to Bag
                </button>
            `;
        } else {
            container.innerHTML = `
                <button id="add-btn-${artId}" class="btn art-btn w-100 py-3 fs-5 mt-3 fw-semibold shadow-sm" onclick="addToCart(${artId})">
                    <i class="bi bi-cart-plus me-2"></i> Add To Basket
                </button>
            `;
        }
    } else {
        container.innerHTML = `
            <button class="btn btn-secondary w-100 py-3 fs-5 mt-3 fw-semibold shadow-sm" disabled>
                <i class="bi bi-slash-circle me-2"></i> Out of Stock
            </button>
        `;
    }
});

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
                btn.innerHTML = '<i class="bi bi-bag-check-fill me-2"></i> Go to Bag';
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
