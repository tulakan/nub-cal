/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}', './projects/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      // You can extend the default theme here
      colors: {
        // Custom colors to match your Angular Material theme
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
      },
    },
  },
  plugins: [],
  // Configure core plugins to avoid conflicts with Angular Material
  corePlugins: {
    preflight: false, // Disable Tailwind's aggressive CSS reset
  },
  // Important: Use a prefix or important to avoid conflicts
  important: false,
};
