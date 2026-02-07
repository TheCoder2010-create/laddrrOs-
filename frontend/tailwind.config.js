/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Public Sans', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#4338CA', foreground: '#FFFFFF', hover: '#3730A3' },
        accent: { DEFAULT: '#0EA5E9', foreground: '#FFFFFF' },
        surface: { light: '#FFFFFF', dark: '#0F172A' },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};
