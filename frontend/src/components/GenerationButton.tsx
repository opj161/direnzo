import React from 'react';

interface GenerationButtonProps {
  onClick: () => void; // Function to call when clicked
  isLoading: boolean; // Is the generation process running?
  isDisabled: boolean; // Should the button be disabled (e.g., no image uploaded)?
}

const GenerationButton: React.FC<GenerationButtonProps> = ({ onClick, isLoading, isDisabled }) => {
  const disabled = isLoading || isDisabled; // Button is disabled if loading OR explicitly disabled

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white
                  ${disabled
                    ? 'bg-primary-300 dark:bg-primary-800 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800'
                  }
                  transition-all duration-200`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating...
        </>
      ) : (
        'Generate Image'
      )}
    </button>
  );
};

export default GenerationButton;