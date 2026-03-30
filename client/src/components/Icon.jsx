/**
 * SVG Icon library for 星渊
 * Usage: <Icon name="star" size={24} color="#EF9F27" />
 */
export default function Icon({ name, size = 24, color = 'currentColor', style }) {
  const props = { width: size, height: size, fill: 'none', viewBox: '0 0 24 24', style }
  switch (name) {
    case 'star':
      return (
        <svg {...props} fill={color}>
          <polygon points="12,2.5 14.09,8.26 20.5,9.27 16,14.14 17.18,20.5 12,17.77 6.82,20.5 8,14.14 3.5,9.27 9.91,8.26" />
        </svg>
      )
    case 'star-outline':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" fill="none">
          <polygon points="12,2.5 14.09,8.26 20.5,9.27 16,14.14 17.18,20.5 12,17.77 6.82,20.5 8,14.14 3.5,9.27 9.91,8.26" />
        </svg>
      )
    case 'trophy':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
          <path d="M4 4h3M17 4h3M4 4v3a3 3 0 003 3M20 4v3a3 3 0 01-3 3" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="8" y1="21" x2="16" y2="21" />
        </svg>
      )
    case 'telescope':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="14" x2="10" y2="20" />
          <line x1="12" y1="14" x2="14" y2="20" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <path d="M3 9l3 1.5 12-4.5-1 3L5 13z" />
          <ellipse cx="13.5" cy="10.5" rx="3" ry="1.5" transform="rotate(-18 13.5 10.5)" />
        </svg>
      )
    case 'rocket':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2s4 2 4 8v4l2 2v2h-4s0-2-2-2-2 2-2 2H6v-2l2-2v-4c0-6 4-8 4-8z" />
          <circle cx="12" cy="10" r="1.5" fill={color} stroke="none" />
        </svg>
      )
    case 'galaxy':
      return (
        <svg {...props} stroke={color} strokeWidth="1.2" fill="none">
          <ellipse cx="12" cy="12" rx="9" ry="3.5" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-60 12 12)" />
          <circle cx="12" cy="12" r="2" fill={color} opacity=".6" stroke="none" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" fill={color} opacity=".15" />
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" />
        </svg>
      )
    case 'medal':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="9" r="5" />
          <path d="M9 14.5L7 21l5-2 5 2-2-6.5" />
          <circle cx="12" cy="9" r="2" fill={color} opacity=".4" stroke="none" />
        </svg>
      )
    case 'circle-empty':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" fill="none">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )
    case 'check-circle':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="16,9 11,15 8,12" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6M10 21h4" />
          <path d="M12 2a7 7 0 00-4 12.8V16h8v-1.2A7 7 0 0012 2z" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill={color} opacity=".2" stroke={color} strokeWidth="1.2" />
          <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      )
    case 'graduation':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,3 22,9 12,15 2,9" />
          <polyline points="6,11.5 6,17 12,20 18,17 18,11.5" />
        </svg>
      )
    case 'question':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 015 .5c0 2-2.5 2.5-2.5 5" />
          <circle cx="12" cy="17.5" r=".8" fill={color} stroke="none" />
        </svg>
      )
    case 'bot':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="12" rx="3" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <circle cx="12" cy="4" r="1.5" />
          <circle cx="8.5" cy="13" r="1.5" />
          <circle cx="15.5" cy="13" r="1.5" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
          <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
        </svg>
      )
    case 'puzzle':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2h4v4a2 2 0 000 4h-4v4h-4a2 2 0 01-4-2v-2h4a2 2 0 000-4V2h4z" />
          <path d="M16 10h4a2 2 0 010 4h-4v4a2 2 0 01-2 2h-2v-4a2 2 0 00-4 0v4H6a2 2 0 01-2-2v-4h4a2 2 0 000-4H4V6a2 2 0 012-2" />
        </svg>
      )
    case 'thought':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <path d="M4.5 14.5A7.5 7.5 0 0112 4.5a7.5 7.5 0 010 15H5.5a1 1 0 01-1-1v-4z" />
          <circle cx="18.5" cy="17.5" r="1.5" />
          <circle cx="21.5" cy="20.5" r="1" />
        </svg>
      )
    case 'orbit':
      return (
        <svg {...props} stroke={color} strokeWidth="1.2" fill="none">
          <circle cx="12" cy="12" r="2.5" fill={color} opacity=".5" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="4" />
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-60 12 12)" />
        </svg>
      )
    case 'microscope':
      return (
        <svg {...props} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="22" x2="18" y2="22" />
          <line x1="12" y1="22" x2="12" y2="15" />
          <rect x="9" y="4" width="6" height="11" rx="1" />
          <line x1="12" y1="4" x2="12" y2="2" />
          <path d="M6 15a6 6 0 0012 0" />
        </svg>
      )
    default:
      return null
  }
}
