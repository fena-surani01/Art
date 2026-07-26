document.addEventListener("DOMContentLoaded", () => {
    // Add page setup
    if (document.getElementById("addArtImageForm")) {
        setupCategoryToggle();
        previewImages();
        addArtImages();
    }

    // View listing page setup
    if (document.getElementById("artImageTableBody")) {
        setupListingFilter();
        loadArtImages();
    }

    // Edit page setup
    if (document.getElementById("editArtImageForm")) {
        setupCategoryToggle();
        loadSingleArtImage();
        previewSingleImage();
        updateArtImage();
    }
});

function setupCategoryToggle() {
    const categorySelect = document.getElementById("category");
    const artSelectBox = document.getElementById("art_select_box");
    const customArtSelectBox = document.getElementById("custom_art_select_box");
    const artIdSelect = document.getElementById("art_id");
    const customReqSelect = document.getElementById("custom_request_id");

    if (!categorySelect) return;

    function handleCategoryChange() {
        const val = categorySelect.value;
        if (val === "Art") {
            if (artSelectBox) artSelectBox.style.display = "block";
            if (customArtSelectBox) customArtSelectBox.style.display = "none";
            if (customReqSelect) customReqSelect.value = "";
        } else if (val === "Custom Art") {
            if (customArtSelectBox) customArtSelectBox.style.display = "block";
            if (artSelectBox) artSelectBox.style.display = "none";
            if (artIdSelect) artIdSelect.value = "";
        } else {
            if (artSelectBox) artSelectBox.style.display = "none";
            if (customArtSelectBox) customArtSelectBox.style.display = "none";
            if (artIdSelect) artIdSelect.value = "";
            if (customReqSelect) customReqSelect.value = "";
        }
    }

    categorySelect.addEventListener("change", handleCategoryChange);
    // Initial trigger
    handleCategoryChange();
}

function previewImages() {
    const imagesInput = document.getElementById("images");
    const previewBox = document.getElementById("imagePreview");

    if (!imagesInput || !previewBox) return;

    imagesInput.addEventListener("change", function () {
        previewBox.innerHTML = "";
        const files = imagesInput.files;

        for (let i = 0; i < files.length; i++) {
            const imageUrl = URL.createObjectURL(files[i]);
            previewBox.innerHTML += `<img src="${imageUrl}" class="preview-img">`;
        }
    });
}

function addArtImages() {
    const form = document.getElementById("addArtImageForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const category = document.getElementById("category").value;
        if (!category) {
            if (window.showActionToast) window.showActionToast('add-img-err', 'Error', 'Please select an Art Category', 'bi-exclamation-triangle-fill', 'danger');
            return;
        }

        const formData = new FormData(form);
        const btn = form.querySelector(".submit-btn");

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Uploading...`;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/admin/api/art-image/add", true);

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            btn.disabled = false;
            btn.innerHTML = `Add Images`;

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('add-img', 'Success', response.message, 'bi-check-circle-fill', 'success');
                form.reset();
                document.getElementById("imagePreview").innerHTML = "";
                setupCategoryToggle();

                setTimeout(() => {
                    window.location.href = "/admin/art-image/view";
                }, 400);
            } else {
                if (window.showActionToast) window.showActionToast('add-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
            }
        };

        xhr.send(formData);
    });
}

let allArtImagesData = [];

function setupListingFilter() {
    const filterSelect = document.getElementById("categoryFilter");
    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            renderArtImagesTable(filterSelect.value);
        });
    }
}

function loadArtImages() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/admin/api/art-images", true);

    xhr.onload = function () {
        const response = JSON.parse(xhr.responseText);
        if (response.status === "success") {
            allArtImagesData = response.data || [];
            const filterVal = document.getElementById("categoryFilter") ? document.getElementById("categoryFilter").value : "All";
            renderArtImagesTable(filterVal);
        }
    };

    xhr.send();
}

function renderArtImagesTable(filter) {
    const tbody = document.getElementById("artImageTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let filteredData = allArtImagesData;
    if (filter === "Art") {
        filteredData = allArtImagesData.filter(img => img.category === "Art" || (!img.category && img.art_id));
    } else if (filter === "Custom Art") {
        filteredData = allArtImagesData.filter(img => img.category === "Custom Art" || img.custom_request_id);
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No images found for category "${filter}"
                </td>
            </tr>
        `;
        return;
    }

    filteredData.forEach((img, index) => {
        const isCustom = img.category === "Custom Art" || img.custom_request_id;
        const categoryBadge = isCustom 
            ? `<span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">Custom Art</span>`
            : `<span class="badge bg-primary px-3 py-2 rounded-pill fw-bold">Art</span>`;

        const titleText = isCustom 
            ? `REQ-${img.custom_request_id} - ${img.customer_name || 'Customer'}`
            : (img.art_title || 'Untitled Art');

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-secondary">#${img.image_id}</td>
                <td>${categoryBadge}</td>
                <td class="fw-bold text-dark">${titleText}</td>
                <td>
                    <img src="${img.image_path}" class="table-img shadow-sm border" style="border-radius: 8px;">
                </td>
                <td class="text-center">
                    <a href="/admin/art-image/edit/${img.image_id}" class="action-btn edit-btn" title="Edit">
                        <i class="bi bi-pencil-square"></i>
                    </a>
                    <button class="action-btn delete-btn" onclick="deleteArtImage(${img.image_id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function deleteArtImage(id) {
    showConfirmModal(
        "Delete Image", 
        "Are you sure you want to delete this image?", 
        "Delete", 
        "btn-danger", 
        function() {
            const xhr = new XMLHttpRequest();
            xhr.open("DELETE", "/admin/api/art-image/delete/" + id, true);
            xhr.onload = function () {
                const response = JSON.parse(xhr.responseText);
                if (response.status === "success") {
                    if (window.showActionToast) {
                        window.showActionToast('del-img', 'Success', response.message, 'bi-check-circle-fill', 'success');
                    }
                    loadArtImages();
                } else {
                    if (window.showActionToast) {
                        window.showActionToast('del-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                    }
                }
            };
            xhr.send();
        }
    );
}

function getImageIdFromUrl() {
    const urlParts = window.location.pathname.split("/");
    return urlParts[urlParts.length - 1];
}

function loadSingleArtImage() {
    const image_id = getImageIdFromUrl();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/admin/api/art-image/" + image_id, true);

    xhr.onload = function () {
        const response = JSON.parse(xhr.responseText);
        if (response.status === "success") {
            const data = response.data;
            document.getElementById("image_id").value = data.image_id;

            const categorySelect = document.getElementById("category");
            const catVal = data.category || (data.custom_request_id ? "Custom Art" : "Art");
            categorySelect.value = catVal;

            // Trigger change event to show correct dropdown
            categorySelect.dispatchEvent(new Event("change"));

            if (catVal === "Art" && data.art_id) {
                document.getElementById("art_id").value = data.art_id;
            } else if (catVal === "Custom Art" && data.custom_request_id) {
                document.getElementById("custom_request_id").value = data.custom_request_id;
            }

            document.getElementById("currentImage").src = data.image_path;
        } else {
            if (window.showActionToast) window.showActionToast('load-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
        }
    };

    xhr.send();
}

function previewSingleImage() {
    const imageInput = document.getElementById("image");
    const previewBox = document.getElementById("imagePreview");

    if (!imageInput || !previewBox) return;

    imageInput.addEventListener("change", function () {
        previewBox.innerHTML = "";
        if (imageInput.files.length > 0) {
            const imageUrl = URL.createObjectURL(imageInput.files[0]);
            previewBox.innerHTML = `<img src="${imageUrl}" class="preview-img">`;
        }
    });
}

function updateArtImage() {
    const form = document.getElementById("editArtImageForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const image_id = document.getElementById("image_id").value;
        const category = document.getElementById("category").value;
        if (!category) {
            if (window.showActionToast) window.showActionToast('upd-img-err', 'Error', 'Please select an Art Category', 'bi-exclamation-triangle-fill', 'danger');
            return;
        }

        const formData = new FormData(form);
        const btn = form.querySelector(".submit-btn");

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Updating...`;

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", "/admin/api/art-image/update/" + image_id, true);

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            btn.disabled = false;
            btn.innerHTML = `Update Image`;

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('upd-img', 'Success', response.message, 'bi-check-circle-fill', 'success');
                setTimeout(() => {
                    window.location.href = "/admin/art-image/view";
                }, 400);
            } else {
                if (window.showActionToast) window.showActionToast('upd-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
            }
        };

        xhr.send(formData);
    });
}