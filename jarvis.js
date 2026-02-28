// --- IP PROMPT & LOCAL STORAGE LOGIC ---
let targetIp = localStorage.getItem("jarvis_ip");

// If the user hasn't saved an IP, prompt them for it
if (!targetIp) {
    targetIp = prompt("Jarvis Connection Setup:\n\nPlease enter the IP address displayed on your fridge (e.g., 192.168.1.10):");
    
    if (targetIp) {
        targetIp = targetIp.trim();
        localStorage.setItem("jarvis_ip", targetIp);
    } else {
        // Fallback to localhost if they cancel the prompt
        targetIp = "127.0.0.1"; 
    }
}

const JARVIS_URL = `http://${targetIp}:5000/chat`;

// Helper function so the user can easily reset the IP if they type it wrong
function resetIp() {
    localStorage.removeItem("jarvis_ip");
    location.reload();
}

// Beautiful SVG Icons
const MIC_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>`;

$(document).ready(function() {
    $('.jarvis-wrapper').css('display', 'flex');
    
    // Fallback: Listen for the Enter key on the input field
    $('#chat-input').on('keypress', function (e) {
        if(e.which === 13) {
            e.preventDefault();
            sendText();
        }
    });
    
    // Auto-scroll when virtual keyboard opens
    window.addEventListener('resize', () => {
        if($('#chat-history').length) {
            let chatBox = $('#chat-history')[0];
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
});

function addChatMsg(text, isUser) {
    let cls = isUser ? 'user-msg' : 'bot-msg';
    let avatar = isUser ? '' : `<img src="jarvis-icon.jpg" class="chat-avatar" onerror="this.style.display='none'">`;
    let label = isUser ? 'YOU' : 'JARVIS';
    
    let html = `
        <div class="chat-msg ${cls}">
            ${avatar}
            <div class="msg-content">
                <div class="msg-label" style="color: ${isUser ? '#e0e0e0' : '#666'}">${label}</div>
                ${text}
            </div>
        </div>
    `;
    
    $('#chat-history').append(html);
    
    // Auto-scroll to latest message
    let chatBox = $('#chat-history')[0];
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send the text command to the Python API
function sendText() {
    let inputEl = $('#chat-input');
    let text = inputEl.val().trim();
    if(!text) return;

    addChatMsg(text, true);
    inputEl.val('');
    inputEl.blur(); // Hides mobile keyboard cleanly
    
    $('#send-btn').prop('disabled', true).css('opacity', '0.5');

    fetch(JARVIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    })
    .then(function(response) { 
        return response.json(); 
    })
    .then(function(data) {
        $('#send-btn').prop('disabled', false).css('opacity', '1');
        let reply = data.response || "Done.";
        addChatMsg(reply, false);
        speakText(reply);
    })
    .catch(function(error) {
        console.error("Jarvis Error:", error);
        $('#send-btn').prop('disabled', false).css('opacity', '1');
        
        // If it fails, give the user an easy button right in the chat to reset the IP!
        addChatMsg(`⚠️ Connection to <b>${targetIp}</b> failed. <br><br><a href="#" onclick="resetIp(); return false;" style="color:#e74c3c; font-weight:bold; text-decoration:underline;">Click here to re-enter IP address</a>.<br><br>(Note: If using your phone, ensure "Insecure Content" is allowed in Site Settings!)`, false);
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// --- WEB SPEECH RECOGNITION ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    
    recognition.onresult = function(e) {
        $('#mic-btn').removeClass('active').html(MIC_SVG);
        let text = e.results[0][0].transcript;
        $('#chat-input').val(text);
        isRecording = false;
        sendText(); 
    };
    
    recognition.onerror = function(e) { 
        console.error("Mic error:", e.error);
        $('#mic-btn').removeClass('active').html(MIC_SVG);
        if($('#chat-input').val() === "Listening...") $('#chat-input').val("");
        isRecording = false;
    };
    
    recognition.onend = function() { 
        $('#mic-btn').removeClass('active').html(MIC_SVG);
        if($('#chat-input').val() === "Listening...") $('#chat-input').val("");
        isRecording = false;
    };
} else {
    $('#mic-btn').hide(); 
}

function startVoice() {
    if (!recognition) return alert("Voice input not supported on this browser.");
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        $('#mic-btn').addClass('active').html(STOP_SVG);
        $('#chat-input').val("Listening...");
        isRecording = true;
    }
}
