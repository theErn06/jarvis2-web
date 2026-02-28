const API_URL = 'https://script.google.com/macros/s/AKfycbwG462ao0VUGfTOuxNcnYm-BDuNorNLtjFS-b5FY6jo4vzkdFvNv_2CRipYBoYp5_hhvw/exec'; 

// King.py will auto-update this line.
// EXAMPLE: http://192.168.1.9:5000/chat
const JARVIS_URL = 'http://192.168.1.10:5000/chat';

let currentUser = null;
let currentPass = null;

$(document).ready(function() {
    toggleLogoutButton(false);

    // 1. AUTO-LOGIN
    var savedUser = localStorage.getItem('fridgeUser');
    var savedPass = localStorage.getItem('fridgePass');
    var lastView = localStorage.getItem('lastView');
    
    if (savedUser && savedPass) {
        currentUser = savedUser;
        currentPass = savedPass;
        toggleLogoutButton(true);
        
        $('.auth-card').hide(); 

        if ($('#inventory-section').length > 0) {
            if (lastView === 'jarvis-view') {
                showView('jarvis-view');
            } else {
                showView('inventory-section');
            }
            loadTable();
            loadChatHistory();
        }
    }

    // 2. EVENT BINDINGS
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

    $('#chat-input').on('keypress', function (e) {
        if(e.which === 13) {
            e.preventDefault(); 
            sendJarvisMessage();
        }
    });
});

// --- CHAT HISTORY ---
function saveChatHistory() {
    var history = $('#chat-history').html();
    localStorage.setItem('jarvisChatHistory', history);
}

function loadChatHistory() {
    var history = localStorage.getItem('jarvisChatHistory');
    if (history && $('#chat-history').length > 0) {
        $('#chat-history').html(history);
        var chatBox = $('#chat-history')[0];
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function clearChatHistory() {
    if(confirm("Clear chat history?")) {
        $('#chat-history').html('<div class="chat-msg bot-msg"><img src="jarvis-icon.jpg" class="chat-avatar"><div class="msg-content">History cleared. How can I help?</div></div>');
        localStorage.removeItem('jarvisChatHistory');
    }
}

// --- JARVIS LOGIC ---
function addChatMsg(text, isUser) {
    var cls = isUser ? 'user-msg' : 'bot-msg';
    var imgHtml = !isUser ? '<img src="jarvis-icon.jpg" class="chat-avatar">' : '';
    
    var html = '<div class="chat-msg ' + cls + '">' + imgHtml + '<div class="msg-content">' + text + '</div></div>';
    
    $('#chat-history').append(html);
    var chatBox = $('#chat-history')[0];
    chatBox.scrollTop = chatBox.scrollHeight;
    
    saveChatHistory();
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    }
}

function startDictation() {
    if ('webkitSpeechRecognition' in window) {
        var recognition = new webkitSpeechRecognition();
        $('.mic-btn').addClass('active');
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function(e) {
            $('.mic-btn').removeClass('active');
            var text = e.results[0][0].transcript;
            $('#chat-input').val(text);
            sendJarvisMessage();
        };
        recognition.onerror = function(e) { $('.mic-btn').removeClass('active'); };
        recognition.onend = function() { $('.mic-btn').removeClass('active'); };
    } else {
        alert("Voice input not supported on this browser.");
    }
}

function sendJarvisMessage() {
    var text = $('#chat-input').val().trim();
    if(!text) return;

    addChatMsg(text, true);
    $('#chat-input').val('');

    // SIMPLE FETCH (Best for local networks)
    fetch(JARVIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        var reply = data.response || "I couldn't process that.";
        addChatMsg(reply, false);
        speakText(reply);
        
        if($.fn.DataTable.isDataTable('#inventory')) {
             $('#inventory').DataTable().ajax.reload(null, false);
        }
    })
    .catch(function(error) {
        console.error("Jarvis Error:", error);
        addChatMsg("Error: Connection Failed. Check King.py console.", false);
    });
}

// --- VIEW LOGIC ---
function showView(viewId) {
    if ((viewId === 'jarvis-view' || viewId === 'inventory-section') && !currentUser) {
        alert("Please Log In First!");
        showView('login-view');
        return;
    }

    if (currentUser) {
        localStorage.setItem('lastView', viewId);
    }

    $('#sidebar').removeClass('open');
    $('.overlay').removeClass('active');
    
    $('.card.auth-card, .inventory-wrapper, .jarvis-wrapper').hide();
    
    $('#' + viewId).fadeIn();
    
    $('.message').text('').removeClass('error');
    if(viewId !== 'jarvis-view') $('input').val(''); 

    // Safe table resize
    if (viewId === 'inventory-section') {
        setTimeout(function() {
            if ($.fn.DataTable.isDataTable('#inventory')) {
                var table = $('#inventory').DataTable();
                table.columns.adjust();
                if(table.responsive) { table.responsive.recalc(); }
            }
        }, 200); 
    }
}

function toggleMenu() {
    $('#sidebar').toggleClass('open');
    $('.overlay').toggleClass('active');
}

function toggleLogoutButton(show) {
    if (show) $('#logout-section').show(); else $('#logout-section').hide();
}

function handleAuth(action) {
    var payload = { action: action };
    var msgBox, btn;

    if (action === 'login') {
        payload.username = $('#login-user').val();
        payload.password = $('#login-pass').val();
        msgBox = $('#login-msg'); btn = $('#btn-login');
    } else if (action === 'signup') {
        payload.username = $('#signup-user').val();
        payload.password = $('#signup-pass').val();
        msgBox = $('#signup-msg'); btn = $('#btn-signup');
    } else if (action === 'change_password') {
        payload.username = $('#cp-user').val();
        payload.old_password = $('#cp-old').val();
        payload.new_password = $('#cp-new').val();
        msgBox = $('#cp-msg'); btn = $('#btn-cp');
    }

    msgBox.removeClass('error').text('');
    btn.prop('disabled', true).find('.btn-text').hide().end().find('.spinner').show();

    $.ajax({
        url: API_URL,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "text/plain", 
        success: function(response) {
            btn.prop('disabled', false).find('.btn-text').show().end().find('.spinner').hide();
            
            var res;
            try { res = (typeof response === "object") ? response : JSON.parse(response); } 
            catch (e) { msgBox.addClass('error').text("Invalid server response."); return; }

            if (res.status === 'success') {
                if (action === 'login' || action === 'signup') {
                    currentUser = payload.username;
                    currentPass = payload.password;
                    
                    localStorage.setItem('fridgeUser', currentUser);
                    localStorage.setItem('fridgePass', currentPass);
                    localStorage.setItem('lastView', 'inventory-section');

                    $('.auth-card').hide(); 
                    $('#inventory-section').fadeIn();
                    toggleLogoutButton(true);
                    loadTable();
                } else if (action === 'change_password') {
                    alert("Password updated. Please login again."); 
                    logout();
                }
            } else {
                msgBox.addClass('error').text(res.message);
            }
        },
        error: function() {
            btn.prop('disabled', false).find('.btn-text').show().end().find('.spinner').hide();
            msgBox.addClass('error').text("Connection failed. Please check internet.");
        }
    });
}

function loadTable() {
    if ($('#inventory').length === 0) return;

    if ($.fn.DataTable.isDataTable('#inventory')) {
        $('#inventory').DataTable().ajax.reload(null, false);
        return;
    } 

    $('#inventory').DataTable({
        processing: true,
        pageLength: 10,
        lengthChange: false, 
        language: { search: "", searchPlaceholder: "Search items..." },
        
        createdRow: function (row, data, dataIndex) {
            var labels = ['Item', 'Qty', 'Unit', 'Category', 'Expiry', 'Status', 'Days Left'];
            $('td', row).each(function(i) {
                $(this).attr('data-label', labels[i]);
            });
        },
        
        ajax: function (data, callback, settings) {
            $.ajax({
                url: API_URL,
                method: 'POST',
                contentType: "text/plain", 
                data: JSON.stringify({
                    action: "get_inventory",
                    username: currentUser,
                    password: currentPass
                }),
                success: function (response) {
                    var json;
                    try { json = (typeof response === "object") ? response : JSON.parse(response); } catch(e) { json = { data: [] }; }
                    if (json.error) console.error("Table Sync Error:", json.error);
                    else callback({ data: json.data || [] });
                },
                error: function() {
                    console.error("Failed to load inventory from cloud.");
                    callback({ data: [] });
                }
            });
        },
        columns: [
            { 
                data: 'item_name', 
                defaultContent: "-",
                render: function (data) {
                    if (!data || data === "-") return "-";
                    var text = String(data); 
                    return '<strong>' + text.charAt(0).toUpperCase() + text.slice(1) + '</strong>';
                }
            },
            { data: 'qty', defaultContent: "0" },
            { data: 'unit', defaultContent: "-" },
            { data: 'category', defaultContent: "-" },
            { 
                data: 'expiry', 
                defaultContent: "-",
                render: function (data) {
                    if (!data || data === "N/A" || data === "-") return "N/A";
                    return moment(data).format('YYYY-MM-DD');
                }
            },
            { 
                data: 'status', 
                defaultContent: "N/A",
                render: function(data) {
                    var color = '#333';
                    if(data === 'Expired') color = '#e74c3c';
                    else if(data === 'Good') color = '#27ae60';
                    else if(data === 'Expiring Soon') color = '#f39c12';
                    return '<span style="color:' + color + '; font-weight:600;">' + data + '</span>';
                }
            },
            { data: 'days_left', defaultContent: "N/A" } 
        ]
    });
}

function prepareChangePass() {
    if(currentUser) $('#cp-user').val(currentUser);
    showView('change-pass-view');
}

function logout() {
    currentUser = null; currentPass = null;
    localStorage.clear(); 
    toggleLogoutButton(false);
    location.reload(); 
}