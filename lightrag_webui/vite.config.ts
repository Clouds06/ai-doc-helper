import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 智能计算 Base Path
  // 优先级：
  // A. GitHub Actions 注入的 VITE_BASE_URL (对应 GitHub Pages)
  // B. Vercel 注入的 VERCEL_URL (对应 Vercel，强制设为根路径 '/')
  // C. 默认回退 (对应本地开发，保持你原本的 '/webui/')
  let basePath = process.env.VITE_BASE_URL; // GitHub Actions

  if (!basePath && process.env.VERCEL) {
    basePath = '/'; // Vercel 部署通常在根目录
  }

  // 如果都不是，回退到默认值
  basePath = basePath || '/webui/';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    base: basePath,
    build: {
      outDir: path.resolve(__dirname, '../lightrag/api/webui'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 3800,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    server: {
      // 3. 修复 proxy 中的环境变量读取
      proxy: env.VITE_API_PROXY === 'true' && env.VITE_API_ENDPOINTS ?
        Object.fromEntries(
          env.VITE_API_ENDPOINTS.split(',').map(endpoint => [
            endpoint,
            {
              target: env.VITE_BACKEND_URL || 'http://localhost:9621',
              changeOrigin: true,
              rewrite: endpoint === '/api' ?
                (path) => path.replace(/^\/api/, '') :
                endpoint === '/docs' || endpoint === '/redoc' || endpoint === '/openapi.json' || endpoint === '/static' ?
                  (path) => path : undefined
            }
          ])
        ) : {},
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  }
})
