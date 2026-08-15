import type { ButtonHTMLAttributes } from 'react';

// MD3 Button — filled/tonal/outlined/text, pill 40dp, state layer via hover
// (superfície tonal secundária em vez de state layer ::after — compatível com
// os tokens do globals.css). Contraste AA: on-primary #fff sobre #5c4152 (8.5:1).
type Variant = 'filled' | 'tonal' | 'outlined' | 'text';

const base =
  'inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 select-none whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  filled: 'bg-md-primary text-md-on-primary hover:bg-md-primary-container active:scale-[0.98] shadow-sm',
  tonal: 'bg-md-secondary/15 text-md-secondary hover:bg-md-secondary/25 active:scale-[0.98]',
  outlined:
    'border border-md-outline text-md-on-surface-variant hover:border-md-outline-variant hover:text-md-on-surface',
  text: 'text-md-primary-container hover:bg-md-primary/10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'filled', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className ?? ''}`} {...props} />
  );
}