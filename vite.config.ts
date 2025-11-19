import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "avatar.ico", dest: "" },
        { src: "avatar.png", dest: "" },
        { src: "planet.json", dest: "" },
      ],
    }),
  ],
  optimizeDeps: {
    include: ["lucide-react", "framer-motion", "recharts"],
  },
  build: {
    outDir: "v2ex-info-history",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["lucide-react", "framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
