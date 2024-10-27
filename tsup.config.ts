import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ["src/main.ts"],
	splitting: false,
	clean: true,
	dts: true,
	format: ["esm", "cjs"],
	target: "es2022",
	sourcemap: true,
	minify: true,
	bundle: true,
	platform: "node",
	external: ["@biomejs/biome"],
});