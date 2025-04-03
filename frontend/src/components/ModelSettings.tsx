import React, { useState, useEffect } from 'react';

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

// Interface for the component's state
export interface ModelSettingsState {
  gender: string;
  bodyType: string;
  ageRange: string;
  ethnicity: string;
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

  // Helper function to render a dropdown
  const renderSelect = (
    name: keyof ModelSettingsState,
    label: string,
    options: string[]
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
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Model Customization</h3>
      {renderSelect('gender', 'Gender', GENDER_OPTIONS)}
      {renderSelect('bodyType', 'Body Type', BODY_TYPE_OPTIONS)}
      {renderSelect('ageRange', 'Age Range', AGE_RANGE_OPTIONS)}
      {renderSelect('ethnicity', 'Ethnicity', ETHNICITY_OPTIONS)}
    </div>
  );
};

export default ModelSettings;