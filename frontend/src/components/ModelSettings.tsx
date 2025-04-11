import React, { useState, useEffect } from 'react';
import CollapsibleSection from './CollapsibleSection';
import VisualOptionSelector, { VisualOption } from './VisualOptionSelector';

// Define options based on PRD (Section 3.2)
const GENDER_OPTIONS = ['Female', 'Male', 'Androgynous'];
const BODY_TYPE_OPTIONS = ['Slim', 'Average', 'Athletic', 'Curvy', 'Plus-size'];
const AGE_RANGE_OPTIONS = ['18-25', '26-35', '36-45', '46-55', '55+'];
const ETHNICITY_OPTIONS = [
  'Caucasian',
  'Black/African Descent',
  'East Asian',
  'South Asian',
  'Hispanic/Latino',
  'Middle Eastern',
  'Mixed-race',
];

// New options for enhanced customization
const HAIR_STYLE_OPTIONS = ['Short', 'Medium', 'Long', 'Curly', 'Straight', 'Wavy', 'Braided', 'Bun', 'Ponytail'];
const HAIR_COLOR_OPTIONS = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Colorful'];
const HEIGHT_OPTIONS = ['Short', 'Average', 'Tall'];
const POSE_OPTIONS = ['Standing', 'Sitting', 'Walking', 'Casual Pose', 'Fashion Pose'];
const ACCESSORIES_OPTIONS = ['None', 'Glasses', 'Jewelry', 'Hat', 'Scarf', 'Multiple'];

// Visual options for hair styles
const HAIR_STYLE_VISUAL_OPTIONS: VisualOption[] = HAIR_STYLE_OPTIONS.map(style => ({
  value: style,
  label: style,
  // Icons would be added here in a real implementation
}));

// Visual options for hair colors
const HAIR_COLOR_VISUAL_OPTIONS: VisualOption[] = HAIR_COLOR_OPTIONS.map(color => ({
  value: color,
  label: color,
  // In a real implementation, we would use colored circles or icons
}));

// Interface for the component's state
export interface ModelSettingsState {
  gender: string;
  bodyType: string;
  ageRange: string;
  ethnicity: string;
  hairStyle: string;
  hairColor: string;
  height: string;
  pose: string;
  accessories: string;
}

// Interface for the component's props
interface ModelSettingsProps {
  onChange: (settings: ModelSettingsState) => void; // Callback to parent
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ onChange }) => {
  // Initialize state with default values (first option)
  const [settings, setSettings] = useState<ModelSettingsState>({
    gender: GENDER_OPTIONS[0],
    bodyType: BODY_TYPE_OPTIONS[0],
    ageRange: AGE_RANGE_OPTIONS[0],
    ethnicity: ETHNICITY_OPTIONS[0],
    hairStyle: HAIR_STYLE_OPTIONS[0],
    hairColor: HAIR_COLOR_OPTIONS[0],
    height: HEIGHT_OPTIONS[1], // Default to 'Average'
    pose: POSE_OPTIONS[0],
    accessories: ACCESSORIES_OPTIONS[0],
  });

  // Notify parent component when settings change
  useEffect(() => {
    onChange(settings);
  }, [settings, onChange]);

  // Generic handler for dropdown changes
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  // Handler for visual option selectors
  const handleVisualOptionChange = (name: keyof ModelSettingsState, value: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  // Helper function to render a dropdown
  const renderSelect = (
    name: keyof ModelSettingsState,
    label: string,
    options: string[]
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
          className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm transition-colors duration-200"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
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
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-200">Model Customization</h3>

      {/* Basic Characteristics Section */}
      <CollapsibleSection title="Basic Characteristics" defaultOpen={true}>
        <div className="space-y-3">
          {renderSelect('gender', 'Gender', GENDER_OPTIONS)}
          {renderSelect('bodyType', 'Body Type', BODY_TYPE_OPTIONS)}
          {renderSelect('ageRange', 'Age Range', AGE_RANGE_OPTIONS)}
          {renderSelect('ethnicity', 'Ethnicity', ETHNICITY_OPTIONS)}
          {renderSelect('height', 'Height', HEIGHT_OPTIONS)}
        </div>
      </CollapsibleSection>

      {/* Hair & Appearance Section */}
      <CollapsibleSection title="Hair & Appearance">
        <div className="space-y-3">
          <VisualOptionSelector
            name="hairStyle"
            label="Hair Style"
            options={HAIR_STYLE_VISUAL_OPTIONS}
            selectedValue={settings.hairStyle}
            onChange={(value) => handleVisualOptionChange('hairStyle', value)}
          />
          <VisualOptionSelector
            name="hairColor"
            label="Hair Color"
            options={HAIR_COLOR_VISUAL_OPTIONS}
            selectedValue={settings.hairColor}
            onChange={(value) => handleVisualOptionChange('hairColor', value)}
          />
        </div>
      </CollapsibleSection>

      {/* Additional Options Section */}
      <CollapsibleSection title="Additional Options">
        <div className="space-y-3">
          {renderSelect('pose', 'Pose', POSE_OPTIONS)}
          {renderSelect('accessories', 'Accessories', ACCESSORIES_OPTIONS)}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default ModelSettings;