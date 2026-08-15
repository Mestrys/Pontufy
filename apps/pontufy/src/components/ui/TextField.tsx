import type { InputHTMLAttributes } from 'react';

// MD3 Outlined TextField com floating label (sem JS): a label "flutua" via
// :placeholder-shown + peer. O input precisa do placeholder=" " (invisível)
// para o truque funcionar — o texto real nunca é usado como placeholder.
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function TextField({ label, id, className, ...props }: TextFieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        {...props}
        className={`peer w-full px-4 pt-5 pb-2 rounded-xl bg-md-surface-container text-md-on-surface text-sm border border-md-outline placeholder-transparent transition-colors focus:outline-none focus:border-md-primary disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ''}`}
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-md-on-surface-variant text-sm pointer-events-none transition-all duration-200 peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-md-primary peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}