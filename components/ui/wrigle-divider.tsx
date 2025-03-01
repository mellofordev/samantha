export function WrigleDivider() {
  return (
    <svg width="100" height="12" className="text-gray-200">
      <pattern
        id="wave"
        x="0"
        y="0"
        width="20"
        height="12"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 6 Q 5 0, 10 6 Q 15 12, 20 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </pattern>
      <rect width="100" height="12" fill="url(#wave)" />
    </svg>
  );
}
