// --- script.js (Authentication & Inventory Only) ---
const API_URL = 'https://script.google.com/macros/s/AKfycbwR3LH7qkeNNNZgEhOSMFqXZcO9xyVF7DiQau7gDxcTJ6ljtgD4EwrIm8tmC-B-fMpMag/exec'; 

let currentUser = null;
let currentPass = null;

$(document).ready(function() {
    toggleLogoutButton(false);

    // AUTO-LOGIN
    var savedUser = sessionStorage.getItem('currentUser');
    var savedPass = sessionStorage.getItem('currentPass');
    
    if (savedUser && savedPass) {
        currentUser = savedUser;
        currentPass = savedPass;
        toggleLogoutButton(true);
    }

    // EVENT BINDINGS FOR INVENTORY
    $('#mobile-search-input').on('keyup', function() {
        if ($.fn.DataTable.isDataTable('#inventory')) {
            $('#inventory').DataTable().search(this.value).draw();
        }
    });

    $('#mobile-sort-select').on('change', function() {
        if ($.fn.DataTable.isDataTable('#inventory')) {
            var val = $(this).val();
            var parts = val.split('_');
            $('#inventory').DataTable().order([parseInt(parts[0]), parts[1]]).draw();
        }
    });
});

function toggleLogoutButton(show) {
    if (show) $('#logout-section').show(); else $('#logout-section').hide();
}
