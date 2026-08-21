import { useState, useRef, useEffect, useCallback } from 'react';
import {
  sendChatMessage,
  getChatHistory,
  listChatSessions,
  createChatSession,
  deleteChatSession,
} from "../../api/chat.js";
import './ChatWidget.css';

function formatTime(dateInput) {
  return new Date(dateInput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateInput) {
  return new Date(dateInput).toLocaleDateString();
}

// Strips markdown emphasis markers (**, ***, *) and returns plain text —
// no bold/italic styling, just the inner text.
function renderInline(content, keyPrefix) {
  const plain = content
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
  return <span key={keyPrefix}>{plain}</span>;
}

// A markdown table separator row, e.g. "|---|:--:|---|" or "| --- | --- |"
function isTableSeparatorRow(line) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
}

// Splits a "| a | b | c |" row into ["a", "b", "c"], tolerating a missing
// leading/trailing pipe.
function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function renderFormattedText(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect a markdown table: a "| ... |" row immediately followed by a
    // separator row ("|---|---|"). Consume every following row that still
    // looks like a table row.
    const looksLikeRow = line.trim().startsWith('|') && line.includes('|');
    const nextIsSeparator = i + 1 < lines.length && isTableSeparatorRow(lines[i + 1]);

    if (looksLikeRow && nextIsSeparator) {
      const headerCells = splitTableRow(line);
      i += 2; // skip header + separator row

      const bodyRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        bodyRows.push(splitTableRow(lines[i]));
        i += 1;
      }

      // Simple stacked format: first column becomes a bold label, the
      // remaining columns render underneath as "Header: value" lines.
      // No grid/borders — just plain, readable text.
      blocks.push(
        <div className="chat-table-simple" key={`table-${blocks.length}`}>
          {bodyRows.map((row, ri) => (
            <div className="chat-table-simple-row" key={ri}>
              <div className="chat-table-simple-label">
                {renderInline(row[0] || '', `label-${blocks.length}-${ri}`)}
              </div>
              {row.slice(1).map((cell, ci) => (
                <div className="chat-table-simple-line" key={ci}>
                  <span className="chat-table-simple-key">
                    {renderInline(headerCells[ci + 1] || '', `key-${blocks.length}-${ri}-${ci}`)}:
                  </span>{' '}
                  {renderInline(cell, `cell-${blocks.length}-${ri}-${ci}`)}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Not a table row — render as a normal (possibly heading) line.
    const headingMatch = line.match(/^#{1,6}\s+(.*)/);
    const content = headingMatch ? headingMatch[1] : line;
    const rendered = renderInline(content, `line-${blocks.length}`);

    blocks.push(
      <div className="chat-text-line" key={`line-${blocks.length}`}>
        {headingMatch ? <strong>{rendered}</strong> : rendered}
      </div>
    );
    i += 1;
  }

  return blocks;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="#fff" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-mic-spinner">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="42 100" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NewChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.5 8.5 0 1 1-4.1-7.3L21 3l-1 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21l1.9-5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyChatIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatWidget({ patientId, patientName, patientCode }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [justCleared, setJustCleared] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 'idle' | 'listening' | 'processing'
  const [micStatus, setMicStatus] = useState('idle');
  const [speechError, setSpeechError] = useState('');

  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setSessionsLoaded(false);
    setSessionError('');
    setSessions([]);
    setActiveSessionId(null);
    setShowHistoryPanel(false);
    setJustCleared(false);

    async function init() {
      try {
        const sessionList = await listChatSessions(patientId);
        if (cancelled) return;

        if (sessionList.length === 0) {
          const created = await createChatSession(patientId);
          if (cancelled) return;
          setSessions([created]);
          setActiveSessionId(created.id);
        } else {
          setSessions(sessionList);
          setActiveSessionId(sessionList[0].id);
        }
      } catch {
        if (!cancelled) setSessionError('Could not load conversations for this patient.');
      } finally {
        if (!cancelled) setSessionsLoaded(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [patientId]);

  useEffect(() => {
    if (!activeSessionId) return;
    let cancelled = false;
    setHistoryLoaded(false);
    setMessages([]);

    getChatHistory(patientId, activeSessionId)
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => { cancelled = true; };
  }, [activeSessionId, patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    // continuous=true keeps the mic open across natural pauses in speech
    // instead of stopping the moment the browser detects a gap — that was
    // the cause of recording cutting off mid-sentence.
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setMicStatus('listening');

    // In continuous mode, results can arrive in several finalized chunks
    // over the course of one recording (one per natural phrase/pause), not
    // just once at the end. Append every newly finalized chunk as it
    // comes in rather than assuming a single result.
    recognition.onresult = (event) => {
      let newText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newText += event.results[i][0].transcript;
        }
      }
      if (newText) {
        setInput((prev) => (prev ? `${prev} ${newText}` : newText));
        setSpeechError('');
      }
    };

    recognition.onerror = (event) => {
      const errorMessages = {
        'not-allowed': 'Microphone access was denied. Please allow microphone permissions and try again.',
        'no-speech': "No speech was detected. Please try again.",
        'audio-capture': 'No microphone was found. Please check your device and try again.',
        'network': 'A network error interrupted speech recognition. Please try again.',
      };
      setSpeechError(errorMessages[event.error] || 'Speech recognition failed. Please try again.');
      setMicStatus('idle');
    };

    recognition.onend = () => setMicStatus('idle');
    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
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

    if (micStatus === 'listening') {
      // The person pressed stop themselves — show the spinner right away
      // while the final chunk (if any) finishes coming in, then onend
      // brings it back to idle.
      setMicStatus('processing');
      recognition.stop();
      return;
    }

    if (micStatus === 'processing') return; // ignore taps mid-transcription

    setSpeechError('');
    try {
      recognition.start();
    } catch {
      setSpeechError('Could not start the microphone. Please try again.');
      setMicStatus('idle');
    }
  }, [micStatus]);

  const handleNewChat = async () => {
    setSessionError('');
    try {
      const created = await createChatSession(patientId);
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setShowHistoryPanel(false);
      setJustCleared(false);
    } catch {
      setSessionError('Could not start a new conversation. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    setSessionError('');
    try {
      await deleteChatSession(patientId, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);

      if (remaining.length === 0) {
        const created = await createChatSession(patientId);
        setSessions([created]);
        setActiveSessionId(created.id);
        return;
      }

      setSessions(remaining);
      if (sessionId === activeSessionId) {
        setActiveSessionId(remaining[0].id);
      }
    } catch {
      setSessionError('Could not delete the conversation. Please try again.');
    }
  };

  // "Delete" in the confirm bar clears the CURRENT chat: it deletes the
  // active session and immediately opens a fresh one, then shows a
  // "Chat cleared" state until the doctor starts a new message.
  const handleConfirmClear = async () => {
    setShowDeleteConfirm(false);
    setSessionError('');
    try {
      const oldSessionId = activeSessionId;
      const created = await createChatSession(patientId);
      await deleteChatSession(patientId, oldSessionId);

      setSessions((prev) => [created, ...prev.filter((s) => s.id !== oldSessionId)]);
      setActiveSessionId(created.id);
      setMessages([]);
      setJustCleared(true);
    } catch {
      setSessionError('Could not clear this conversation. Please try again.');
    }
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading || !activeSessionId) return;

    setJustCleared(false);
    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, { role: 'user', text: question, time: formatTime(new Date()) }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(patientId, activeSessionId, question);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, time: formatTime(new Date()) }]);

      if (isFirstMessage) {
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId && !s.title ? { ...s, title: question.slice(0, 80) } : s))
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'The clinical assistant is temporarily unavailable.', time: formatTime(new Date()) },
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

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const micTitle =
    micStatus === 'listening'
      ? 'Stop recording'
      : micStatus === 'processing'
      ? 'Processing…'
      : SpeechRecognitionAPI
      ? 'Speak your question'
      : 'Speech recognition not supported in this browser';

  const inputPlaceholder =
    micStatus === 'listening'
      ? 'Listening…'
      : micStatus === 'processing'
      ? 'Processing…'
      : 'Ask about this patient...';

  return (
    <div className="chat-container">
      <div className="chat-header">
        {showHistoryPanel ? (
          <div className="chat-header-title-row">
            <button type="button" className="chat-icon-button" onClick={() => setShowHistoryPanel(false)} aria-label="Back">
              <BackArrowIcon />
            </button>
            <span className="chat-header-title">Chat History</span>
            <span className="chat-session-count">{sessions.length} sessions</span>
          </div>
        ) : (
          <>
            <div className="chat-header-title-row">
              <span className="chat-status-dot" />
              <span className="chat-header-title">Clinical AI Assistant</span>
              <div className="chat-header-actions">
                <button type="button" className="chat-icon-button" onClick={() => setShowHistoryPanel(true)} title="Chat history" aria-label="Chat history">
                  <ListIcon />
                </button>
                <button type="button" className="chat-icon-button" onClick={handleNewChat} title="New chat" aria-label="New chat">
                  <NewChatIcon />
                </button>
                <button
                  type="button"
                  className="chat-icon-button chat-icon-button-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Clear this chat"
                  aria-label="Clear this chat"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
            <div className="chat-scoped-line">Scoped to: {patientName} · {patientCode}</div>
          </>
        )}

        {showDeleteConfirm && !showHistoryPanel && (
          <div className="chat-confirm-bar">
            <span>Delete all messages in this chat?</span>
            <div className="chat-confirm-actions">
              <button type="button" className="chat-confirm-delete" onClick={handleConfirmClear}>Delete</button>
              <button type="button" className="chat-confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {sessionError && <div className="chat-speech-error">{sessionError}</div>}
      </div>

      {showHistoryPanel ? (
        <div className="chat-history-panel">
          <div className="chat-history-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`chat-history-item ${s.id === activeSessionId ? 'active' : ''}`}
                onClick={() => { setActiveSessionId(s.id); setShowHistoryPanel(false); }}
              >
                <div className="chat-history-item-icon">💬</div>
                <div className="chat-history-item-body">
                  <div className="chat-history-item-top">
                    <span className="chat-history-item-title">
                      {s.id === activeSessionId && <span className="chat-status-dot chat-history-dot" />}
                      {s.title || (s.id === activeSessionId ? 'Current session' : 'New chat')}
                    </span>
                    <span className="chat-history-item-date">{formatDate(s.created_at)}</span>
                  </div>
                  <div className="chat-history-item-preview">
                    {s.preview || 'No messages yet'}
                  </div>
                  {s.message_count != null && (
                    <div className="chat-history-item-count">{s.message_count} messages</div>
                  )}
                </div>
                <button
                  type="button"
                  className="chat-history-item-delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                  aria-label="Delete this conversation"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="chat-history-new-button" onClick={handleNewChat}>
            + New Chat
          </button>
        </div>
      ) : justCleared ? (
        <div className="chat-cleared-state">
          <EmptyChatIcon />
          <div className="chat-cleared-title">Chat cleared</div>
          <div className="chat-cleared-subtitle">Start a new conversation or ask a question below.</div>
          <button type="button" className="chat-cleared-button" onClick={() => setJustCleared(false)}>
            Start new chat
          </button>
        </div>
      ) : (
        <>
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
              <div key={i} className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {renderFormattedText(m.text)}
                <div className={`chat-time ${m.role === 'user' ? 'chat-time-user' : ''}`}>{m.time}</div>
              </div>
            ))}

            {loading && <div className="chat-bubble chat-bubble-assistant">Thinking…</div>}
            <div ref={bottomRef} />
          </div>

          {speechError && <div className="chat-speech-error">{speechError}</div>}

          <div className="chat-input-row">
            <button
              type="button"
              className={`chat-mic-button ${micStatus}`}
              onClick={toggleRecording}
              disabled={micStatus === 'processing'}
              title={micTitle}
              aria-label={micStatus === 'listening' ? 'Stop recording' : 'Start voice input'}
            >
              {micStatus === 'listening' ? <StopIcon /> : micStatus === 'processing' ? <SpinnerIcon /> : <MicIcon />}
            </button>
            <textarea
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              rows={1}
            />
            <button className="chat-send-button" onClick={sendMessage} disabled={loading || !activeSessionId}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatWidget;