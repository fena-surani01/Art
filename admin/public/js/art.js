document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("artTableBody")) {
        loadArts();
    }

    if (document.getElementById("addArtForm")) {
        addArt();
    }

    if (document.getElementById("editArtForm")) {
        loadSingleArt();
        updateArt();
    }

});

function loadArts() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", "/admin/api/arts", true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);

            const tbody = document.getElementById("artTableBody");
            tbody.innerHTML = "";

            if (response.status === "success") {

                if (response.data.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" class="text-center text-muted">
                                No arts found
                            </td>
                        </tr>
                    `;
                    return;
                }

                response.data.forEach((art, index) => {
                    
                    const rowClass = art.stock <= 0 ? 'status-indicator-stockout' : '';

                    tbody.innerHTML += `
                        <tr class="${rowClass}">
                            <td>${index + 1}</td>
                            <td class="fw-bold">${art.title}</td>
                            <td>${art.artist_name}</td>
                            <td>${art.category}</td>
                            <td>${art.art_type}</td>
                            <td>${art.art_size}</td>
                            <td>₹${art.price}</td>
                            <td>${art.stock <= 0 ? `<span class="badge bg-danger rounded-pill"><i class="bi bi-exclamation-triangle-fill me-1"></i> Out of Stock</span>` : `<span class="fw-semibold">${art.stock}</span>`}</td>
                            <td>${new Date(art.created_at).toLocaleDateString()}</td>

                            <td class="text-center">

                                <a href="/admin/art/edit/${art.art_id}" class="action-btn edit-btn">
                                    <i class="bi bi-pencil-square"></i>
                                </a>

                                <button class="action-btn delete-btn"
                                    onclick="deleteArt(${art.art_id})">
                                    <i class="bi bi-trash"></i>
                                </button>

                            </td>

                        </tr>
                    `;
                });
            }
        }
    };

    xhr.send();
}

function addArt() {
    document.getElementById("addArtForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const category = document.getElementById("category").value;
        const art_type = document.getElementById("art_type").value;
        const artist_name = document.getElementById("artist_name").value;
        const price = document.getElementById("price").value;
        const art_size = document.getElementById("art_size").value;
        const stock = document.getElementById("stock").value;

        const xhr = new XMLHttpRequest();

        xhr.open("POST", "/admin/api/art/add", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            const msg = document.getElementById("artMessage");

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('add-art', 'Success', response.message, 'bi-check-circle-fill', 'success');
                msg.innerHTML = '';
                document.getElementById("addArtForm").reset();

                setTimeout(() => {
                    window.location.href = "/admin/art/view";
                }, 500);
            } else {
                if (window.showActionToast) window.showActionToast('add-art-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                msg.innerHTML = '';
            }
        };

        xhr.send(
            "title=" + title +
            "&description=" + description +
            "&category=" + category +
            "&art_type=" + art_type +
            "&artist_name=" + artist_name +
            "&price=" + price +
            "&art_size=" + art_size +
            "&stock=" + stock
        );
    });
}

function deleteArt(id) {
    showConfirmModal(
        "Delete Art", 
        "Are you sure you want to delete this art?", 
        "Delete", 
        "btn-danger", 
        function() {
            const xhr = new XMLHttpRequest();
            xhr.open("DELETE", "/admin/api/art/delete/" + id, true);
            xhr.onload = function () {
                const response = JSON.parse(xhr.responseText);
                if (response.status === "success") {
                    if (window.showActionToast) {
                        window.showActionToast('del-art', 'Success', response.message, 'bi-check-circle-fill', 'success');
                    }
                    loadArts();
                } else {
                    if (window.showActionToast) {
                        window.showActionToast('del-art-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                    }
                }
            };
            xhr.send();
        }
    );
}

function getArtIdFromUrl() {
    const urlParts = window.location.pathname.split("/");
    return urlParts[urlParts.length - 1];
}

function loadSingleArt() {
    const art_id = getArtIdFromUrl();

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "/admin/api/art/" + art_id, true);

    xhr.onload = function () {
        const response = JSON.parse(xhr.responseText);

        if (response.status === "success") {
            document.getElementById("art_id").value = response.data.art_id;
            document.getElementById("title").value = response.data.title;
            document.getElementById("description").value = response.data.description;
            document.getElementById("category").value = response.data.category;
            document.getElementById("art_type").value = response.data.art_type;
            document.getElementById("artist_name").value = response.data.artist_name;
            document.getElementById("price").value = response.data.price;
            document.getElementById("art_size").value = response.data.art_size;
            document.getElementById("stock").value = response.data.stock;
        } else {
            if (window.showActionToast) window.showActionToast('load-art-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
        }
    };

    xhr.send();
}

function updateArt() {
    document.getElementById("editArtForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const art_id = document.getElementById("art_id").value;
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const category = document.getElementById("category").value;
        const art_type = document.getElementById("art_type").value;
        const artist_name = document.getElementById("artist_name").value;
        const price = document.getElementById("price").value;
        const art_size = document.getElementById("art_size").value;
        const stock = document.getElementById("stock").value;

        const xhr = new XMLHttpRequest();

        xhr.open("PUT", "/admin/api/art/update/" + art_id, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onload = function () {
            const response = JSON.parse(xhr.responseText);
            const msg = document.getElementById("artMessage");

            if (response.status === "success") {
                if (window.showActionToast) window.showActionToast('upd-art', 'Success', response.message, 'bi-check-circle-fill', 'success');
                msg.innerHTML = '';

                setTimeout(() => {
                    window.location.href = "/admin/art/view";
                }, 700);
            } else {
                if (window.showActionToast) window.showActionToast('upd-art-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                msg.innerHTML = '';
            }
        };

        xhr.send(
            "title=" + title +
            "&description=" + description +
            "&category=" + category +
            "&art_type=" + art_type +
            "&artist_name=" + artist_name +
            "&price=" + price +
            "&art_size=" + art_size +
            "&stock=" + stock
        );
    });
}