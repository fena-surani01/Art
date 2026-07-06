async function removeFromCart(cartId, price, currentQty) {
    if (!confirm('Are you sure you want to remove this item from your basket?')) {
        return;
    }

    try {
        const response = await fetch(`/api/cart/${cartId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            // Remove the DOM element with fade out
            const itemEl = document.getElementById(`cart-item-${cartId}`);
            if (itemEl) {
                itemEl.style.transition = 'opacity 0.5s ease';
                itemEl.style.opacity = '0';
                setTimeout(() => {
                    itemEl.remove();
                    updateCartTotals(price, currentQty, 'remove');
                }, 500);
            }
            if (typeof updateCartCount === 'function') updateCartCount();
        } else {
            alert(data.message || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong');
    }
}

async function updateQty(cartId, newQty, stock, price) {
    if (newQty < 1) return;
    if (newQty > stock) {
        showToast('Maximum stock reached for this item', 'danger');
        return;
    }

    const currentQtyInput = document.getElementById(`qty-input-${cartId}`);
    const oldQty = parseInt(currentQtyInput.value);

    try {
        const response = await fetch(`/api/cart/${cartId}/quantity`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: newQty })
        });
        const data = await response.json();

        if (data.success) {
            // Update input
            currentQtyInput.value = newQty;
            
            // Update individual item price
            document.getElementById(`price-${cartId}`).innerText = (price * newQty).toFixed(2);
            
            // Disable/Enable buttons
            const minusBtn = document.getElementById(`minus-btn-${cartId}`);
            const plusBtn = document.getElementById(`plus-btn-${cartId}`);
            
            if (minusBtn) {
                minusBtn.disabled = (newQty <= 1);
                minusBtn.setAttribute('onclick', `updateQty(${cartId}, ${newQty - 1}, ${stock}, ${price})`);
            }
            if (plusBtn) {
                plusBtn.disabled = false; // Always enabled to show max stock alert
                plusBtn.setAttribute('onclick', `updateQty(${cartId}, ${newQty + 1}, ${stock}, ${price})`);
            }

            // Update Totals
            const qtyDiff = newQty - oldQty;
            updateCartTotals(price, qtyDiff, 'update');
            if (typeof updateCartCount === 'function') updateCartCount();
        } else {
            alert(data.message || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong');
    }
}

function updateCartTotals(price, qtyDiff, action) {
    const subtotalEl = document.getElementById('cart-subtotal');
    let currentSubtotal = parseFloat(subtotalEl.innerText);
    
    let diff = price * qtyDiff;
    if (action === 'remove') {
        diff = -(price * qtyDiff);
    }
    
    let newSubtotal = currentSubtotal + diff;
    if (newSubtotal < 0) newSubtotal = 0;
    
    subtotalEl.innerText = newSubtotal.toFixed(2);
    
    // Check if cart is empty based on new subtotal and DOM elements
    const remainingItems = document.querySelectorAll('.card.mb-3.shadow-sm').length;
    if (remainingItems === 0 || newSubtotal === 0) {
        // Show empty cart UI
        document.querySelector('.col-lg-8').innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x text-muted" style="font-size: 4rem;"></i>
                <h4 class="mt-3">Your basket is empty!</h4>
                <a href="/user/home" class="btn art-btn mt-3">Continue Shopping</a>
            </div>
        `;
        document.getElementById('checkout-btn').disabled = true;
        
        const deliverySec = document.getElementById('delivery-section');
        if (deliverySec) deliverySec.style.display = 'none';
        
        newSubtotal = 0;
    }
    
    // Update Shipping
    let shipping = 0;
    const shippingContainer = document.getElementById('cart-shipping-container');
    if (newSubtotal > 0 && newSubtotal <= 1000) {
        shipping = 100;
        shippingContainer.innerHTML = `₹<span id="cart-shipping">${shipping.toFixed(2)}</span>`;
    } else {
        shipping = 0;
        shippingContainer.innerHTML = `<span class="text-success" id="cart-shipping-free">Free</span>`;
    }
    
    // Update Final Total
    const finalTotal = newSubtotal + shipping;
    document.getElementById('cart-final-total').innerText = finalTotal.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    const deliveryEl = document.getElementById('delivery-date');
    if (deliveryEl) {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        const options = { month: 'short', day: 'numeric' };
        deliveryEl.innerText = date.toLocaleDateString('en-US', options);
    }
});

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
