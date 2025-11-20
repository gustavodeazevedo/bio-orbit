import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            // Fast Refresh otimizado para melhor performance
            fastRefresh: true
        })
    ],
    server: {
        open: true,
        watch: {
            usePolling: true,
            interval: 100
        },
        hmr: {
            overlay: true
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remover console.logs em produção
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.debug'] // Remover funções específicas
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core do React - carregado primeiro
                    'react-vendor': ['react', 'react-dom'],

                    // Roteamento - crítico
                    'react-router': ['react-router-dom'],

                    // UI e gráficos - podem ser lazy loaded
                    'charts': ['chart.js', 'react-chartjs-2', 'recharts'],

                    // Utilitários grandes - separados
                    'pdf-vendor': ['pdfmake'],
                    'excel-vendor': ['xlsx'],

                    // Outros utilitários
                    'utils': ['axios', 'file-saver'],

                    // Skeleton loader
                    'skeleton': ['react-loading-skeleton'],

                    // Ícones Lucide (grandes)
                    'icons': ['lucide-react']
                },
                // Melhorar nomes de chunks para cache
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
            }
        },
        // Otimizar tamanho dos chunks
        chunkSizeWarningLimit: 1000,
        // Otimizar CSS
        cssCodeSplit: true,
        // Otimizar assets
        assetsInlineLimit: 4096 // 4kb - inline assets pequenos
    },
    css: {
        preprocessorOptions: {
            css: {
                charset: false
            }
        }
    },
    // Otimizações de performance
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'pdfmake',
            'pdfmake/build/vfs_fonts'
        ]
    }
})
