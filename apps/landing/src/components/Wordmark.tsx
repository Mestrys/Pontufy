// Mesmo logotipo do app: "Pontu" na cor da marca, "fy" no texto principal.
export default function Wordmark({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-md-on-surface-strong ${className}`}>
      <span className="text-md-primary-text">Pontu</span>fy
    </span>
  );
}
