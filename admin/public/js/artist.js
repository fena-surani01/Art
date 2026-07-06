document.addEventListener("DOMContentLoaded", () => {
    loadArtists();
    if(document.getElementById("editArtistForm")){
        loadSingleArtist();
        updateArtist();
    }
});

function loadArtists() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", "/admin/api/artists", true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);

            const tbody = document.getElementById("artistTableBody");
            tbody.innerHTML = "";

            if (response.status === "success") {

                if (response.data.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-muted">
                                No artists found
                            </td>
                        </tr>
                    `;
                    return;
                }

                response.data.forEach((artist, index) => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${artist.artist_name}</td>
                            <td>${artist.email || 'N/A'}</td>
                            <td>${artist.gender}</td>
                            <td>${artist.description ? artist.description.substring(0, 30) + '...' : 'N/A'}</td>
                            <td>${new Date(artist.created_at).toLocaleDateString()}</td>
                            <td class="text-center">
                                <a href="/admin/artist/edit/${artist.artist_id}" class="action-btn edit-btn" title="Edit">
                                    <i class="bi bi-pencil-square"></i>
                                </a>
                                <button class="action-btn delete-btn" onclick="deleteArtist(${artist.artist_id})" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                                <button class="action-btn login-btn" onclick="loginAsArtist(${artist.artist_id})" title="Login as Artist">
                                    <i class="bi bi-box-arrow-in-right"></i>
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

document.getElementById("addArtistForm").addEventListener("submit", function(e){
    e.preventDefault();

    const artist_name = document.getElementById("artist_name").value;
    const gender = document.getElementById("gender").value;
    const description = document.getElementById("description") ? document.getElementById("description").value : '';
    const email = document.getElementById("email") ? document.getElementById("email").value : '';
    const password = document.getElementById("password") ? document.getElementById("password").value : '';
    const salary = document.getElementById("salary") ? document.getElementById("salary").value : 0;
    const join_date = document.getElementById("join_date") ? document.getElementById("join_date").value : '';

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/admin/api/artist/add", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function(){
        const response = JSON.parse(xhr.responseText);

        const msg = document.getElementById("artistMessage");

        if(response.status === "success"){
            if(window.showActionToast) window.showActionToast('add-artist', 'Success', response.message, 'bi-check-circle-fill', 'success');
            msg.innerHTML = '';
            document.getElementById("addArtistForm").reset();

             setTimeout(() => {
                window.location.href = "/admin/artist/view";
            }, 400); // 1 second
        }else{
            if(window.showActionToast) window.showActionToast('add-artist-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
            msg.innerHTML = '';
        }
    };

    xhr.send("artist_name=" + encodeURIComponent(artist_name) + "&gender=" + encodeURIComponent(gender) + "&description=" + encodeURIComponent(description) + "&email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password) + "&salary=" + encodeURIComponent(salary) + "&join_date=" + encodeURIComponent(join_date));
});

function deleteArtist(id){
    showConfirmModal(
        "Delete Artist", 
        "Are you sure you want to delete this artist?", 
        "Delete", 
        "btn-danger", 
        function() {
            const xhr = new XMLHttpRequest();
            xhr.open("DELETE", "/admin/api/artist/delete/" + id, true);
            xhr.onload = function(){
                const response = JSON.parse(xhr.responseText);
                if(response.status === "success"){
                    if (window.showActionToast) {
                        window.showActionToast('del-artist', 'Success', response.message, 'bi-check-circle-fill', 'success');
                    }
                    loadArtists();
                }else{
                    if (window.showActionToast) {
                        window.showActionToast('del-artist-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                    }
                }
            };
            xhr.send();
        }
    );
}

function loginAsArtist(artist_id) {
    showConfirmModal(
        "Login as Artist", 
        "Are you sure you want to login as this artist? You will leave the admin dashboard.", 
        "Login", 
        "btn-primary", 
        function() {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/admin/api/artist/login-as/" + artist_id, true);
            xhr.onload = function(){
                const response = JSON.parse(xhr.responseText);
                if(response.status === "success"){
                    window.location.href = "/admin/dashboard";
                } else {
                    if (window.showActionToast) {
                        window.showActionToast('login-artist-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                    }
                }
            };
            xhr.send();
        }
    );
}

function getArtistIdFromUrl(){
    const urlParts = window.location.pathname.split("/");
    return urlParts[urlParts.length - 1];
}

function loadSingleArtist(){

    const artist_id = getArtistIdFromUrl();

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "/admin/api/artist/" + artist_id, true);

    xhr.onload = function(){

        const response = JSON.parse(xhr.responseText);

        if(response.status === "success"){

            document.getElementById("artist_id").value = response.data.artist_id;
            document.getElementById("artist_name").value = response.data.artist_name;
            document.getElementById("gender").value = response.data.gender;
            if (document.getElementById("email")) {
                document.getElementById("email").value = response.data.email || '';
            }
            if (document.getElementById("password")) {
                document.getElementById("password").value = response.data.password_hash || '';
            }
            if (document.getElementById("salary")) {
                document.getElementById("salary").value = response.data.salary || 0;
            }
            if (document.getElementById("join_date") && response.data.join_date) {
                // convert ISO string to YYYY-MM-DD for date input
                document.getElementById("join_date").value = response.data.join_date.split('T')[0];
            }

        }else{
            if(window.showActionToast) window.showActionToast('load-artist-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
        }

    };

    xhr.send();
}

function updateArtist(){

    document.getElementById("editArtistForm").addEventListener("submit", function(e){

        e.preventDefault();

        const artist_id = document.getElementById("artist_id").value;
        const artist_name = document.getElementById("artist_name").value;
        const gender = document.getElementById("gender").value;
        const email = document.getElementById("email") ? document.getElementById("email").value : '';
        const password = document.getElementById("password") ? document.getElementById("password").value : '';
        const salary = document.getElementById("salary") ? document.getElementById("salary").value : 0;
        const join_date = document.getElementById("join_date") ? document.getElementById("join_date").value : '';

        const xhr = new XMLHttpRequest();

        xhr.open("PUT", "/admin/api/artist/update/" + artist_id, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onload = function(){

            const response = JSON.parse(xhr.responseText);
            const msg = document.getElementById("artistMessage");

            if(response.status === "success"){
                if(window.showActionToast) window.showActionToast('upd-artist', 'Success', response.message, 'bi-check-circle-fill', 'success');
                msg.innerHTML = '';
                setTimeout(() => {
                    window.location.href = "/admin/artist/view";
                }, 700);
            }else{
                if(window.showActionToast) window.showActionToast('upd-artist-err', 'Error', response.message, 'bi-exclamation-triangle-fill', 'danger');
                msg.innerHTML = '';
            }

        };

        xhr.send("artist_name=" + encodeURIComponent(artist_name) + "&gender=" + encodeURIComponent(gender) + "&email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password) + "&salary=" + encodeURIComponent(salary) + "&join_date=" + encodeURIComponent(join_date));

    });

}