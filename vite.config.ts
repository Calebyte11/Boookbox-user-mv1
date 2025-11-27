import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => {
  const ssrBuild =
    command === "build" &&
    (process.argv.includes("--ssr") ||
      process.env.npm_lifecycle_script?.includes("build:server"));
  const plugins = [react(), tailwindcss()];

  if (!ssrBuild) {
    plugins.push(
      VitePWA({
        devOptions: {
          enabled: false,
          type: "module",
          navigateFallback: "index.html",
        },
        strategies: "injectManifest",
        srcDir: "src",
        filename: "service-worker.js",
        registerType: "autoUpdate",
        includeAssets: [
          "**/*.{js,css,html,ico,png,svg,webp,woff2}",
          "splash/*.png",
        ],
        manifest: {
          name: "BoookBox 4.0",
          short_name: "BoookBox 4.0",
          description:
            "BoookBox - Social-impact platform connecting meal sponsors with recipients",
          theme_color: "#FF7A00",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          id: "/",
          icons: [
            {
              src: "android/android-launchericon-192-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "android/android-launchericon-512-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "android/android-launchericon-192-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "android/android-launchericon-512-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "ios/180.png",
              sizes: "180x180",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "ios/1024.png",
              sizes: "1024x1024",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        },
        workbox: ssrBuild
          ? undefined
          : {
              navigateFallback: "/index.html",
              cleanupOutdatedCaches: true,
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com/,
                  handler: "StaleWhileRevalidate",
                  options: {
                    cacheName: "google-fonts-stylesheets",
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com/,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "google-fonts-webfonts",
                    expiration: {
                      maxEntries: 30,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                  },
                },
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "images",
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                  },
                },
              ],
            },
      })
    );
  }

  return {
    server: {
      host: "::",
      port: 5000,
    },
    plugins,
    build: {
      target: "es2022",
      outDir: `dist/${ssrBuild ? "server" : "client"}`,
      sourcemap: true,
      ssr: ssrBuild ? "./src/entry-server.tsx" : false,
      rollupOptions: {
        input: ssrBuild ? "./src/entry-server.tsx" : "./index.html",
        external: (id) =>
          ssrBuild &&
          ["virtual:pwa-register", "react", "react-dom"].includes(id),
        output: {
          manualChunks: ssrBuild
            ? undefined
            : {
                vendor: ["react", "react-dom"],
                leaflet: ["leaflet", "react-leaflet"],
                firebase: ["firebase/app", "firebase/messaging"],
                confetti: ["react-confetti"],
                routing: ["leaflet-routing-machine"],
                qrcode: ["qrcode"],
                geolib: ["geolib"],
                datefns: ["date-fns"],
                form: ["react-hook-form", "yup", "react-phone-number-input"],
                query: ["@tanstack/react-query"],
                icon: ["lucide-react"],
                swiper: ["swiper"],
              },
        },
      },
      chunkSizeWarningLimit: 5000,
    },
    ssr: {
      noExternal: ["@radix-ui/themes", "react-helmet-async"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["swiper", "react", "react-dom"],
    },
    define: {
      global: "globalThis",
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  };
});