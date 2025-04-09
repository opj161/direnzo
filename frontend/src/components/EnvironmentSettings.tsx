import React, { useState, useEffect } from 'react';

// Define options based on PRD (Section 3.3)
// Define mapping from display name to backend key
const BACKGROUND_PRESET_MAP: { [key: string]: string } = {
  'Studio - White': 'studio-white',
  'Studio - Gradient': 'studio-gradient',
  'In Store': 'in-store',
  'Lifestyle - Home': 'lifestyle-home',
  'Lifestyle - Office': 'lifestyle-office',
  'Outdoor - Urban': 'outdoor-urban',
  'Outdoor - Nature': 'outdoor-nature',
  'Seasonal - Spring': 'seasonal-spring',
  'Seasonal - Summer': 'seasonal-summer',
  'Seasonal - Fall': 'seasonal-fall',
  'Seasonal - Winter': 'seasonal-winter',
  // Add other mappings if needed, ensure keys match backend server.js
};
// Derive options from the map keys for the dropdown display
const BACKGROUND_PRESET_OPTIONS = Object.keys(BACKGROUND_PRESET_MAP);
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
    // Default to the KEY of the first option in the map
    backgroundPreset: BACKGROUND_PRESET_MAP[BACKGROUND_PRESET_OPTIONS[0]] || '',
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
        const newSettings = { ...prevSettings };

        if (name === 'backgroundPreset') {
            // Directly store the selected key from the dropdown value
            newSettings.backgroundPreset = value;
            if (value !== '') {
                // Clear custom input if a preset key is selected
                newSettings.backgroundCustom = '';
            }
        } else if (name === 'backgroundCustom') {
            newSettings.backgroundCustom = value;
            if (value !== '') {
                // Clear preset key if custom text is entered
                newSettings.backgroundPreset = '';
            }
        } else {
            // Handle other fields (lighting, lensStyle)
            newSettings[name as keyof EnvironmentSettingsState] = value;
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
      {/* Added relative positioning to the wrapper */}
      <div className="relative mt-1">
        <select
          id={name}
          name={name}
          value={settings[name]}
          onChange={handleChange}
          // Add disabled state for backgroundPreset select
          disabled={name === 'backgroundPreset' && settings.backgroundCustom !== ''}
          // Updated classes for consistent styling and custom arrow
          className={`appearance-none block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${name === 'backgroundPreset' && settings.backgroundCustom !== '' ? 'disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`}
        >
          {/* Add a placeholder option */}
          {name === 'backgroundPreset' ? (
             <>
               <option value="">-- Select Preset --</option>
               {BACKGROUND_PRESET_OPTIONS.map(displayName => (
                 <option key={displayName} value={BACKGROUND_PRESET_MAP[displayName]}> {/* Value is the KEY */}
                   {displayName} {/* Text is the display name */}
                 </option>
               ))}
             </>
          ) : (
             // Original options for other selects (lighting, lensStyle)
             options.map(option => (
               <option key={option} value={option}>
                 {option}
               </option>
             ))
          )}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Environment Customization</h3>

      {/* Background Settings */}
      <div className="mb-3 p-3 border border-gray-200 rounded">
        <p className="text-sm font-medium text-gray-700 mb-2">Background</p>
        {renderSelect('backgroundPreset', 'Preset', BACKGROUND_PRESET_OPTIONS)}

        {/* "OR" divider removed */}
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
            // Ensured consistent styling with selects
            className={`block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${settings.backgroundPreset !== '' ? 'disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`}
            // Disable if a preset is actively selected
            disabled={settings.backgroundPreset !== ''}
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