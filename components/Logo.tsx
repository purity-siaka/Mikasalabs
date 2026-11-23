export default function Logo({ size = 30, onLight = false }: { size?: number; onLight?: boolean }) {
  const id = onLight ? "L" : "D";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1">
          {onLight ? <><stop offset="0" stopColor="#1B2F6B" /><stop offset="1" stopColor="#0A1B4D" /></> : <><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#aab6d6" /></>}
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38B6FF" /><stop offset="1" stopColor="#1048E0" /></linearGradient>
      </defs>
      <polygon fill={`url(#w${id})`} points="0,0 20,0 20,100 0,100" />
      <polygon fill={onLight ? "#8EA2D0" : "#c9d3ea"} points="20,0 52,42 52,76 20,32" />
      <polygon fill={`url(#b${id})`} points="80,0 100,0 100,100 80,100" />
      <polygon fill="#2E8BFF" points="80,0 52,42 52,76 80,34" />
    </svg>
  );
}
