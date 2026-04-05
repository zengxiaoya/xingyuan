import React, { useState, useRef, useEffect } from 'react'
import { useNovaStore } from '../store/novaStore.js'
import { useUserStore } from '../store/userStore.js'
import { streamChat } from '../utils/api.js'
import { isXfyunConfigured, startRecognition } from '../utils/xfyunIAT.js'

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

  const user = useUserStore(s => s.user)
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [volume, setVolume] = useState(0)
  const [listenSeconds, setListenSeconds] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const voiceCtrlRef = useRef(null)
  const accumulatedRef = useRef('')
  const listenTimerRef = useRef(null)
  const listenStartRef = useRef(null)

  // 只要配置了讯飞凭证 + 浏览器支持 getUserMedia 就显示麦克风
  const supportsSpeech = typeof window !== 'undefined' && isXfyunConfigured() && !!navigator.mediaDevices?.getUserMedia

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
      for await (const chunk of streamChat(history, context, user)) {
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

  async function toggleVoice() {
    if (isListening) {
      voiceCtrlRef.current?.stop()
      voiceCtrlRef.current = null
      setIsListening(false)
      setVolume(0)
      setListenSeconds(0)
      clearInterval(listenTimerRef.current)
      listenStartRef.current = null
      return
    }

    accumulatedRef.current = ''
    setIsListening(true)
    setVolume(0)
    setListenSeconds(0)
    listenStartRef.current = Date.now()

    // 每秒更新录音时长
    listenTimerRef.current = setInterval(() => {
      if (listenStartRef.current) {
        const elapsed = Math.floor((Date.now() - listenStartRef.current) / 1000)
        setListenSeconds(elapsed)
        // 超过55秒自动停止
        if (elapsed >= 55) {
          voiceCtrlRef.current?.stop()
          voiceCtrlRef.current = null
          setIsListening(false)
          setVolume(0)
          setListenSeconds(0)
          clearInterval(listenTimerRef.current)
          listenStartRef.current = null
        }
      }
    }, 1000)

    const ctrl = await startRecognition({
      onResult(text) {
        console.log('语音识别:', text)
        accumulatedRef.current += text
        setInputValue(accumulatedRef.current)
      },
      onVolume(v) {
        setVolume(v)
      },
      onError(err) {
        console.warn('语音识别错误:', err)
        setIsListening(false)
        setVolume(0)
        setListenSeconds(0)
        voiceCtrlRef.current = null
        clearInterval(listenTimerRef.current)
        listenStartRef.current = null
      }
    })

    voiceCtrlRef.current = ctrl
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      voiceCtrlRef.current?.stop()
      clearInterval(listenTimerRef.current)
    }
  }, [])

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

        {isListening ? (
          /* ===== 录音模式：全宽声波界面 ===== */
          <div className="nova-voice-panel">
            <div className="nova-voice-rings" style={{ '--vol': volume, '--warn': listenSeconds >= 50 ? 1 : 0 }}>
              <span className="ring ring-1" />
              <span className="ring ring-2" />
              <span className="ring ring-3" />
              <span className="ring ring-4" />
              <button className="nova-voice-stop" onClick={toggleVoice} aria-label="停止录音">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>
            <span className="nova-voice-timer">{listenSeconds}s / 60s</span>
            <span className="nova-voice-text">点击停止录音</span>
          </div>
        ) : (
          /* ===== 普通输入模式 ===== */
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
            {supportsSpeech && (
              <button className="nova-voice-btn" onClick={toggleVoice} aria-label="开始语音输入">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="1" width="6" height="12" rx="3" />
                  <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}
            <button
              className="btn-primary"
              style={{ padding: '0.6rem 1.2rem', flexShrink: 0 }}
              onClick={() => handleSend()}
              disabled={isThinking || !inputValue.trim()}
            >
              发送
            </button>
          </div>
        )}
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
          background: radial-gradient(circle at 100% 100%, rgba(127,119,221,.12), transparent 30%), rgba(3,1,14,.36);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .nova-dialog {
          pointer-events: all;
          width: 380px;
          max-width: calc(100vw - 2rem);
          height: 100%;
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at top right, rgba(127,119,221,.12), transparent 34%),
            linear-gradient(180deg, rgba(18,12,40,.96), rgba(8,5,22,.96));
          box-shadow: 0 24px 50px rgba(0,0,0,.45), 0 0 0 1px rgba(127,119,221,.12);
          animation: novaSlideIn .35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes novaSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nova-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--card-border);
          flex-shrink: 0;
          background: linear-gradient(180deg, rgba(127,119,221,.08), rgba(127,119,221,0));
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
          box-shadow: 0 10px 20px rgba(7, 4, 28, 0.22);
          animation: fadeIn .25s ease;
        }
        .nova-msg-nova .nova-msg-bubble {
          background: linear-gradient(180deg, rgba(127, 119, 221, 0.18), rgba(127, 119, 221, 0.1));
          border: 1px solid rgba(127, 119, 221, 0.22);
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
          background: rgba(10, 7, 28, 0.45);
        }
        .nova-input-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--card-border);
          flex-shrink: 0;
          background: rgba(7, 4, 22, 0.65);
        }
        .nova-input {
          flex: 1;
          padding: 0.6rem 1rem;
          background: rgba(127, 119, 221, 0.1);
          border: 1px solid var(--card-border);
          border-radius: 50px;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
        }
        .nova-input:focus {
          border-color: var(--purple-400);
          box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12);
          background: rgba(127, 119, 221, 0.14);
        }
        .nova-input::placeholder {
          color: var(--text-muted);
        }
        .nova-input:disabled {
          opacity: 0.6;
        }
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(224, 85, 85, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(224, 85, 85, 0); }
        }
        .nova-voice-btn {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid var(--card-border);
          background: transparent;
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: all var(--transition);
        }
        .nova-voice-btn:hover {
          border-color: #0066FF;
          color: #0066FF;
          background: rgba(0, 102, 255, 0.08);
        }
        /* 录音面板 */
        .nova-voice-panel {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 1.5rem 1.25rem; gap: 0.75rem;
          border-top: 1px solid var(--card-border);
          flex-shrink: 0;
          background: rgba(7, 4, 22, 0.65);
          position: relative;
          overflow: hidden;
        }
        .nova-voice-rings {
          position: relative; width: 120px; height: 120px;
          display: flex; align-items: center; justify-content: center;
        }
        .ring {
          position: absolute; border-radius: 50%;
          border: 2px solid rgba(0, 102, 255, 0.35);
          animation: ringExpand 2s ease-out infinite;
          transition: border-color 0.5s;
        }
        .nova-voice-rings[style*="--warn: 1"] .ring {
          border-color: rgba(251, 191, 36, 0.5);
        }
        .ring-1 { width: 48px; height: 48px; animation-delay: 0s; }
        .ring-2 { width: 48px; height: 48px; animation-delay: 0.4s; }
        .ring-3 { width: 48px; height: 48px; animation-delay: 0.8s; }
        .ring-4 { width: 48px; height: 48px; animation-delay: 1.2s; }
        @keyframes ringExpand {
          0% { transform: scale(1); opacity: calc(0.15 + var(--vol, 0) * 0.55); border-width: calc(1.5px + var(--vol, 0) * 2px); }
          100% { transform: scale(calc(2.2 + var(--vol, 0) * 0.8)); opacity: 0; }
        }
        .nova-voice-rings[style*="--warn: 1"] .ring {
          animation-name: ringExpandWarn;
        }
        @keyframes ringExpandWarn {
          0% { transform: scale(1); opacity: 0.6; border-width: 3px; }
          100% { transform: scale(3); opacity: 0; }
        }
        .nova-voice-stop {
          position: absolute; z-index: 2;
          width: 52px; height: 52px; border-radius: 50%;
          border: 2px solid #0066FF;
          background: rgba(0, 102, 255, 0.12);
          color: #0066FF;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(0, 102, 255, 0.2);
        }
        .nova-voice-stop:hover {
          background: rgba(0, 102, 255, 0.25);
          box-shadow: 0 0 30px rgba(0, 102, 255, 0.35);
        }
        .nova-voice-rings[style*="--warn: 1"] .nova-voice-stop {
          border-color: var(--yellow-400);
          background: rgba(251, 191, 36, 0.15);
          color: var(--yellow-400);
          box-shadow: 0 0 25px rgba(251, 191, 36, 0.3);
          animation: warnPulse 0.8s ease-in-out infinite;
        }
        @keyframes warnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .nova-voice-timer {
          font-size: 0.8rem; color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .nova-voice-rings[style*="--warn: 1"] ~ .nova-voice-timer {
          color: var(--yellow-400);
        }
        .nova-voice-text {
          font-size: 0.7rem; color: var(--text-muted); opacity: 0.7;
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
            height: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .nova-input-row {
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          }
        }
        /* iOS keyboard support */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .nova-dialog {
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }
      `}</style>
    </div>
  )
}
