import { defineConfig } from "oxlint";

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
	ignorePatterns: ["dist"],
	overrides: [
		{
			files: ["**/*.{ts,tsx}"],
			plugins: ["react"],
			env: {
				es2024: true,
				browser: true,
			},
			rules: {
				"react/exhaustive-deps": "warn",
				"react/incompatible-library": "warn",
				"react/unsupported-syntax": "warn",
				"react/only-export-components": [
					"error",
					{
						allowConstantExport: true,
						allowCompoundComponents: true,
					},
				],
			},
		},
	],
});
