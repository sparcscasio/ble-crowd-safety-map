import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ble-crowd-safety-map/",
  plugins: [react()],
});