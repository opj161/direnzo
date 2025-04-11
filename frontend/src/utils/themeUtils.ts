/**
 * Theme utility functions for managing dark mode
 */

/**
 * Toggle dark mode on or off
 * @param isDark - Whether to enable dark mode
 */
export const toggleDarkMode = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

/**
 * Initialize theme based on user preference or system setting
 * @returns boolean - Whether dark mode is enabled
 */
export const initializeTheme = (): boolean => {
  // Check for user preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    toggleDarkMode(true);
    return true;
  }
  
  toggleDarkMode(false);
  return false;
};
