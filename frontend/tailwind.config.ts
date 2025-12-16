import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                sidebar: "var(--sidebar)",
                surface: "var(--surface)",
                primary: "var(--primary)",
                "text-main": "var(--text-main)",
                "text-muted": "var(--text-muted)",
                // Explicitly defining colors again as hex for fallback or if vars fail to parse with opacity
                slate: {
                    950: '#020617',
                    900: '#0f172a',
                    800: '#1e293b',
                }
            },
        },
    },
    plugins: [],
};
export default config;
