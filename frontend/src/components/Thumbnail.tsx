// Simple inline SVG thumbnails per instrument type.

interface Props {
  type: string
}

const stroke = '#3a3a3a'

export function Thumbnail({ type }: Props) {
  switch (type) {
    case 'samrat':
      // equinoctial triangle gnomon + quadrant
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <polygon points="8,36 44,36 8,8" fill="#dddddd" stroke={stroke} strokeWidth="1.5" />
          <path d="M44 36 A 36 36 0 0 1 52 20" fill="none" stroke={stroke} strokeWidth="1.5" />
          <path d="M44 36 A 36 36 0 0 0 52 20" fill="none" stroke={stroke} strokeWidth="1.5" />
          <line x1="44" y1="36" x2="60" y2="8" stroke={stroke} strokeWidth="1" />
        </svg>
      )
    case 'dakshinottara_bhitti':
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <rect x="8" y="6" width="48" height="30" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <path d="M14 36 V12 A 24 24 0 0 1 44 12 V36" fill="none" stroke={stroke} strokeWidth="2" />
        </svg>
      )
    case 'rama':
      // cylindrical
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <ellipse cx="32" cy="12" rx="18" ry="6" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <line x1="14" y1="12" x2="14" y2="36" stroke={stroke} strokeWidth="1.5" />
          <line x1="50" y1="12" x2="50" y2="36" stroke={stroke} strokeWidth="1.5" />
          <line x1="32" y1="12" x2="32" y2="30" stroke={stroke} strokeWidth="1" />
          <circle cx="32" cy="30" r="3" fill="none" stroke={stroke} />
        </svg>
      )
    case 'digamsa':
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <circle cx="32" cy="24" r="16" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="24" r="9" fill="none" stroke={stroke} strokeWidth="1" />
          <line x1="32" y1="24" x2="32" y2="4" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    case 'nadi_valaya':
      // two-faced disc
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <circle cx="32" cy="20" r="14" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <line x1="24" y1="13" x2="40" y2="27" stroke="#171717" strokeWidth="2" />
          <line x1="32" y1="20" x2="45" y2="20" stroke={stroke} strokeWidth="1" />
        </svg>
      )
    case 'chaapa':
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <path d="M10 34 A 30 30 0 0 1 54 34" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="32" y1="34" x2="32" y2="8" stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="8" r="3" fill="none" stroke={stroke} />
        </svg>
      )
    case 'palaka':
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <rect x="8" y="12" width="48" height="18" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <line x1="32" y1="12" x2="32" y2="30" stroke={stroke} strokeWidth="1" />
          <line x1="20" y1="16" x2="44" y2="22" stroke={stroke} strokeWidth="1" />
        </svg>
      )
    case 'dhruva_protha_chakra':
      // ring on a polar axis + sighting needle
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <circle cx="32" cy="20" r="13" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          <line x1="32" y1="20" x2="32" y2="4" stroke="#171717" strokeWidth="2" />
          <line x1="32" y1="20" x2="42" y2="10" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    case 'yantra_samrat':
      // gnomon triangle + coaxial ring
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <polygon points="8,36 40,36 8,12" fill="#dddddd" stroke={stroke} strokeWidth="1.5" />
          <circle cx="40" cy="20" r="9" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    case 'gola_chakra':
      // armillary sphere: concentric rings
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <circle cx="32" cy="20" r="15" fill="none" stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="32" cy="20" rx="15" ry="5.5" fill="none" stroke={stroke} strokeWidth="1" />
          <ellipse cx="32" cy="20" rx="8" ry="15" fill="none" stroke="#171717" strokeWidth="1" transform="rotate(-20 32 20)" />
          <line x1="24" y1="34" x2="40" y2="6" stroke={stroke} strokeWidth="1" />
        </svg>
      )
    case 'bhitti':
      // mural quadrant quarter-arc
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <line x1="12" y1="34" x2="54" y2="34" stroke={stroke} strokeWidth="1.5" />
          <line x1="12" y1="34" x2="12" y2="6" stroke={stroke} strokeWidth="1.5" />
          <path d="M 12 34 A 30 30 0 0 1 42 6" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="12" y1="34" x2="33" y2="8" stroke="#171717" strokeWidth="1" />
        </svg>
      )
    case 'rasivalaya':
      // twelve zodiac dials around a wheel
      return (
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <circle cx="32" cy="20" r="15" fill="#e8e8e8" stroke={stroke} strokeWidth="1.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            const x = 32 + Math.cos(a) * 11
            const y = 20 + Math.sin(a) * 11
            return <circle key={i} cx={x} cy={y} r="1.6" fill="#171717" />
          })}
        </svg>
      )
    default:
      return <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />
  }
}
