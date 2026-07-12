import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background) / <alpha-value>)',
  			foreground: 'hsl(var(--foreground) / <alpha-value>)',
  			card: {
  				DEFAULT: 'hsl(var(--card) / <alpha-value>)',
  				foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
  				foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
  				foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
  				foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
  				foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
  				foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
  			},
        canvas: {
          DEFAULT: 'hsl(var(--canvas) / <alpha-value>)',
        },
        'soft-cloud': 'hsl(var(--soft-cloud) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        charcoal: 'hsl(var(--charcoal) / <alpha-value>)',
        ash: 'hsl(var(--ash) / <alpha-value>)',
        mute: 'hsl(var(--mute) / <alpha-value>)',
        stone: 'hsl(var(--stone) / <alpha-value>)',
        
        hairline: {
          DEFAULT: 'hsl(var(--hairline) / <alpha-value>)',
          soft: 'hsl(var(--hairline-soft) / <alpha-value>)',
        },
        sale: {
          DEFAULT: 'hsl(var(--sale) / <alpha-value>)',
          deep: 'hsl(var(--sale-deep) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          bright: 'hsl(var(--success-bright) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          deep: 'hsl(var(--info-deep) / <alpha-value>)',
        },
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
  				foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
  			},
  			border: 'hsl(var(--border) / <alpha-value>)',
  			input: 'hsl(var(--input) / <alpha-value>)',
  			ring: 'hsl(var(--ring) / <alpha-value>)',
  			chart: {
  				'1': 'hsl(var(--chart-1) / <alpha-value>)',
  				'2': 'hsl(var(--chart-2) / <alpha-value>)',
  				'3': 'hsl(var(--chart-3) / <alpha-value>)',
  				'4': 'hsl(var(--chart-4) / <alpha-value>)',
  				'5': 'hsl(var(--chart-5) / <alpha-value>)'
  			}
  		},
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
  		borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '18px',
        md: '24px',
        lg: '30px',
        xl: '36px',
        pill: '9999px',
        full: '9999px',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
