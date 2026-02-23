module.exports = {
  darkMode: 'class', // allow toggling with the `dark` class
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.tsx", "./src/**/*.ts"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        lg: '2rem',
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
