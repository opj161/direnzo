import React, { useState, useEffect } from 'react';
import CollapsibleSection from './CollapsibleSection';
import VisualOptionSelector, { VisualOption } from './VisualOptionSelector';

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

// New environment options
const TIME_OF_DAY_OPTIONS = ['Morning', 'Noon', 'Afternoon', 'Sunset', 'Evening', 'Night'];
const WEATHER_OPTIONS = ['Clear', 'Sunny', 'Cloudy', 'Overcast', 'Rainy', 'Foggy', 'Snowy'];
const SEASON_OPTIONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const CAMERA_ANGLE_OPTIONS = ['Eye Level', 'Low Angle', 'High Angle', 'Dutch Angle', 'Overhead'];

// Visual options for time of day
const TIME_OF_DAY_VISUAL_OPTIONS: VisualOption[] = TIME_OF_DAY_OPTIONS.map(time => ({
  value: time,
  label: time,
  // Icons would be added here in a real implementation
}));

// Visual options for weather
const WEATHER_VISUAL_OPTIONS: VisualOption[] = WEATHER_OPTIONS.map(weather => ({
  value: weather,
  label: weather,
  // Icons would be added here in a real implementation
}));

// Interface for the component's state
export interface EnvironmentSettingsState {
  backgroundPreset: string;
  backgroundCustom: string;
  lighting: string;
  lensStyle: string;
  timeOfDay: string;
  weather: string;
  season: string;
  cameraAngle: string;
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
    timeOfDay: TIME_OF_DAY_OPTIONS[0],
    weather: WEATHER_OPTIONS[0],
    season: SEASON_OPTIONS[0],
    cameraAngle: CAMERA_ANGLE_OPTIONS[0],
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
            // Handle other fields (lighting, lensStyle, etc.)
            newSettings[name as keyof EnvironmentSettingsState] = value;
        }
        return newSettings;
    });
  };

  // Handler for visual option selectors
  const handleVisualOptionChange = (name: keyof EnvironmentSettingsState, value: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
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
          className={`appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm transition-colors duration-200 ${name === 'backgroundPreset' && settings.backgroundCustom !== '' ? 'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`}
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
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300 transition-colors duration-200">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4 space-y-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-200">Environment Customization</h3>

      {/* Background Settings Section */}
      <CollapsibleSection title="Background Settings" defaultOpen={true}>
        <div className="space-y-3">
          {renderSelect('backgroundPreset', 'Preset', BACKGROUND_PRESET_OPTIONS)}

          <div>
            <label htmlFor="backgroundCustom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Custom Description
            </label>
            <input
              type="text"
              id="backgroundCustom"
              name="backgroundCustom"
              value={settings.backgroundCustom}
              onChange={handleChange}
              placeholder="e.g., 'Minimalist loft apartment'"
              className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm transition-colors duration-200 ${settings.backgroundPreset !== '' ? 'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`}
              disabled={settings.backgroundPreset !== ''}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">If filled, this overrides the preset.</p>
          </div>

          {/* Season Selection */}
          {renderSelect('season', 'Season', SEASON_OPTIONS)}
        </div>
      </CollapsibleSection>

      {/* Atmospheric Conditions Section */}
      <CollapsibleSection title="Atmospheric Conditions">
        <div className="space-y-3">
          <VisualOptionSelector
            name="timeOfDay"
            label="Time of Day"
            options={TIME_OF_DAY_VISUAL_OPTIONS}
            selectedValue={settings.timeOfDay}
            onChange={(value) => handleVisualOptionChange('timeOfDay', value)}
          />

          <VisualOptionSelector
            name="weather"
            label="Weather"
            options={WEATHER_VISUAL_OPTIONS}
            selectedValue={settings.weather}
            onChange={(value) => handleVisualOptionChange('weather', value)}
          />

          {renderSelect('lighting', 'Lighting', LIGHTING_OPTIONS)}
        </div>
      </CollapsibleSection>

      {/* Camera Settings Section */}
      <CollapsibleSection title="Camera Settings">
        <div className="space-y-3">
          {renderSelect('lensStyle', 'Lens / Style', LENS_STYLE_OPTIONS)}
          {renderSelect('cameraAngle', 'Camera Angle', CAMERA_ANGLE_OPTIONS)}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default EnvironmentSettings;