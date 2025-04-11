import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Import persist middleware
import { ModelSettingsState } from '../components/ModelSettings';
import { EnvironmentSettingsState } from '../components/EnvironmentSettings';

// --- Default Values (extracted from components) ---

// Default Model Settings
const defaultModelSettings: ModelSettingsState = {
  gender: 'Female',
  bodyType: 'Slim',
  ageRange: '18-25',
  ethnicity: 'Caucasian',
  hairStyle: 'Short',
  hairColor: 'Black',
  height: 'Average',
  pose: 'Standing',
  accessories: 'None',
};

// Default Environment Settings (using keys for presets where applicable)
const defaultEnvironmentSettings: EnvironmentSettingsState = {
  backgroundPreset: 'studio-white', // Default to the key
  backgroundCustom: '',
  lighting: 'Studio Softbox',
  lensStyle: 'Fashion Magazine (Standard)',
  timeOfDay: 'Morning',
  weather: 'Clear',
  season: 'Spring',
  cameraAngle: 'Eye Level',
};

// --- Store Interface ---

interface SettingsState {
  modelSettings: ModelSettingsState;
  environmentSettings: EnvironmentSettingsState;
  setModelSettings: (settings: ModelSettingsState) => void;
  setEnvironmentSettings: (settings: EnvironmentSettingsState) => void;
  // Optional: Add actions to update individual settings if needed later
}

// --- Store Implementation ---

const useSettingsStore = create<SettingsState>()(
  persist( // Wrap with persist middleware
    (set) => ({
      modelSettings: defaultModelSettings,
      environmentSettings: defaultEnvironmentSettings,
      setModelSettings: (settings) => set({ modelSettings: settings }),
      setEnvironmentSettings: (settings) => set({ environmentSettings: settings }),
    }),
    {
      name: 'ai-fashion-settings-storage', // Name for localStorage item
      // Optionally specify which parts of the state to persist, default is all
      // partialize: (state) => ({ modelSettings: state.modelSettings, environmentSettings: state.environmentSettings }),
    }
  )
);

export default useSettingsStore;