import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const FABIANS_TITLE = 'Who Are the Fabians? — BIP-110 War Chest'
const FABIANS_DESCRIPTION = 'A ministerial briefing on the alleged long-range Landauer attack, mitochondrial readiness and the missing public hash-rate receipt.'

function fabiansStaticRoute() {
  return {
    name: 'fabians-static-route',
    apply: 'build' as const,
    async closeBundle() {
      const outputDirectory = resolve(process.cwd(), 'dist')
      const indexHtml = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
      const fabiansHtml = indexHtml
        .replace(/<title>.*?<\/title>/, `<title>${FABIANS_TITLE}</title>`)
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
          `<meta name="description" content="${FABIANS_DESCRIPTION}" />`,
        )
        .replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
          `<meta property="og:title" content="${FABIANS_TITLE}" />`,
        )
        .replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
          `<meta property="og:description" content="${FABIANS_DESCRIPTION}" />`,
        )

      const routeDirectory = resolve(outputDirectory, 'fabians')
      await mkdir(routeDirectory, { recursive: true })
      await writeFile(resolve(routeDirectory, 'index.html'), fabiansHtml)
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), fabiansStaticRoute()],
})
