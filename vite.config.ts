import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isProd = mode === "production";

  return {
    publicDir: "Public", // 🔥 FIX: Folder z dużą literą
    server: {
      port: 3005,
      host: "0.0.0.0",
      strictPort: false,
    },
    plugins: [
      react(),
      // Bundle analyzer - generates stats.html
      visualizer({
        open: false, // Don't auto-open browser
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
      // PWA Plugin - Offline support & caching
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["Public/LOGOEIFEO.jpg", "robots.txt"],
        manifest: {
          name: "ZZP Werkplaats - Gecertifireiate Vakmensen voor Uw Bedrijf",
          short_name: "ZZP Werkplaats",
          description:
            "Platform łączący pracodawców z wykwalifikowanymi pracownikami - Gecertifireiate Vakmensen voor Uw Bedrijf",
          theme_color: "#9333ea",
          background_color: "#1a1a2e",
          display: "standalone",
          icons: [
            {
              src: "Public/LOGOEIFEO.jpg",
              sizes: "192x192",
              type: "image/jpeg",
            },
            {
              src: "Public/LOGOEIFEO.jpg",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        },
        workbox: {
          // Increase file size limit to 5MB (large physics bundle)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // 🔥 AUTO CACHE CLEAR SETTINGS
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          // Cache strategies
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Performance optimizations
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: isProd ? ["console.log", "console.info"] : [],
        },
        mangle: {
          safari10: true,
        },
      },

      // Source maps
      sourcemap: !isProd,

      // Asset optimization
      assetsDir: "assets",
      assetsInlineLimit: 4096, // 4kb inline limit

      // Chunk size warning
      chunkSizeWarningLimit: 800,

      // 🔥 COMBINED ROLLUP OPTIONS: Cache busting + manual chunks
      rollupOptions: {
        output: {
          // Cache busting filenames
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,

          // Manual chunks for better caching
          manualChunks: {
            // Core React libs - cached by browser
            "vendor-react": ["react", "react-dom", "react-router-dom"],

            // UI libraries (excluding lucide-react to avoid ESM issues)
            "vendor-ui": ["@heroicons/react"],

            // Supabase client
            "vendor-supabase": ["@supabase/supabase-js"],

            // i18n
            "vendor-i18n": ["react-i18next", "i18next"],

            // Forms and validation
            "vendor-forms": ["react-hook-form", "zod"],

            // Charts (only loaded when needed)
            "vendor-charts": ["chart.js", "react-chartjs-2"],

            // Date utilities
            "vendor-date": ["date-fns"],

            // Utils
            "vendor-utils": ["clsx", "classnames"],
          },
        },
      },
    },

    // CSS optimization
    css: {
      devSourcemap: !isProd,
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@heroicons/react/24/outline",
        "@heroicons/react/24/solid",
        "@supabase/supabase-js",
      ],
      exclude: ["@vite/client", "@vite/env"],
    },

    // Preview configuration
    preview: {
      port: 4173,
      strictPort: true,
      cors: true,
    },
  };
});
