/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neuro: {
                    base: "#050508", // Deep Space Black
                    panel: "#0f1016", // Slightly lighter panel bg
                    primary: "#10b981", // Emerald Neon (Safe)
                    danger: "#ef4444", // Red Neon (Critical)
                    accent: "#06b6d4", // Cyan (Future/AI)
                    glass: "rgba(15, 16, 22, 0.6)" // Glassmorphism
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 10px rgba(16, 185, 129, 0.4)' },
                }
            }
        },
    },
    plugins: [],
}
