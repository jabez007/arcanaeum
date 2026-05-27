import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const promptCanaryEnabled = env.VITE_ENABLE_PROMPT_CANARY === "true";
  const promptCanaryComponentAlias = fileURLToPath(
    new URL(
      promptCanaryEnabled
        ? "./src/components/PromptInjectionCanary.vue"
        : "./src/components/PromptInjectionCanary.disabled.vue",
      import.meta.url,
    ),
  );

  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        devOptions: {
          enabled: process.env.NODE_ENV !== "production",
        },
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 5242880,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/raw\.githubusercontent\.com\//,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 5, // 5 hours
                },
              },
            },
          ],
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          // 'masked-icon.svg'
        ],
        manifest: {
          name: "Archons' Arcanaeum",
          short_name: "Arcanaeum",
          description:
            "The unofficial repository for the Archons of the Spire (part of Last Hope LARP)",
          theme_color: "#2d1b69",
          background_color: "#0a0a23",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    assetsInclude: ["**/*.md"],
    resolve: {
      alias: [
        {
          find: "@/components/PromptInjectionCanary.vue",
          replacement: promptCanaryComponentAlias,
        },
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url)),
        },
      ],
    },
  };
});
