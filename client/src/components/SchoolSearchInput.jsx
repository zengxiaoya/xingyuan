import { useState, useRef, useEffect } from 'react'
import { SUZHOU_SCHOOLS } from '../data/suzhouSchools.js'

/**
 * 带搜索功能的学校选择组件
 */
export function SchoolSearchInput({ value, onChange, placeholder = '搜索学校名称', style = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // 过滤学校列表
  const filteredSchools = searchTerm.trim() === ''
    ? []
    : SUZHOU_SCHOOLS.filter(school =>
        school.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 20) // 限制显示数量

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 处理键盘导航
  useEffect(() => {
    if (!isOpen || selectedIndex === -1) return

    // 滚动到选中项
    const items = listRef.current?.querySelectorAll('[role="option"]')
    if (items && items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, isOpen])

  function handleKeyDown(e) {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredSchools.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? filteredSchools.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredSchools[selectedIndex]) {
          handleSelectSchool(filteredSchools[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  function handleInputChange(e) {
    setSearchTerm(e.target.value)
    setIsOpen(true)
    setSelectedIndex(-1)

    // 如果搜索框清空，也清空选中的学校
    if (e.target.value.trim() === '') {
      onChange?.('')
    }
  }

  function handleSelectSchool(school) {
    onChange?.(school)
    setSearchTerm('')
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  function handleClear() {
    onChange?.('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} style={{ position:'relative', ...style }}>
      <div style={{ position:'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value || placeholder}
          style={{
            width:'100%',
            padding:'0.65rem 2.2rem 0.65rem 1rem',
            background:'rgba(127,119,221,0.08)',
            border:'1px solid rgba(127,119,221,0.3)',
            borderRadius:'10px',
            color:'#EEEDFE',
            fontSize:'1rem',
            outline:'none',
            transition:'border-color 0.2s',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            onMouseDown={e => e.preventDefault()}
            style={{
              position:'absolute',
              right:'0.6rem',
              top:'50%',
              transform:'translateY(-50%)',
              background:'none',
              border:'none',
              color:'#AFA9EC',
              cursor:'pointer',
              fontSize:'1.2rem',
              padding:'0 0.3rem',
              display:'flex',
              alignItems:'center',
            }}
            title="清除"
          >
            ×
          </button>
        )}
        {!value && (
          <span style={{
            position:'absolute',
            right:'0.8rem',
            top:'50%',
            transform:'translateY(-50%)',
            color:'#534AB7',
            pointerEvents:'none',
            fontSize:'1.2rem',
          }}>
            🔍
          </span>
        )}
      </div>

      {/* 下拉列表 */}
      {isOpen && filteredSchools.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position:'absolute',
            top:'100%',
            left:0,
            right:0,
            marginTop:'4px',
            maxHeight:'280px',
            overflowY:'auto',
            background:'rgba(38,33,92,0.98)',
            border:'1px solid rgba(127,119,221,0.4)',
            borderRadius:'10px',
            boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
            zIndex:1000,
            backdropFilter:'blur(12px)',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {filteredSchools.map((school, index) => (
            <div
              key={school}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelectSchool(school)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding:'0.75rem 1rem',
                cursor:'pointer',
                color:'#EEEDFE',
                fontSize:'0.95rem',
                transition:'background 0.15s',
                background:index === selectedIndex ? 'rgba(127,119,221,0.3)' : 'transparent',
                borderBottom:index < filteredSchools.length - 1 ? '1px solid rgba(127,119,221,0.15)' : 'none',
              }}
            >
              {highlightMatch(school, searchTerm)}
            </div>
          ))}
          {searchTerm && filteredSchools.length === 0 && (
            <div style={{
              padding:'1rem',
              textAlign:'center',
              color:'#534AB7',
              fontSize:'0.9rem',
            }}>
              未找到匹配的学校
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 高亮匹配文字
 */
function highlightMatch(text, searchTerm) {
  if (!searchTerm.trim()) return text

  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => (
    <span key={index}>
      {regex.test(part) ? (
        <span style={{
          color:'#EF9F27',
          fontWeight:600,
        }}>
          {part}
        </span>
      ) : (
        part
      )}
    </span>
  ))
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
