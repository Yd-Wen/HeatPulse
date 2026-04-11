import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg
            text-[#f0f0f5] placeholder-[#6b7280]
            focus:outline-none focus:border-[#9933ff] focus:ring-1 focus:ring-[#9933ff]/50
            transition-all duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-[#6b7280]">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
