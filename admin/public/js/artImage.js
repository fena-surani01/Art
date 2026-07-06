document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("addArtImageForm")) {
        previewImages();
        addArtImages();
    }
});

function previewImages() {
    const imagesInput = document.getElementById("images");
    const previewBox = document.getElementById("imagePreview");

    imagesInput.addEventListener("change", function () {
        previewBox.innerHTML = "";

        const files = imagesInput.files;

        for (let i = 0; i < files.length; i++) {
            const imageUrl = URL.createObjectURL(files[i]);

            previewBox.innerHTML += `
                <img src="${imageUrl}" class="preview-img">
            `;
        }
    });
}

function addArtImages() {
    document.getElementById("addArtImageForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const form = document.getElementById("addArtImageForm");
        const formData = new FormData(form);
        const btn = form.querySelector(".submit-btn");

        // Disable button + show loading
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Uploading...`;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/admin/api/art-image/add", true);

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            const msg = document.getElementById("imageMessage");

            // Re-enable button
            btn.disabled = false;
            btn.innerHTML = `Add Images`;

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('add-img', 'Success', response.message, 'bi-check-circle-fill', 'success');
                msg.innerHTML = '';
                form.reset();
                document.getElementById("imagePreview").innerHTML = "";

                setTimeout(() => {
                    window.location.href = "/admin/art-image/view";
                }, 400);
            } else {
                if (window.showActionToast) window.showActionToast('add-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                msg.innerHTML = '';
            }
        };

        xhr.send(formData);
    });
}
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("artImageTableBody")) {
        loadArtImages();
    }

    if (document.getElementById("editArtImageForm")) {
        loadSingleArtImage();
        previewSingleImage();
        updateArtImage();
    }

});

function loadArtImages() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", "/admin/api/art-images", true);

    xhr.onload = function () {
        const response = JSON.parse(xhr.responseText);
        const tbody = document.getElementById("artImageTableBody");

        tbody.innerHTML = "";

        if (response.status === "success") {

            if (response.data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No images found
                        </td>
                    </tr>
                `;
                return;
            }

            response.data.forEach((img, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${img.title}</td>
                        <td>
                                <img src="${img.image_path}" class="table-img">
                        </td>
                        <td class="text-center">
                            <a href="/admin/art-image/edit/${img.image_id}" class="action-btn edit-btn">
                                <i class="bi bi-pencil-square"></i>
                            </a>

                            <button class="action-btn delete-btn" onclick="deleteArtImage(${img.image_id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    };

    xhr.send();
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
            document.getElementById("image_id").value = response.data.image_id;
            document.getElementById("art_id").value = response.data.art_id;
            document.getElementById("currentImage").src = response.data.image_path;

        } else {
            if (window.showActionToast) window.showActionToast('load-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
        }
    };

    xhr.send();
}

function previewSingleImage() {
    const imageInput = document.getElementById("image");
    const previewBox = document.getElementById("imagePreview");

    imageInput.addEventListener("change", function () {
        previewBox.innerHTML = "";

        if (imageInput.files.length > 0) {
            const imageUrl = URL.createObjectURL(imageInput.files[0]);

            previewBox.innerHTML = `
                <img src="${imageUrl}" class="preview-img">
            `;
        }
    });
}

function updateArtImage() {
    document.getElementById("editArtImageForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const image_id = document.getElementById("image_id").value;
        const form = document.getElementById("editArtImageForm");
        const formData = new FormData(form);
        const btn = form.querySelector(".submit-btn");

        // Disable button + show loading
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Updating...`;

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", "/admin/api/art-image/update/" + image_id, true);

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            const msg = document.getElementById("imageMessage");

            // Re-enable button
            btn.disabled = false;
            btn.innerHTML = `Update Image`;

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('upd-img', 'Success', response.message, 'bi-check-circle-fill', 'success');
                msg.innerHTML = '';

                setTimeout(() => {
                    window.location.href = "/admin/art-image/view";
                }, 600);
            } else {
                if (window.showActionToast) window.showActionToast('upd-img-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                msg.innerHTML = '';
            }
        };

        xhr.send(formData);
    });
}