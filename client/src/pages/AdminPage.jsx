import React, { useState, useEffect, useCallback, useRef } from 'react'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── 拖拽验证滑块 ──────────────────────────────────────────────────────────────

function DragSlider({ onVerified }) {
  const trackRef = useRef()
  const [pos, setPos] = useState(0)        // 0~1
  const [verified, setVerified] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)

  const HANDLE_W = 44
  const THRESHOLD = 0.85

  function getTrackW() {
    return (trackRef.current?.offsetWidth || 280) - HANDLE_W
  }

  function onStart(clientX) {
    if (verified) return
    dragging.current = true
    startX.current = clientX - pos * getTrackW()
  }

  function onMove(clientX) {
    if (!dragging.current || verified) return
    const raw = (clientX - startX.current) / getTrackW()
    const clamped = Math.min(1, Math.max(0, raw))
    setPos(clamped)
    if (clamped >= THRESHOLD) {
      dragging.current = false
      setPos(1)
      setVerified(true)
      onVerified()
    }
  }

  function onEnd() {
    if (!verified) { dragging.current = false; setPos(0) }
  }

  useEffect(() => {
    const mm = e => onMove(e.clientX)
    const tm = e => onMove(e.touches[0].clientX)
    const up = () => onEnd()
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', tm, { passive: true })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', up)
    }
  })

  return (
    <div ref={trackRef} style={{
      position: 'relative', height: `${HANDLE_W}px`,
      background: verified ? 'rgba(29,158,117,.15)' : 'rgba(20,15,50,.8)',
      border: `1px solid ${verified ? 'rgba(29,158,117,.5)' : C.border}`,
      borderRadius: '8px', overflow: 'hidden', userSelect: 'none',
      marginBottom: '12px', cursor: verified ? 'default' : 'pointer',
    }}>
      {/* 进度条填充 */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `calc(${pos * 100}% + ${HANDLE_W * pos}px)`,
        background: verified ? 'rgba(29,158,117,.2)' : 'rgba(127,119,221,.12)',
        transition: dragging.current ? 'none' : 'width .3s',
        pointerEvents: 'none',
      }} />
      {/* 文字 */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.8rem',
        color: verified ? '#1D9E75' : C.muted,
        pointerEvents: 'none', paddingLeft: `${HANDLE_W}px`,
      }}>
        {verified ? '✓ 验证成功' : '向右拖动完成验证'}
      </div>
      {/* 拖动手柄 */}
      <div
        style={{
          position: 'absolute', left: `${pos * getTrackW()}px`, top: 0,
          width: `${HANDLE_W}px`, height: `${HANDLE_W}px`,
          background: verified ? '#1D9E75' : C.accent,
          borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: verified ? 'default' : 'grab', transition: dragging.current ? 'none' : 'left .3s, background .3s',
          boxShadow: '2px 0 8px rgba(0,0,0,.3)',
          fontSize: '1rem', color: '#fff',
        }}
        onMouseDown={e => onStart(e.clientX)}
        onTouchStart={e => onStart(e.touches[0].clientX)}
      >
        {verified ? '✓' : '›'}
      </div>
    </div>
  )
}

const TOKEN_KEY = 'xingyuan_admin_token'
const API = '/api/admin'

const C = {
  bg: '#03010e',
  card: 'rgba(6,3,24,.95)',
  border: 'rgba(127,119,221,.2)',
  accent: '#7F77DD',
  text: '#EEEDFE',
  muted: 'rgba(175,169,236,.6)',
  success: '#1D9E75',
  danger: '#e05555',
  warn: '#EF9F27',
  input: 'rgba(20,15,50,.8)',
}

async function apiFetch(path, method = 'GET', body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

// ── 登录界面 ──────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sliderOk, setSliderOk] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sliderOk) return
    setLoading(true); setError('')
    try {
      const hashed = await sha256(password)
      await onLogin(hashed)
    }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px', padding: '2.5rem',
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,.7)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌌</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text }}>星渊管理后台</div>
          <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: '4px', letterSpacing: '.1em' }}>XINGYUAN ADMIN</div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password" placeholder="管理员密码"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: '12px' }}
            autoFocus
          />
          <DragSlider onVerified={() => setSliderOk(true)} />
          {error && <div style={{ color: C.danger, fontSize: '0.8rem', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" disabled={loading || !sliderOk} style={{
            width: '100%', padding: '10px', background: C.accent,
            border: 'none', borderRadius: '8px', color: '#fff',
            fontSize: '0.9rem', fontWeight: 600,
            cursor: (loading || !sliderOk) ? 'not-allowed' : 'pointer',
            opacity: (loading || !sliderOk) ? 0.5 : 1,
            transition: 'opacity .3s',
          }}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── 确认对话框 ────────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  async function handleConfirm() {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '340px' }}>
        <div style={{ color: C.text, lineHeight: 1.7, marginBottom: '1.5rem' }}>{message}</div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnSecondary}>取消</button>
          <button onClick={handleConfirm} disabled={loading}
            style={{ ...btnBase, background: C.danger, color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? '处理中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 编辑用户弹窗 ──────────────────────────────────────────────────────────────

function EditModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ name: user.name, school: user.school, grade: user.grade, avatar: user.avatar })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true); setError('')
    try { await onSave(user.id, form); onClose() }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: '1rem', marginBottom: '1.25rem' }}>编辑用户</div>
        {[['姓名', 'name'], ['学校', 'school'], ['年级', 'grade']].map(([label, field]) => (
          <div key={field} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: C.muted, marginBottom: '4px' }}>{label}</label>
            <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={inputStyle} />
          </div>
        ))}
        {error && <div style={{ color: C.danger, fontSize: '0.8rem', marginBottom: '8px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} style={btnSecondary}>取消</button>
          <button onClick={handleSave} disabled={loading}
            style={{ ...btnBase, background: C.accent, color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 创意答案弹窗 ──────────────────────────────────────────────────────────────

function AnswersModal({ user, onClose }) {
  const entries = Object.entries(user.creative_answers || {})
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ color: C.text, fontWeight: 600 }}>
            {user.avatar} {user.name} 的创意答案
          </div>
          <button onClick={onClose} style={{ ...btnSecondary, padding: '2px 10px' }}>关闭</button>
        </div>
        {entries.length === 0
          ? <div style={{ color: C.muted, textAlign: 'center', padding: '2rem' }}>暂无创意答案</div>
          : entries.map(([levelId, answer]) => (
            <div key={levelId} style={{ marginBottom: '1rem', padding: '12px', background: 'rgba(127,119,221,.06)', borderRadius: '8px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '0.75rem', color: C.accent, marginBottom: '6px' }}>{levelId}</div>
              <div style={{ color: C.text, fontSize: '0.88rem', lineHeight: 1.6 }}>{answer}</div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [answersUser, setAnswersUser] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const fetchUsers = useCallback(async () => {
    if (!token) return
    setLoading(true); setError('')
    try {
      setUsers(await apiFetch('/users', 'GET', null, token))
    } catch (err) {
      if (err.message.includes('过期') || err.message.includes('授权')) {
        sessionStorage.removeItem(TOKEN_KEY); setToken(null)
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function login(password) {
    const data = await apiFetch('/login', 'POST', { password })
    sessionStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY); setToken(null); setUsers([])
  }

  async function handleEdit(id, form) {
    await apiFetch(`/users/${id}`, 'PUT', form, token)
    await fetchUsers()
  }

  function confirmAction(message, action) {
    setConfirm({ message, action })
  }

  function handleDelete(id, name) {
    confirmAction(`确定删除「${name}」？用户信息及所有学习记录将一并删除，不可撤销。`, async () => {
      await apiFetch(`/users/${id}`, 'DELETE', null, token)
      setConfirm(null); await fetchUsers()
    })
  }

  function handleResetProgress(userId, name) {
    confirmAction(`确定重置「${name}」的学习进度？星星、关卡、科学家记录将全部清空。`, async () => {
      await apiFetch(`/progress/${userId}`, 'DELETE', null, token)
      setConfirm(null); await fetchUsers()
    })
  }

  if (!token) return <LoginScreen onLogin={login} />

  const filtered = search
    ? users.filter(u => u.name.includes(search) || u.school.includes(search) || u.grade.includes(search))
    : users

  const totalStars = users.reduce((s, u) => s + (u.stars || 0), 0)
  const totalBadges = users.reduce((s, u) => s + (u.badges?.length || 0), 0)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: 'system-ui, sans-serif', color: C.text }}>

      {/* ── Header ── */}
      <div style={{
        background: 'rgba(6,3,24,.98)', borderBottom: `1px solid ${C.border}`,
        padding: '0 1.5rem', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🌌</span>
          <span style={{ fontWeight: 700, color: C.text }}>星渊管理后台</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              { label: '用户总数', value: users.length, color: C.accent },
              { label: '总星星', value: totalStars, color: C.warn },
              { label: '总通关次数', value: totalBadges, color: C.success },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: C.muted, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={logout} style={btnSecondary}>退出登录</button>
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem' }}>

        {/* 搜索栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            placeholder="搜索姓名、学校、年级..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '280px' }}
          />
          <span style={{ color: C.muted, fontSize: '0.8rem' }}>共 {filtered.length} 名用户</span>
          <button onClick={fetchUsers} style={{ ...btnSecondary, marginLeft: 'auto' }}>↻ 刷新</button>
        </div>

        {error && <div style={{ color: C.danger, marginBottom: '1rem', fontSize: '0.85rem' }}>⚠ {error}</div>}

        {/* 表格 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: C.muted }}>加载中...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(127,119,221,.07)', borderBottom: `1px solid ${C.border}` }}>
                  {['头像', '姓名', '学校', '年级', '⭐ 星星', '通关进度', '科学家', '创意答案', '注册时间', '最后活跃', '操作'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: C.muted, fontWeight: 500, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '4rem', color: C.muted }}>
                    {search ? '没有匹配的用户' : '暂无用户数据'}
                  </td></tr>
                )}
                {filtered.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(127,119,221,.07)` : 'none', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={td}><span style={{ fontSize: '1.5rem' }}>{u.avatar}</span></td>
                    <td style={{ ...td, fontWeight: 600, color: C.text }}>{u.name}</td>
                    <td style={{ ...td, color: C.muted }}>{u.school || <span style={{ opacity: 0.4 }}>-</span>}</td>
                    <td style={{ ...td, color: C.muted }}>{u.grade || <span style={{ opacity: 0.4 }}>-</span>}</td>
                    <td style={td}><span style={{ color: C.warn, fontWeight: 700 }}>{u.stars ?? '-'}</span></td>
                    <td style={td}>
                      <span style={{ color: u.badges?.length ? C.success : C.muted }}>
                        {u.badges?.length ?? 0} / 9
                      </span>
                    </td>
                    <td style={{ ...td, color: C.muted }}>{u.scientists?.length ?? 0} / 13</td>
                    <td style={td}>
                      {Object.keys(u.creative_answers || {}).length > 0
                        ? <button onClick={() => setAnswersUser(u)} style={{ ...actionBtn, color: C.accent }}>
                            查看 ({Object.keys(u.creative_answers).length})
                          </button>
                        : <span style={{ color: C.muted, opacity: 0.4 }}>-</span>
                      }
                    </td>
                    <td style={{ ...td, color: C.muted, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ ...td, color: C.muted, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtDate(u.last_active)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setEditUser(u)} style={actionBtn}>编辑</button>
                        <button onClick={() => handleResetProgress(u.id, u.name)}
                          style={{ ...actionBtn, color: C.warn, borderColor: 'rgba(239,159,39,.3)' }}>重置</button>
                        <button onClick={() => handleDelete(u.id, u.name)}
                          style={{ ...actionBtn, color: C.danger, borderColor: 'rgba(224,85,85,.3)' }}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {editUser    && <EditModal user={editUser} onSave={handleEdit} onClose={() => setEditUser(null)} />}
      {answersUser && <AnswersModal user={answersUser} onClose={() => setAnswersUser(null)} />}
      {confirm     && <ConfirmDialog message={confirm.message} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '-'
  return str.slice(0, 16).replace('T', ' ')
}

// ── 样式常量 ──────────────────────────────────────────────────────────────────

const inputStyle = {
  padding: '8px 12px', background: C.input,
  border: `1px solid ${C.border}`, borderRadius: '8px',
  color: C.text, fontSize: '0.88rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
}

const modalStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: '14px', padding: '1.75rem', width: '90%', maxWidth: '400px',
  boxShadow: '0 12px 48px rgba(0,0,0,.7)',
}

const btnBase = {
  padding: '7px 16px', borderRadius: '7px', border: 'none',
  cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500,
}

const btnSecondary = {
  ...btnBase, background: 'transparent',
  border: `1px solid rgba(127,119,221,.3)`, color: 'rgba(175,169,236,.8)',
}

const td = { padding: '11px 14px' }

const actionBtn = {
  padding: '3px 10px', borderRadius: '5px',
  border: `1px solid rgba(127,119,221,.25)`,
  background: 'transparent', color: C.accent,
  fontSize: '0.75rem', cursor: 'pointer',
  whiteSpace: 'nowrap',
}
