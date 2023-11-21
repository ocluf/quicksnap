/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,svelte,js,ts,}",
    "./electron/**/*.{html,svelte,js,ts,}",
  ],
  theme: {
    extend: {
      boxShadow: {
        white: "0 0 30px rgba(255, 255, 255, 0.5)",
      },
    },
  },
  plugins: [],
};
