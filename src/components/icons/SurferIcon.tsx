interface SurferIconProps {
  className?: string;
  size?: number;
}

/**
 * Simple surfer riding a wave. Stroke-based so it inherits currentColor
 * and pairs well with the other line icons used across XCROL.
 */
const SurferIcon = ({ className, size = 24 }: SurferIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Surfer head */}
    <circle cx="14.5" cy="4.5" r="1.6" />
    {/* Surfer body: arms out, torso leaning, legs bent in a stance */}
    <path d="M9 8.5 L13 7 L17.5 8.5" />
    <path d="M13 7 L12.5 12 L10.5 15" />
    <path d="M12.5 12 L15 14.5" />
    {/* Surfboard */}
    <path d="M5 17 C 9 15.5, 15 15.5, 20 17" />
    {/* Wave crest */}
    <path d="M2 20 C 5 18, 8 22, 12 20 C 16 18, 19 22, 22 20" />
  </svg>
);

export default SurferIcon;
