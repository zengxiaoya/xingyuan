import React, { useState, useRef, useEffect } from 'react'
import { useNovaStore } from '../store/novaStore.js'
import { streamChat } from '../utils/api.js'

export default function NovaDialog() {
  const {
    isOpen,
    messages,
    context,
    isThinking,
    quickReplies,
    closeNova,
    addMessage,
    setThinking,
    clearMessages
  } = useNovaStore()

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  async function handleSend(content) {
    const text = (content || inputValue).trim()
    if (!text || isThinking) return

    setInputValue('')
    addMessage('user', text)
    setThinking(true)

    const history = [
      ...messages.map((m) => ({ role: m.role === 'nova' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: text }
    ]

    let accumulated = ''
    try {
      for await (const chunk of streamChat(history, context)) {
        accumulated += chunk
        useNovaStore.setState((state) => {
          const lastMsg = state.messages[state.messages.length - 1]
          if (lastMsg && lastMsg.role === 'nova' && lastMsg._streaming) {
            const updated = state.messages.map((m, i) =>
              i === state.messages.length - 1
                ? { ...m, content: accumulated }
                : m
            )
            return { messages: updated }
          } else {
            return {
              messages: [
                ...state.messages,
                {
                  id: `msg_stream_${Date.now()}`,
                  role: 'nova',
                  content: accumulated,
                  timestamp: Date.now(),
                  _streaming: true
                }
              ]
            }
          }
        })
      }
      // 流结束，移除 _streaming 标记
      useNovaStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m._streaming ? { ...m, _streaming: false } : m
        )
      }))
    } catch {
      addMessage('nova', '抱歉，我现在无法连接到服务器。请检查网络后重试。')
    } finally {
      setThinking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="nova-overlay" onClick={(e) => e.target === e.currentTarget && closeNova()}>
      <div className="nova-dialog card fade-in">
        <div className="nova-header">
          <div className="nova-avatar float-animation">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="nova-bg" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="55%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </radialGradient>
                <radialGradient id="nova-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e0d7ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
                </radialGradient>
                <filter id="nova-glow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* 外圈光晕 */}
              <circle cx="22" cy="22" r="21" fill="url(#nova-bg)" />
              <circle cx="22" cy="22" r="21" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.6" />
              {/* 星星装饰 */}
              <circle cx="10" cy="10" r="1" fill="white" fillOpacity="0.8" />
              <circle cx="34" cy="8" r="0.7" fill="white" fillOpacity="0.6" />
              <circle cx="8" cy="32" r="0.6" fill="white" fillOpacity="0.5" />
              <circle cx="36" cy="34" r="0.9" fill="white" fillOpacity="0.7" />
              <circle cx="38" cy="18" r="0.6" fill="white" fillOpacity="0.4" />
              <circle cx="6" cy="20" r="0.7" fill="white" fillOpacity="0.5" />
              {/* 中央核心光球 */}
              <circle cx="22" cy="22" r="8" fill="url(#nova-core)" filter="url(#nova-glow)" />
              {/* 轨道环 */}
              <ellipse cx="22" cy="22" rx="14" ry="5.5" stroke="#c4b5fd" strokeWidth="0.8" strokeOpacity="0.5" fill="none" strokeDasharray="2 2" />
              <ellipse cx="22" cy="22" rx="5.5" ry="14" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.4" fill="none" strokeDasharray="2 3" />
              {/* 中心星点 */}
              <circle cx="22" cy="22" r="2.5" fill="white" fillOpacity="0.95" filter="url(#nova-glow)" />
              {/* 四芒星 */}
              <path d="M22 18.5 L22.6 21.4 L25.5 22 L22.6 22.6 L22 25.5 L21.4 22.6 L18.5 22 L21.4 21.4 Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div className="nova-title">
            <span className="nova-name" style={{ fontFamily: 'var(--font-english)', fontWeight: 700, color: 'var(--purple-300)' }}>NOVA</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>宇宙向导</span>
          </div>
          <button className="btn-ghost" onClick={closeNova} style={{ marginLeft: 'auto', padding: '0.4rem 0.6rem' }}>✕</button>
        </div>

        <div className="nova-messages">
          {messages.length === 0 && (
            <div className="nova-welcome">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                你好！我是 NOVA，你的宇宙探索向导。有什么关于宇宙的问题都可以问我！🌌
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`nova-msg nova-msg-${msg.role}`}>
              <div className="nova-msg-bubble">
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="nova-msg nova-msg-nova">
              <div className="nova-msg-bubble nova-thinking">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {quickReplies.length > 0 && (
          <div className="nova-quick-replies">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="nova-input-row">
          <input
            ref={inputRef}
            className="nova-input"
            type="text"
            placeholder="问问 NOVA..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
          />
          <button
            className="btn-primary"
            style={{ padding: '0.6rem 1.2rem', flexShrink: 0 }}
            onClick={() => handleSend()}
            disabled={isThinking || !inputValue.trim()}
          >
            发送
          </button>
        </div>
      </div>

      <style>{`
        .nova-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 1.5rem;
          pointer-events: none;
        }
        .nova-dialog {
          pointer-events: all;
          width: 380px;
          max-width: calc(100vw - 2rem);
          height: 520px;
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
          overflow: hidden;
        }
        .nova-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--card-border);
          flex-shrink: 0;
        }
        .nova-avatar {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.6));
        }
        .nova-title {
          display: flex;
          flex-direction: column;
        }
        .nova-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .nova-welcome {
          padding: 0.5rem 0;
        }
        .nova-msg {
          display: flex;
        }
        .nova-msg-nova {
          justify-content: flex-start;
        }
        .nova-msg-user {
          justify-content: flex-end;
        }
        .nova-msg-bubble {
          max-width: 80%;
          padding: 0.65rem 1rem;
          border-radius: 16px;
          font-size: 0.875rem;
          line-height: 1.6;
          word-break: break-word;
        }
        .nova-msg-nova .nova-msg-bubble {
          background: rgba(127, 119, 221, 0.15);
          border: 1px solid rgba(127, 119, 221, 0.2);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .nova-msg-user .nova-msg-bubble {
          background: linear-gradient(135deg, var(--purple-400), var(--blue-400));
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .nova-thinking {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0.75rem 1rem;
        }
        @keyframes thinkingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .thinking-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--purple-300);
          animation: thinkingBounce 1s ease-in-out infinite;
        }
        .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
        .nova-quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          border-top: 1px solid var(--card-border);
          flex-shrink: 0;
        }
        .nova-input-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--card-border);
          flex-shrink: 0;
        }
        .nova-input {
          flex: 1;
          padding: 0.6rem 1rem;
          background: rgba(127, 119, 221, 0.08);
          border: 1px solid var(--card-border);
          border-radius: 50px;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: border-color var(--transition);
        }
        .nova-input:focus {
          border-color: var(--purple-400);
        }
        .nova-input::placeholder {
          color: var(--text-muted);
        }
        .nova-input:disabled {
          opacity: 0.6;
        }
        @media (max-width: 480px) {
          .nova-overlay {
            padding: 0;
            align-items: flex-end;
            justify-content: center;
          }
          .nova-dialog {
            width: 100%;
            max-width: 100%;
            height: 60vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
        }
      `}</style>
    </div>
  )
}
