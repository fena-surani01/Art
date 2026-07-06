import re

def update_customArt_ejs():
    file_path = '/var/www/html/Fena_Art/ART (2)/ART/user/views/customArt.ejs'
    
    with open(file_path, 'r') as f:
        content = f.read()

    new_form_structure = '''                    <!-- Progress Indicator -->
                    <div class="d-flex justify-content-between align-items-center mb-5 position-relative">
                        <div class="position-absolute top-50 start-0 end-0 translate-middle-y bg-light" style="height: 4px; z-index: 1;">
                            <div id="progressBar" class="bg-dark" style="height: 100%; width: 0%; transition: 0.3s;"></div>
                        </div>
                        
                        <div class="position-relative z-index-2 bg-white px-2">
                            <button type="button" class="btn btn-dark rounded-circle shadow-sm step-btn" style="width:40px;height:40px;" id="btnStep1">1</button>
                            <div class="small fw-bold mt-1 text-center text-dark">Details</div>
                        </div>
                        <div class="position-relative z-index-2 bg-white px-2">
                            <button type="button" class="btn btn-light border rounded-circle shadow-sm step-btn" style="width:40px;height:40px;" id="btnStep2">2</button>
                            <div class="small fw-bold mt-1 text-center text-muted">Shipping</div>
                        </div>
                        <div class="position-relative z-index-2 bg-white px-2">
                            <button type="button" class="btn btn-light border rounded-circle shadow-sm step-btn" style="width:40px;height:40px;" id="btnStep3">3</button>
                            <div class="small fw-bold mt-1 text-center text-muted">Review</div>
                        </div>
                    </div>

                    <form id="customArtForm" enctype="multipart/form-data" novalidate>
                        
                        <!-- STEP 1: Order Details -->
                        <div id="step1">
                            <h3 class="fw-bold mb-4 border-bottom pb-3">Order Details</h3>'''
    
    content = re.sub(r'                    <form id="customArtForm" enctype="multipart/form-data" novalidate>\s*<h3 class="fw-bold mb-4 border-bottom pb-3">Order Details</h3>', new_form_structure, content)

    new_submit_structure = '''                        <!-- Price Estimation & Next -->
                        <div class="row align-items-center bg-light p-4 rounded-4">
                            <div class="col-md-6 mb-3 mb-md-0 text-center text-md-start">
                                <div class="text-muted fw-bold text-uppercase small letter-spacing-1">Estimated Base Price</div>
                                <div class="price-value" id="estimatedPriceDisplay">₹0</div>
                                <small class="text-secondary">*Final price may vary based on complexity</small>
                            </div>
                            <div class="col-md-6 text-center text-md-end">
                                <button type="button" class="btn btn-dark btn-lg px-5 py-3 rounded-pill fw-bold shadow" id="nextToStep2Btn">
                                    Proceed to Shipping <i class="bi bi-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </div>
                        </div> <!-- End Step 1 -->

                        <!-- STEP 2: Shipping Details -->
                        <div id="step2" style="display: none;">
                            <h3 class="fw-bold mb-4 border-bottom pb-3">Shipping & Contact</h3>
                            
                            <div class="mb-4">
                                <label class="form-label">Delivery Address (Required)</label>
                                <textarea class="form-control form-control-lg" name="shipping_address" id="shipping_address" rows="3" placeholder="Enter full address" required><%= user ? user.address : '' %></textarea>
                            </div>
                            <div class="row g-4 mb-4">
                                <div class="col-md-4">
                                    <label class="form-label">State (Required)</label>
                                    <select class="form-select form-select-lg" name="shipping_state" id="shipping_state" required>
                                        <option value="" disabled selected>Select a State...</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">City (Required)</label>
                                    <select class="form-select form-select-lg" name="shipping_city" id="shipping_city" required disabled>
                                        <option value="" disabled selected>Select a City...</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">ZIP/PIN Code (Required)</label>
                                    <input type="text" class="form-control form-control-lg" name="shipping_zip" id="shipping_zip" required>
                                </div>
                            </div>
                            <div class="mb-5">
                                <label class="form-label">Phone Number (Required)</label>
                                <input type="tel" class="form-control form-control-lg" name="phone_number" id="phone_number" placeholder="+91 XXXXX XXXXX" required value="<%= user ? user.phone : '' %>">
                            </div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button type="button" class="btn btn-outline-secondary btn-lg rounded-pill px-4" id="backToStep1Btn">
                                    <i class="bi bi-arrow-left me-2"></i> Back
                                </button>
                                <button type="button" class="btn btn-dark btn-lg px-5 py-3 rounded-pill fw-bold shadow" id="nextToStep3Btn">
                                    Review Order <i class="bi bi-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </div> <!-- End Step 2 -->

                        <!-- STEP 3: Review & Payment -->
                        <div id="step3" style="display: none;">
                            <h3 class="fw-bold mb-4 border-bottom pb-3">Review & Payment</h3>
                            
                            <div class="card bg-light border-0 rounded-4 mb-4">
                                <div class="card-body p-4">
                                    <h5 class="fw-bold mb-3">Order Summary</h5>
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="text-secondary">Base Artwork Price</span>
                                        <span class="fw-bold" id="reviewBasePrice">₹0</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-3 border-bottom pb-3">
                                        <span class="text-secondary">Shipping & Handling</span>
                                        <span class="fw-bold" id="reviewShippingFee">₹0</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="fs-5 fw-bold">Total Estimated Amount</span>
                                        <span class="fs-3 fw-bold text-dark" id="reviewTotalPrice">₹0</span>
                                    </div>
                                    <div class="small text-muted mt-2 text-end">*Subject to artist confirmation</div>
                                </div>
                            </div>

                            <div class="mb-5">
                                <h5 class="fw-bold mb-3">Select Payment Method</h5>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="w-100">
                                            <input type="radio" name="payment_method" value="Card" class="format-radio" checked required>
                                            <div class="format-card text-start px-4 py-3">
                                                <div class="d-flex align-items-center">
                                                    <i class="bi bi-credit-card-2-front fs-3 me-3 text-primary"></i>
                                                    <div>
                                                        <div class="fw-bold">Credit/Debit Card</div>
                                                        <div class="small text-muted">Pay securely online</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="w-100">
                                            <input type="radio" name="payment_method" value="COD" class="format-radio" required>
                                            <div class="format-card text-start px-4 py-3">
                                                <div class="d-flex align-items-center">
                                                    <i class="bi bi-cash-stack fs-3 me-3 text-success"></i>
                                                    <div>
                                                        <div class="fw-bold">Cash on Delivery</div>
                                                        <div class="small text-muted">Pay when delivered</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button type="button" class="btn btn-outline-secondary btn-lg rounded-pill px-4" id="backToStep2Btn">
                                    <i class="bi bi-arrow-left me-2"></i> Back
                                </button>
                                <button type="submit" class="btn btn-dark btn-lg px-5 py-3 rounded-pill fw-bold shadow" id="submitBtn">
                                    Confirm & Pay <i class="bi bi-check2-circle ms-2"></i>
                                </button>
                            </div>
                        </div> <!-- End Step 3 -->'''

    content = re.sub(r'                        <!-- Price Estimation & Submit -->.*?</div>\s*</div>\s*</div>', new_submit_structure, content, flags=re.DOTALL)

    new_script = '''// Pricing Logic
            let globalFinalPrice = 0;
            let globalShippingFee = 0;
            const calculatePrice = () => {
                const size = sizeSelect.value;
                const formatEl = document.querySelector('input[name="format"]:checked');
                const qty = parseInt(qtyInput.value) || 1;
                
                if (!size || !formatEl) {
                    priceDisplay.innerText = '₹0';
                    return;
                }
                
                const format = formatEl.value;
                
                // Base pricing based on Format
                let basePrice = format === 'Color' ? 2000 : 1000;
                
                // Size Multiplier
                let sizeMultiplier = 1;
                if (size === 'A3') sizeMultiplier = 1.5;
                if (size === 'A2') sizeMultiplier = 2.0;

                // Final calculation
                const finalPrice = (basePrice * sizeMultiplier) * qty;
                globalFinalPrice = finalPrice;
                
                priceDisplay.innerText = '₹' + finalPrice.toLocaleString('en-IN');
            };

            sizeSelect.addEventListener('change', calculatePrice);
            qtyInput.addEventListener('input', calculatePrice);
            formatRadios.forEach(r => r.addEventListener('change', calculatePrice));

            // Location Dropdown Logic
            let customCitiesData = [];
            
            fetch('/api/locations')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const stateSelect = document.getElementById('shipping_state');
                    customCitiesData = data.cities;
                    
                    data.states.forEach(state => {
                        const option = document.createElement('option');
                        option.value = state.state_name;
                        option.textContent = state.state_name;
                        option.dataset.id = state.id;
                        stateSelect.appendChild(option);
                    });
                }
            })
            .catch(console.error);
            
            document.getElementById('shipping_state').addEventListener('change', function() {
                const stateId = this.options[this.selectedIndex].dataset.id;
                const citySelect = document.getElementById('shipping_city');
                citySelect.innerHTML = '<option value="" disabled selected>Select a City...</option>';
                citySelect.disabled = false;
                
                const filteredCities = customCitiesData.filter(c => c.state_id == stateId);
                filteredCities.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.city_name;
                    option.textContent = city.city_name;
                    citySelect.appendChild(option);
                });
            });

            // Wizard Logic
            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');
            const btnStep1 = document.getElementById('btnStep1');
            const btnStep2 = document.getElementById('btnStep2');
            const btnStep3 = document.getElementById('btnStep3');
            const progressBar = document.getElementById('progressBar');

            document.getElementById('nextToStep2Btn').addEventListener('click', () => {
                const img = document.getElementById('reference_image');
                if (!img.files || img.files.length === 0) return showToast('Please upload a reference image.', 'danger');
                if (!sizeSelect.value) return showToast('Please select an artwork size.', 'danger');
                if (!qtyInput.value || qtyInput.value < 1) return showToast('Please enter a valid number of subjects.', 'danger');
                if (!document.querySelector('input[name="format"]:checked')) return showToast('Please select an artwork style.', 'danger');
                if (!document.getElementById('description').value.trim()) return showToast('Please provide special instructions.', 'danger');
                
                step1.style.display = 'none';
                step2.style.display = 'block';
                progressBar.style.width = '50%';
                btnStep2.classList.remove('btn-light', 'border');
                btnStep2.classList.add('btn-dark');
                btnStep2.nextElementSibling.classList.remove('text-muted');
                btnStep2.nextElementSibling.classList.add('text-dark');
            });

            document.getElementById('backToStep1Btn').addEventListener('click', () => {
                step2.style.display = 'none';
                step1.style.display = 'block';
                progressBar.style.width = '0%';
                btnStep2.classList.remove('btn-dark');
                btnStep2.classList.add('btn-light', 'border');
                btnStep2.nextElementSibling.classList.remove('text-dark');
                btnStep2.nextElementSibling.classList.add('text-muted');
            });

            document.getElementById('nextToStep3Btn').addEventListener('click', () => {
                if (!document.getElementById('shipping_address').value.trim() || 
                    !document.getElementById('shipping_city').value.trim() || 
                    !document.getElementById('shipping_state').value.trim() || 
                    !document.getElementById('shipping_zip').value.trim() || 
                    !document.getElementById('phone_number').value.trim()) {
                    return showToast('Please fill in all shipping details.', 'danger');
                }

                // Update Review values
                globalShippingFee = (globalFinalPrice > 0 && globalFinalPrice <= 1000) ? 100 : 0;
                document.getElementById('reviewBasePrice').innerText = '₹' + globalFinalPrice.toLocaleString('en-IN');
                document.getElementById('reviewShippingFee').innerText = '₹' + globalShippingFee.toLocaleString('en-IN');
                document.getElementById('reviewTotalPrice').innerText = '₹' + (globalFinalPrice + globalShippingFee).toLocaleString('en-IN');

                step2.style.display = 'none';
                step3.style.display = 'block';
                progressBar.style.width = '100%';
                btnStep3.classList.remove('btn-light', 'border');
                btnStep3.classList.add('btn-dark');
                btnStep3.nextElementSibling.classList.remove('text-muted');
                btnStep3.nextElementSibling.classList.add('text-dark');
            });

            document.getElementById('backToStep2Btn').addEventListener('click', () => {
                step3.style.display = 'none';
                step2.style.display = 'block';
                progressBar.style.width = '50%';
                btnStep3.classList.remove('btn-dark');
                btnStep3.classList.add('btn-light', 'border');
                btnStep3.nextElementSibling.classList.remove('text-dark');
                btnStep3.nextElementSibling.classList.add('text-muted');
            });

            // Form Submission
            form.addEventListener('submit', async (e) => {'''

    content = re.sub(r'// Pricing Logic.*?(?=// Form Submission)', new_script, content, flags=re.DOTALL)

    content = re.sub(r'                // --- Validation ---.*?// -------------------', '', content, flags=re.DOTALL)

    with open(file_path, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    update_customArt_ejs()
    print("Done")
