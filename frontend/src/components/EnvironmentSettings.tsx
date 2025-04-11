import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import VisualOptionSelector, { VisualOption } from './VisualOptionSelector';
import useSettingsStore from '../store/settingsStore';

// Import Material Icons (using filled style)
// Note: Adjust paths if your setup requires specific import methods for SVGs
import IconWbSunny from '@material-design-icons/svg/filled/wb_sunny.svg';
import IconBrightness4 from '@material-design-icons/svg/filled/brightness_4.svg'; // For Morning/Evening
import IconBrightness5 from '@material-design-icons/svg/filled/brightness_5.svg'; // For Noon
import IconBrightness6 from '@material-design-icons/svg/filled/brightness_6.svg'; // For Afternoon/Sunset
import IconBrightness3 from '@material-design-icons/svg/filled/brightness_3.svg'; // For Night
import IconWbCloudy from '@material-design-icons/svg/filled/wb_cloudy.svg';
import IconFilterDrama from '@material-design-icons/svg/filled/filter_drama.svg'; // For Overcast
import IconUmbrella from '@material-design-icons/svg/filled/umbrella.svg'; // For Rainy
import IconCloud from '@material-design-icons/svg/filled/cloud.svg'; // For Foggy (placeholder)
import IconAcUnit from '@material-design-icons/svg/filled/ac_unit.svg'; // For Snowy

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
// --- Visual Options Definitions ---

// Helper function to create icon components (adjust size/styling as needed)
const createIcon = (IconComponent: string) => <img src={IconComponent} alt="" className="w-6 h-6" />;

// Map time of day to icons
const timeOfDayIconMap: { [key: string]: React.ReactNode } = {
  'Morning': createIcon(IconBrightness4), // Using brightness icons
  'Noon': createIcon(IconBrightness5),
  'Afternoon': createIcon(IconBrightness6),
  'Sunset': createIcon(IconBrightness6), // Reuse
  'Evening': createIcon(IconBrightness4), // Reuse
  'Night': createIcon(IconBrightness3),
};

const TIME_OF_DAY_VISUAL_OPTIONS: VisualOption[] = TIME_OF_DAY_OPTIONS.map(time => ({
  value: time,
  label: time,
  icon: timeOfDayIconMap[time] || undefined,
}));

// Map weather conditions to icons
const weatherIconMap: { [key: string]: React.ReactNode } = {
  'Clear': createIcon(IconWbSunny), // Use Sunny for Clear too
  'Sunny': createIcon(IconWbSunny),
  'Cloudy': createIcon(IconWbCloudy),
  'Overcast': createIcon(IconFilterDrama),
  'Rainy': createIcon(IconUmbrella),
  'Foggy': createIcon(IconCloud), // Placeholder
  'Snowy': createIcon(IconAcUnit),
};

const WEATHER_VISUAL_OPTIONS: VisualOption[] = WEATHER_OPTIONS.map(weather => ({
  value: weather,
  label: weather,
  icon: weatherIconMap[weather] || undefined,
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

// Props are no longer needed as state comes from the store
// interface EnvironmentSettingsProps { ... }

const EnvironmentSettings: React.FC = () => { // Removed props
  // Get state and actions from the store
  const environmentSettings = useSettingsStore(state => state.environmentSettings);
  const setEnvironmentSettings = useSettingsStore(state => state.setEnvironmentSettings);

  // Local state and useEffect are no longer needed

  // Handle changes for dropdowns and text input
  const handleChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    // Update the store state directly
    setEnvironmentSettings((() => { // IIFE to create a scope for newSettings
        const newSettings = { ...environmentSettings }; // Get current state from store

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
        return newSettings; // Return the updated settings object
    })()); // Immediately invoke the function
  };

  // Handler for visual option selectors
  const handleVisualOptionChange = (name: keyof EnvironmentSettingsState, value: string) => {
    // Update the store state
    setEnvironmentSettings({
      ...environmentSettings, // Get current state from store
      [name]: value,
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
        {label}
      </label>
      {/* Added relative positioning to the wrapper */}
      <div className="relative mt-1">
        <select
          id={name}
          name={name}
          value={environmentSettings[name]} // Use state from store
          onChange={handleChange}
          // Add disabled state for backgroundPreset select
          disabled={name === 'backgroundPreset' && environmentSettings.backgroundCustom !== ''} // Use state from store
          // Updated classes for consistent styling and custom arrow
          className={`appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm transition-colors duration-200 ${name === 'backgroundPreset' && environmentSettings.backgroundCustom !== '' ? 'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`} // Use state from store, added disabled text color
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
              value={environmentSettings.backgroundCustom} // Use state from store
              onChange={handleChange}
              placeholder="e.g., 'Minimalist loft apartment'"
              className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm transition-colors duration-200 ${environmentSettings.backgroundPreset !== '' ? 'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed' : ''}`} // Use state from store, added disabled text color
              disabled={environmentSettings.backgroundPreset !== ''} // Use state from store
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
            // name="timeOfDay" // Prop removed from VisualOptionSelector
            label="Time of Day"
            options={TIME_OF_DAY_VISUAL_OPTIONS}
            selectedValue={environmentSettings.timeOfDay} // Use state from store
            onChange={(value) => handleVisualOptionChange('timeOfDay', value)}
          />

          <VisualOptionSelector
            // name="weather" // Prop removed from VisualOptionSelector
            label="Weather"
            options={WEATHER_VISUAL_OPTIONS}
            selectedValue={environmentSettings.weather} // Use state from store
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