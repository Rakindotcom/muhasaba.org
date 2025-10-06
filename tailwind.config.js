/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        // Scaled base text sizes (1.3x)
        'xs-scaled': 'calc(0.75rem * 1.3)',
        'sm-scaled': 'calc(0.875rem * 1.3)',
        'base-scaled': 'calc(1rem * 1.3)',
        'lg-scaled': 'calc(1.125rem * 1.3)',
        'xl-scaled': 'calc(1.25rem * 1.3)',
        '2xl-scaled': 'calc(1.5rem * 1.3)',
        '3xl-scaled': 'calc(1.875rem * 1.3)',
        '4xl-scaled': 'calc(2.25rem * 1.3)',
        '5xl-scaled': 'calc(3rem * 1.3)',
        '6xl-scaled': 'calc(3.75rem * 1.3)',
        
        // Scaled header sizes (1.2x)
        'h1-scaled': 'calc(2.25rem * 1.2)',
        'h2-scaled': 'calc(1.875rem * 1.2)',
        'h3-scaled': 'calc(1.5rem * 1.2)',
        'h4-scaled': 'calc(1.25rem * 1.2)',
        'h5-scaled': 'calc(1.125rem * 1.2)',
        'h6-scaled': 'calc(1rem * 1.2)',
      }
    },
  },
  plugins: [],
}