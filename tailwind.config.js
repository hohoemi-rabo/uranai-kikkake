/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        charm: '#FB7185',
        palm: '#2DD4BF',
        match: '#FB923C',
        base: '#F0F9FF',
      },
      fontFamily: {
        rounded: ['MPLUSRounded1c_400Regular'],
        'rounded-bold': ['MPLUSRounded1c_700Bold'],
        'rounded-black': ['MPLUSRounded1c_900Black'],
      },
    },
  },
  plugins: [],
};
