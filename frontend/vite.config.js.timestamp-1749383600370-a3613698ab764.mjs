// vite.config.js
import { defineConfig } from "file:///C:/Users/gbrai/Documents/Projects/ToDoApp/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/gbrai/Documents/Projects/ToDoApp/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\gbrai\\Documents\\Projects\\ToDoApp\\frontend";
var APP_CONFIG = {
  PORTS: {
    FRONTEND: 3e3,
    BACKEND: 8e3
  }
};
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@core": path.resolve(__vite_injected_original_dirname, "./src/core"),
      "@features": path.resolve(__vite_injected_original_dirname, "./src/features"),
      "@tasklist": path.resolve(__vite_injected_original_dirname, "./src/features/tasklist"),
      "@timeline": path.resolve(__vite_injected_original_dirname, "./src/features/timeline"),
      "@template": path.resolve(__vite_injected_original_dirname, "./src/features/template"),
      "@app": path.resolve(__vite_injected_original_dirname, "./src/app"),
      "@components": path.resolve(__vite_injected_original_dirname, "./src/core/components"),
      "@hooks": path.resolve(__vite_injected_original_dirname, "./src/features/tasklist/hooks"),
      "@utils": path.resolve(__vite_injected_original_dirname, "./src/core/utils"),
      "@services": path.resolve(__vite_injected_original_dirname, "./src/core/services"),
      "@config": path.resolve(__vite_injected_original_dirname, "./src/core/config"),
      "@types": path.resolve(__vite_injected_original_dirname, "./src/core/types"),
      // システムプロンプト準拠：UIコンポーネント用エイリアス追加
      "@/lib/utils": path.resolve(__vite_injected_original_dirname, "./src/core/utils"),
      "@/components/ui": path.resolve(__vite_injected_original_dirname, "./src/core/components/ui")
    }
  },
  server: {
    port: APP_CONFIG.PORTS.FRONTEND,
    proxy: {
      "/api": {
        target: `http://localhost:${APP_CONFIG.PORTS.BACKEND}`,
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnYnJhaVxcXFxEb2N1bWVudHNcXFxcUHJvamVjdHNcXFxcVG9Eb0FwcFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2JyYWlcXFxcRG9jdW1lbnRzXFxcXFByb2plY3RzXFxcXFRvRG9BcHBcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2dicmFpL0RvY3VtZW50cy9Qcm9qZWN0cy9Ub0RvQXBwL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gXHUzMEI3XHUzMEI5XHUzMEM2XHUzMEUwXHUzMEQ3XHUzMEVEXHUzMEYzXHUzMEQ3XHUzMEM4XHU2RTk2XHU2MkUwOiBcdTMwRDFcdTMwQjlcdThBMkRcdTVCOUFcdTMwNkVcdTRFMDBcdTUxNDNcdTdCQTFcdTc0MDZcclxuY29uc3QgQVBQX0NPTkZJRyA9IHtcclxuICBQT1JUUzoge1xyXG4gICAgRlJPTlRFTkQ6IDMwMDAsXHJcbiAgICBCQUNLRU5EOiA4MDAwLFxyXG4gIH1cclxufVxyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIFwiQGNvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlXCIpLFxyXG4gICAgICBcIkBmZWF0dXJlc1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2ZlYXR1cmVzXCIpLFxyXG4gICAgICBcIkB0YXNrbGlzdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2ZlYXR1cmVzL3Rhc2tsaXN0XCIpLFxyXG4gICAgICBcIkB0aW1lbGluZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2ZlYXR1cmVzL3RpbWVsaW5lXCIpLFxyXG4gICAgICBcIkB0ZW1wbGF0ZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2ZlYXR1cmVzL3RlbXBsYXRlXCIpLFxyXG4gICAgICBcIkBhcHBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9hcHBcIiksXHJcbiAgICAgIFwiQGNvbXBvbmVudHNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlL2NvbXBvbmVudHNcIiksXHJcbiAgICAgIFwiQGhvb2tzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvZmVhdHVyZXMvdGFza2xpc3QvaG9va3NcIiksXHJcbiAgICAgIFwiQHV0aWxzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29yZS91dGlsc1wiKSxcclxuICAgICAgXCJAc2VydmljZXNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlL3NlcnZpY2VzXCIpLFxyXG4gICAgICBcIkBjb25maWdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlL2NvbmZpZ1wiKSxcclxuICAgICAgXCJAdHlwZXNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlL3R5cGVzXCIpLFxyXG4gICAgICAvLyBcdTMwQjdcdTMwQjlcdTMwQzZcdTMwRTBcdTMwRDdcdTMwRURcdTMwRjNcdTMwRDdcdTMwQzhcdTZFOTZcdTYyRTBcdUZGMUFVSVx1MzBCM1x1MzBGM1x1MzBERFx1MzBGQ1x1MzBDRFx1MzBGM1x1MzBDOFx1NzUyOFx1MzBBOFx1MzBBNFx1MzBFQVx1MzBBMlx1MzBCOVx1OEZGRFx1NTJBMFxyXG4gICAgICBcIkAvbGliL3V0aWxzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29yZS91dGlsc1wiKSxcclxuICAgICAgXCJAL2NvbXBvbmVudHMvdWlcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb3JlL2NvbXBvbmVudHMvdWlcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiBBUFBfQ09ORklHLlBPUlRTLkZST05URU5ELFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBgaHR0cDovL2xvY2FsaG9zdDoke0FQUF9DT05GSUcuUE9SVFMuQkFDS0VORH1gLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQXNWLFNBQVMsb0JBQW9CO0FBQ25YLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxhQUFhO0FBQUEsRUFDakIsT0FBTztBQUFBLElBQ0wsVUFBVTtBQUFBLElBQ1YsU0FBUztBQUFBLEVBQ1g7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDcEMsU0FBUyxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLE1BQzdDLGFBQWEsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLE1BQ3JELGFBQWEsS0FBSyxRQUFRLGtDQUFXLHlCQUF5QjtBQUFBLE1BQzlELGFBQWEsS0FBSyxRQUFRLGtDQUFXLHlCQUF5QjtBQUFBLE1BQzlELGFBQWEsS0FBSyxRQUFRLGtDQUFXLHlCQUF5QjtBQUFBLE1BQzlELFFBQVEsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxNQUMzQyxlQUFlLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUM5RCxVQUFVLEtBQUssUUFBUSxrQ0FBVywrQkFBK0I7QUFBQSxNQUNqRSxVQUFVLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxNQUNwRCxhQUFhLEtBQUssUUFBUSxrQ0FBVyxxQkFBcUI7QUFBQSxNQUMxRCxXQUFXLEtBQUssUUFBUSxrQ0FBVyxtQkFBbUI7QUFBQSxNQUN0RCxVQUFVLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQTtBQUFBLE1BRXBELGVBQWUsS0FBSyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLE1BQ3pELG1CQUFtQixLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsSUFDdkU7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNLFdBQVcsTUFBTTtBQUFBLElBQ3ZCLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVEsb0JBQW9CLFdBQVcsTUFBTSxPQUFPO0FBQUEsUUFDcEQsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
