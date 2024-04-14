import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import styleXPlugin from '@stylexjs/babel-plugin';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react({
      babel: {
        plugins: [
          [
            styleXPlugin,
            {
              dev: true,
              // Set this to true for snapshot testing
              // default: false
              test: false,
              // Required for CSS variable support
              unstable_moduleResolution: {
                // type: 'commonJS' | 'haste'
                // default: 'commonJS'
                type: 'commonJS',
                // The absolute path to the root directory of your project
                rootDir: __dirname,
              },
            },
          ],
        ],
      }
    })]
  }
})
