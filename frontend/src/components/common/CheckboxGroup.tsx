import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CheckboxOption<T extends string> {
  value: T;
  label: string;
}

interface CheckboxGroupProps<T extends string> {
  options: CheckboxOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  disabled?: boolean;
}

export function CheckboxGroup<T extends string>({
  options,
  values,
  onChange,
  disabled = false,
}: CheckboxGroupProps<T>) {
  const toggleValue = (value: T) => {
    if (disabled) return;

    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    onChange(newValues);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = values.includes(option.value);

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200 border
              ${isSelected
                ? 'bg-gradient-to-r from-[#ff3366]/20 to-[#9933ff]/20 text-[#f0f0f5] border-[#ff3366]/50'
                : 'bg-[#1a1a25] text-[#9ca3af] border-[#2a2a3a] hover:border-[#4a4a5a]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <div
              className={`
                w-4 h-4 rounded flex items-center justify-center transition-colors
                ${isSelected
                  ? 'bg-gradient-to-r from-[#ff3366] to-[#9933ff]'
                  : 'bg-[#2a2a3a] border border-[#4a4a5a]'
                }
              `}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
