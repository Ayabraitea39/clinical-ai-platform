import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, getChatHistory } from "../../api/chat.js";
import './ChatWidget.css';

function formatTime(dateInput) {
  return new Date(dateInput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Web Speech API is prefixed in Chrome/Edge, unprefixed in some newer builds.
// Firefox/Safari largely don't support it — we detect that and disable the
// mic button with a clear message instead of pretending it works.
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function MicIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke={active ? '#fff' : 'currentColor'}
        strokeWidth="1.8"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke={active ? '#fff' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatWidget({ patientId, patientName, patientCode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load past messages for this patient when the widget mounts (or the
  // patient changes) so reopening a chart shows prior conversation instead
  // of starting empty every time.
  useEffect(() => {
    let cancelled = false;
    setHistoryLoaded(false);
    setMessages([]);

    getChatHistory(patientId)
      .then((history) => {
        if (cancelled) return;
        setMessages(
          history.map((m) => ({
            role: m.role,
            text: m.content,
            time: formatTime(m.created_at),
          }))
        );
      })
      .catch(() => {
        // If history fails to load, just start with an empty conversation
        // rather than blocking the widget from being usable.
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set up the recognition instance once. We keep it in a ref so start/stop
  // calls always target the same instance rather than recreating it on
  // every render (which can drop events on some browsers).
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Fill the text box only — doctor reviews/edits before sending.
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setSpeechError('');
    };

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was denied. Please allow microphone permissions and try again.',
        'no-speech': "No speech was detected. Please try again.",
        'audio-capture': 'No microphone was found. Please check your device and try again.',
        'network': 'A network error interrupted speech recognition. Please try again.',
      };
      setSpeechError(messages[event.error] || 'Speech recognition failed. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setSpeechError('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
      return;
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    setSpeechError('');
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      // start() throws if called while already running (e.g. a stray
      // double-click) — surface a gentle message instead of crashing.
      setSpeechError('Could not start the microphone. Please try again.');
      setIsRecording(false);
    }
  }, [isRecording]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question, time: formatTime(new Date()) }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(patientId, question);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, time: formatTime(new Date()) },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'The clinical assistant is temporarily unavailable.',
          time: formatTime(new Date()),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-title-row">
          <span className="chat-status-dot" />
          <span className="chat-header-title">Clinical AI Assistant</span>
        </div>
        <div className="chat-scoped-line">
          Scoped to: {patientName} · {patientCode}
        </div>
      </div>

      <div className="chat-messages">
        {!historyLoaded && (
          <div className="chat-bubble chat-bubble-assistant">Loading conversation…</div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="chat-bubble chat-bubble-assistant">
            Hello. I'm scoped to {patientName}'s record.
            <div className="chat-time">{formatTime(new Date())}</div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
            }`}
          >
            {m.text}
            <div className={`chat-time ${m.role === 'user' ? 'chat-time-user' : ''}`}>
              {m.time}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble chat-bubble-assistant">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {speechError && <div className="chat-speech-error">{speechError}</div>}

      <div className="chat-input-row">
        <button
          type="button"
          className={`chat-mic-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={
            SpeechRecognitionAPI
              ? isRecording
                ? 'Stop recording'
                : 'Speak your question'
              : 'Speech recognition not supported in this browser'
          }
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          <MicIcon active={isRecording} />
        </button>
        <textarea
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening…' : 'Ask about this patient...'}
          rows={1}
        />
        <button className="chat-send-button" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWidget;