
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			colors: {
				linkedin: {
					blue: '#0a66c2',
					lightblue: '#e8f3fc',
					dark: '#004182',
				},
				/* LinkedBloom brand palette (mockup) */
				ink: {
					900: '#211B3E',
					800: '#2C2451',
					700: '#3A2F6B',
				},
				violet: {
					50: '#EDEAFB',
					500: '#6555E6',
					600: '#5142C9',
				},
				gold: {
					50: '#FCF3E2',
					500: '#EDA838',
					600: '#C98A24',
				},
				brand: {
					25: '#FBFAFD',
					50: '#F6F5FA',
					100: '#EFEDF5',
					200: '#E4E1EC',
					300: '#CDC9DA',
					400: '#9B95AD',
					500: '#6E6883',
					600: '#514B63',
					700: '#383348',
					900: '#1C1830',
				},
				navy: {
					DEFAULT: 'hsl(213, 80%, 14%)',
					light: 'hsl(213, 40%, 25%)',
				},
				success: 'hsl(var(--success))',
				warn: 'hsl(var(--warn))',
				gold500: 'hsl(var(--gold))',
				'onboarding-bg': 'hsl(var(--onboarding-bg))',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'brand-1': '0 1px 2px rgba(16,32,52,.06),0 1px 1px rgba(16,32,52,.04)',
				'brand-2': '0 4px 12px rgba(16,32,52,.08),0 2px 4px rgba(16,32,52,.04)',
				'brand-3': '0 12px 32px rgba(16,32,52,.14),0 4px 8px rgba(16,32,52,.06)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

