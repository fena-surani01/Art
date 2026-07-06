    
        document.addEventListener('DOMContentLoaded', () => {
            const sizeSelect = document.getElementById('art_size');
            const formatRadios = document.querySelectorAll('input[name="format"]');
            const qtyInput = document.getElementById('qty');
            const priceDisplay = document.getElementById('estimatedPriceDisplay');
            const fileInput = document.getElementById('reference_image');
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            const form = document.getElementById('customArtForm');
            const submitBtn = document.getElementById('submitBtn');

            // File display logic
            fileInput.addEventListener('change', function() {
                if(this.files && this.files.length > 0) {
                    fileNameDisplay.style.display = 'block';
                    fileNameDisplay.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> ${this.files[0].name} attached`;
                    document.getElementById('fileUploadLabel').style.borderColor = '#198754';
                }
            });

            // Pricing Logic
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
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                


                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

                const formData = new FormData(form);

                try {
                    const response = await fetch('/api/custom-art/submit', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast('Custom Art Request Submitted Successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/user/orders'; // Redirect to see request
                        }, 2000);
                    } else {
                        showToast(data.message || 'Error submitting request', 'danger');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Submit Request <i class="bi bi-arrow-right ms-2"></i>';
                    }
                } catch (error) {
                    console.error("Error:", error);
                    showToast('Something went wrong', 'danger');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Request <i class="bi bi-arrow-right ms-2"></i>';
                }
            });

            function showToast(message, type) {
                const toastEl = document.getElementById('systemToast');
                const toastHeader = document.getElementById('toastHeader');
                const toastBody = document.getElementById('toastBody');
                const toastTitle = document.getElementById('toastTitle');

                toastHeader.className = `toast-header text-white bg-${type}`;
                toastTitle.innerText = type === 'success' ? 'Success' : 'Error';
                toastBody.innerText = message;

                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }

        });
    
