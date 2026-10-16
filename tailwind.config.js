/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}', './projects/**/*.{html,ts,scss}'],
  theme: {
    extend: {
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
