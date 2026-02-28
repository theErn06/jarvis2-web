// --- JARVIS.JS: DIRECT IP VERSION (NO PROMPTS) ---

// 1. SET YOUR PC IP HERE (Change this to your actual PC IP)
const PC_IP = "192.168.1.10"; 

// Automatically detect if running on PC (localhost) or Phone (Network IP)
const targetIp = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? "127.0.0.1" 
    : PC_IP;

const JARVIS_URL = `http://${targetIp}:5000/chat`;

// Beautiful SVG Icons
const MIC_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>`;

$(document).ready(function() {
    $('.jarvis-wrapper').css('display', 'flex');
    console.log("🔗 Jarvis targeting:", JARVIS_URL);

    // FIX: Re-bind the Enter key correctly to the sendText function
    $('#chat-input').on('keypress', function (e) {
        if(e.which === 13) {
            e.preventDefault();
            sendText(); 
        }
    });

    // Auto-scroll when virtual keyboard opens on mobile
    window.addEventListener('resize', () => {
        let chatBox = $('#chat-history')[0];
        if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    });
});

function sendText() {
    let inputEl = $('#chat-input');
    let text = inputEl.val().trim();
    if(!text) return;

    addChatMsg(text, true);
    inputEl.val('');
    inputEl.blur(); // Hides mobile keyboard
    
    $('#send-btn').prop('disabled', true).css('opacity', '0.5');

    // 2026 LNA compliant fetch for HTTPS -> HTTP
    fetch(JARVIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        targetAddressSpace: 'local' 
    })
    .then(response => response.json())
    .then(data => {
        $('#send-btn').prop('disabled', false).css('opacity', '1');
        let reply = data.response || "Command processed.";
        addChatMsg(reply, false);
        speakText(reply);
    })
    .catch(error => {
        console.error("Jarvis Error:", error);
        $('#send-btn').prop('disabled', false).css('opacity', '1');
        addChatMsg(`⚠️ Connection Failed. Target: ${targetIp}. Ensure Python is running and "Insecure Content" is allowed.`, false);
    });
}

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
    let chatBox = $('#chat-history')[0];
    chatBox.scrollTop = chatBox.scrollHeight;
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// --- VOICE RECOGNITION ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    
    recognition.onresult = function(e) {
        $('#mic-btn').removeClass('active').html(MIC_SVG);
        let text = e.results[0][0].transcript;
        $('#chat-input').val(text);
        isRecording = false;
        sendText(); 
    };
    
    recognition.onend = () => {
        $('#mic-btn').removeClass('active').html(MIC_SVG);
        isRecording = false;
    };
}

function startVoice() {
    if (!recognition) return alert("Voice not supported.");
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        $('#mic-btn').addClass('active').html(STOP_SVG);
        isRecording = true;
    }
}
