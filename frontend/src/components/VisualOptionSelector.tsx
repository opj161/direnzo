import React from 'react';

export interface VisualOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface VisualOptionSelectorProps {
  options: VisualOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  // name: string; // Removed unused prop
  label: string;
}

const VisualOptionSelector: React.FC<VisualOptionSelectorProps> = ({
  options,
  selectedValue,
  onChange,
  // name, // Removed unused prop
  label,
}) => {
  const handleChange = (value: string) => {
    onChange(value);
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
        {label}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
            className={`flex flex-col items-center p-2 rounded-md border transition-all duration-200 ${
              selectedValue === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500 dark:ring-primary-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            }`}
            aria-pressed={selectedValue === option.value}
            aria-label={option.label}
          >
            <div className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 mb-1">
              {option.icon || (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {option.label.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VisualOptionSelector;
