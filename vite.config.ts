import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
	base: "/",
	build: {
		outDir: "static",
	},
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Diffy",
				short_name: "Diffy",
				description: "Advanced diff viewer for comparing text files",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "/pwa-64x64.png",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "/pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
				navigateFallback: "/index.html",
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === "document",
						handler: "NetworkFirst",
						options: {
							cacheName: "pages",
						},
					},
					{
						urlPattern: ({ request }) =>
							["script", "style", "image"].includes(request.destination),
						handler: "CacheFirst",
						options: {
							cacheName: "assets",
						},
					},
				],
			},
		}),
	],
});

export default config;
