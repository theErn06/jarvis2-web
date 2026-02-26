// jarvis.py will automatically detect your IP and rewrite this variable!
const JARVIS_URL = 'http://127.0.0.1:5000/chat';

$(document).ready(function() {
    // Listen for the Enter key on the input field
    $('#chat-input').on('keypress', function (e) {
        if(e.which === 13) {
            e.preventDefault();
            sendCommand();
        }
    });
});

function appendMsg(sender, text) {
    let isUser = sender === 'You';
    let cls = isUser ? 'user-msg' : 'bot-msg';
    
    // Create chat bubble HTML
    let html = `
      <div class="chat-msg ${cls}" style="align-self: ${isUser ? 'flex-end' : 'flex-start'};">
        <div class="msg-content">
          <div class="msg-label" style="color: ${isUser ? '#e0e0e0' : '#666'}">${sender.toUpperCase()}</div>
          ${text}
        </div>
      </div>
    `;
    
    $('#chat-history').append(html);
    
    // Auto-scroll to latest message
    let chatBox = $('#chat-history')[0];
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendCommand() {
    let input = $('#chat-input').val().trim();
    if (!input) return;

    appendMsg("You", input);
    $('#chat-input').val("");
    $('#send-btn').prop('disabled', true).css('opacity', '0.5');

    // Send HTTP POST to Python backend
    $.ajax({
        url: JARVIS_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ message: input }),
        timeout: 60000, 
        success: function (res) {
            $('#send-btn').prop('disabled', false).css('opacity', '1');
            let reply = res.response || "Done.";
            appendMsg("Jarvis", reply);
            speakText(reply); // Speaks the response aloud on your phone/PC browser
        },
        error: function (xhr, status, error) {
            $('#send-btn').prop('disabled', false).css('opacity', '1');
            appendMsg("System", "⚠️ Connection failed. Ensure the Python script is running on your laptop and your device is connected to the same Wi-Fi.");
        }
    });
}

// ------------------------------------
// WEB SPEECH RECOGNITION (Voice Mode)
// ------------------------------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
        let transcript = event.results[0][0].transcript;
        $('#chat-input').val(transcript);
        stopRecordingUI();
        sendCommand(); // Automatically send when finished speaking
    };

    recognition.onerror = function(event) {
        console.error(event.error);
        stopRecordingUI();
        if($('#chat-input').val() === "Listening...") $('#chat-input').val("");
    };

    recognition.onend = function() { 
        stopRecordingUI(); 
    };
} else {
    $('#mic-btn').hide(); // Hide mic button if browser (like old Safari) doesn't support it
}

function toggleVoice() {
    if (!recognition) return alert("Speech recognition not supported in this browser.");
    
    if (isRecording) {
        recognition.stop();
        stopRecordingUI();
    } else {
        recognition.start();
        $('#mic-btn').addClass('active').text("⏹");
        $('#chat-input').val("Listening...");
        isRecording = true;
    }
}

function stopRecordingUI() {
    $('#mic-btn').removeClass('active').text("🎤");
    if($('#chat-input').val() === "Listening...") $('#chat-input').val("");
    isRecording = false;
}

// Phone/Browser Text-To-Speech
function speakText(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}