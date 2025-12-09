import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const target = env.VITE_BACKEND_URL || 'http://localhost:9621'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    base: '/', // 开发环境使用根路径
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
      proxy: {
        // 通用代理规则 - 匹配所有API路径
        '^/(api|documents|graphs|graph|health|query|docs|redoc|openapi.json|login|auth-status|static)': {
          target,
          changeOrigin: true,
          secure: false,
          // 添加详细日志
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`📤 [Vite代理] ${req.method} ${req.url} -> ${target}${req.url}`)
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`📥 [Vite代理响应] ${req.method} ${req.url} -> ${proxyRes.statusCode}`)
            })
            proxy.on('error', (err, req, res) => {
              console.error(`❌ [Vite代理错误] ${req.method} ${req.url}:`, err.message)
            })
          }
        },

        // 专门为/query/stream添加配置（确保流式响应正常工作）
        '/query/stream': {
          target,
          changeOrigin: true,
          secure: false,
          // 流式端点需要特殊配置
          proxyTimeout: 0,
          timeout: 0,
          ws: false, // 明确关闭WebSocket
          // 确保响应头正确
          onProxyRes: (proxyRes, req, res) => {
            // 确保content-type正确
            if (!proxyRes.headers['content-type']) {
              proxyRes.headers['content-type'] = 'application/x-ndjson'
            }
          }
        },
      },
      host: 'localhost',
      port: 5173,
      strictPort: true,
      cors: true,
      open: false,
      // 添加CORS配置
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, X-API-Key'
      }
    },
  }
})