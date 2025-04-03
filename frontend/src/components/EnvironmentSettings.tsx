import React, { useState, useEffect } from 'react';

// Define options based on PRD (Section 3.3)
const BACKGROUND_PRESET_OPTIONS = [
  'Simple White Studio',
  'Simple Grey Studio',
  'Outdoor - City Street',
  'Outdoor - Beach Sunset',
  'Outdoor - Park (Daylight)',
  'Abstract Gradient',
];
const LIGHTING_OPTIONS = [
  'Studio Softbox',
  'Natural Daylight',
  'Golden Hour Sunlight',
  'Dramatic Rim Lighting',
  'Cinematic Moody',
];
const LENS_STYLE_OPTIONS = [
  'Fashion Magazine (Standard)',
  'Portrait (Shallow DoF)',
  'Wide Angle Environmental',
  'Cinematic Look',
];

// Interface for the component's state
export interface EnvironmentSettingsState {
  backgroundPreset: string;
  backgroundCustom: string;
  lighting: string;
  lensStyle: string;
}

// Interface for the component's props
interface EnvironmentSettingsProps {
  onChange: (settings: EnvironmentSettingsState) => void; // Callback to parent
}

const EnvironmentSettings: React.FC<EnvironmentSettingsProps> = ({ onChange }) => {
  // Initialize state with default values
  const [settings, setSettings] = useState<EnvironmentSettingsState>({
    backgroundPreset: BACKGROUND_PRESET_OPTIONS[0], // Default to first preset
    backgroundCustom: '',
    lighting: LIGHTING_OPTIONS[0],
    lensStyle: LENS_STYLE_OPTIONS[0],
  });

  // Notify parent component when settings change
  useEffect(() => {
    onChange(settings);
  }, [settings, onChange]);

  // Handle changes for dropdowns and text input
  const handleChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [name]: value };

      // Logic for mutual exclusivity of background preset/custom
      if (name === 'backgroundPreset' && value !== '') {
        // If a preset is selected, clear custom input
        newSettings.backgroundCustom = '';
      } else if (name === 'backgroundCustom' && value !== '') {
        // If custom text is entered, clear preset selection (e.g., add a "Custom" option or handle internally)
        // For simplicity here, we might just let the backend prioritize custom if present.
        // Or, add a "Select Preset..." option to the dropdown to represent 'none selected'.
        // Let's assume backend prioritizes custom for now. If preset dropdown needs explicit clearing,
        // we'd need to add a placeholder option like "" or "Custom".
      }

      return newSettings;
    });
  };

   // Helper function to render a dropdown
   const renderSelect = (
    name: keyof EnvironmentSettingsState,
    label: string,
    options: string[],
    // Optional: Add a placeholder option if needed for clearing selection
    // placeholder?: string
  ) => (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={settings[name]}
        onChange={handleChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
      >
        {/* {placeholder && <option value="">{placeholder}</option>} */}
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Environment Customization</h3>

      {/* Background Settings */}
      <div className="mb-3 p-3 border border-gray-200 rounded">
        <p className="text-sm font-medium text-gray-700 mb-2">Background (Choose One)</p>
        {renderSelect('backgroundPreset', 'Preset', BACKGROUND_PRESET_OPTIONS)}

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm text-gray-500">OR</span>
          </div>
        </div>

        <div>
          <label htmlFor="backgroundCustom" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Description
          </label>
          <input
            type="text"
            id="backgroundCustom"
            name="backgroundCustom"
            value={settings.backgroundCustom}
            onChange={handleChange}
            placeholder="e.g., 'Minimalist loft apartment'"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            // Disable if a preset is actively selected (optional UX enhancement)
            // disabled={settings.backgroundPreset !== ''}
          />
           <p className="text-xs text-gray-500 mt-1">If filled, this overrides the preset.</p>
        </div>
      </div>

      {/* Lighting and Style */}
      {renderSelect('lighting', 'Lighting', LIGHTING_OPTIONS)}
      {renderSelect('lensStyle', 'Lens / Style', LENS_STYLE_OPTIONS)}
    </div>
  );
};

export default EnvironmentSettings;