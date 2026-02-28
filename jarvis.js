// --- JARVIS.JS: FULL AUTOMATED VERSION ---

let JARVIS_URL = null;

// Beautiful SVG Icons
const MIC_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>`;

// --- 1. AUTOMATED BLIND CONNECTION DISCOVERY ---
async function autoConnectJarvis() {
    // Attempt to connect via local hostname first (mDNS)
    const pcHostname = "jarvis-pc.local"; 
    const testUrl = `http://${pcHostname}:5000/chat`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); 
        // Preflight check for 2026 LNA
        const response = await fetch(testUrl, { method: 'OPTIONS', signal: controller.signal });
        
        if (response.ok) {
            console.log("Connected via Hostname!");
            return testUrl;
        }
    } catch (e) {
        console.log("Hostname not found, checking last known IP...");
    }

    // Fallback to localStorage if hostname fails
    let savedIp = localStorage.getItem('jarvis_pc_ip');
    if (savedIp) return `http://${savedIp}:5000/chat`;

    // Last resort: Prompt user
    let manualIp = prompt("System cannot find Jarvis. Please enter your PC IP (e.g., 192.168.1.5):");
    if (manualIp) {
        localStorage.setItem('jarvis_pc_ip', manualIp);
        return `http://${manualIp}:5000/chat`;
    }
    return null;
}

// Initialize connection as soon as script loads
autoConnectJarvis().then(url => {
    if (url) {
        JARVIS_URL = url;
        $('#send-btn').prop('disabled', false).css('opacity', '1');
        console.log("🚀 Jarvis Connection Ready:", JARVIS_URL);
    }
});

// --- 2. UI & EVENT HANDLERS ---
$(document).ready(function() {
    $('.jarvis-wrapper').css('display', 'flex');
    
    // Disable send button until JARVIS_URL is found
    if (!JARVIS_URL) {
        $('#send-btn').prop('disabled', true).css('opacity', '0.5');
    }

    // Bind Enter key to send command
    $('#chat-input').on('keypress', function (e) {
        if(e.which === 13) {
            e.preventDefault();
            sendText();
        }
    });
    
    // Maintain scroll position on mobile keyboard resize
    window.addEventListener('resize', () => {
        let chatBox = $('#chat-history')[0];
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    });
});

// --- 3. CORE COMMUNICATION ---
function sendText() {
    let inputEl = $('#chat-input');
    let text = inputEl.val().trim();
    
    if(!text) return;
    
    // Ensure system is connected before sending
    if(!JARVIS_URL) {
        addChatMsg("⏳ Still connecting to your PC... Please wait.", false);
        return;
    }

    addChatMsg(text, true);
    inputEl.val('');
    inputEl.blur(); // Collapse mobile keyboard
    
    $('#send-btn').prop('disabled', true).css('opacity', '0.5');

    // 2026 Secure Fetch to Local Network
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
        addChatMsg(`⚠️ Connection Failed. Ensure Python is running and "Insecure Content" is allowed in site settings.`, false);
    });
}

// --- 4. UTILITIES ---
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
        window.speechSynthesis.cancel(); // Stop current speech
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// --- 5. VOICE RECOGNITION ---
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
    if (!recognition) return alert("Voice not supported on this browser.");
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        $('#mic-btn').addClass('active').html(STOP_SVG);
        isRecording = true;
    }
}
