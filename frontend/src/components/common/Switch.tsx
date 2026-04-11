interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-all duration-200
            ${checked
              ? 'bg-gradient-to-r from-[#ff3366] to-[#9933ff]'
              : 'bg-[#2a2a3a]'
            }
          `}
        />
        <div
          className={`
            absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {label && <span className="text-sm text-[#9ca3af]">{label}</span>}
    </label>
  );
}
