interface Props {
  size?: number
}

export default function YantraLogo({ size = 34 }: Props) {
  return (
    <svg
      className="om-logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Yantra AI"
    >
      {/* Outer circle — celestial sphere */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Inner triangle — gnomon of Samrat Yantra */}
      <polygon
        points="32,8 52,52 12,52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Horizontal base arc — quadrant */}
      <path
        d="M14 50 Q32 58 50 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Centre dot — observer's position */}
      <circle cx="32" cy="32" r="2.5" fill="currentColor" />
      {/* Cross-hairs */}
      <line x1="32" y1="26" x2="32" y2="38" stroke="currentColor" strokeWidth="1.2" />
      <line x1="26" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
