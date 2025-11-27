import fs from 'node:fs/promises'
import express from 'express'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5000
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''

// Create http server
const app = express()

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Define SSR routes
const ssrRoutes = [
  /^\/$/,
  /^\/auth/,
  /^\/terms-of-service$/,
  /^\/privacy-policy$/,
  /^\/about-us$/,
  /\/post\/[^\/]+/,
  /\/p\/[^\/]+/,
  /\/reel\/[^\/]+/,
];

// Serve HTML
app.use(/.*/, async (req, res) => {
  try {
    const url = req.originalUrl;

    const isSsrRoute = ssrRoutes.some((pattern) => pattern.test(url));

    if (!isSsrRoute) {
      // For non-SSR routes, serve the main index.html for client-side rendering.
      // This will be handled by the client-side router.
      let template
      if (!isProduction) {
        template = await fs.readFile('./index.html', 'utf-8')
        template = await vite.transformIndexHtml(req.originalUrl, template)
      } else {
        template = templateHtml
      }
      return res.status(200).set({ 'Content-Type': 'text/html' }).send(template)
    }

    // SSR logic for matched routes
    console.log(`[SSR] Rendering route: ${url}`);
    let template
    let render
    if (!isProduction) {
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const rendered = await render(url)
    const html = template
      .replace('<!--app-head-->', rendered.head ?? '')
      .replace('<!--app-html-->', rendered.html ?? '')
    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e) {
    if (vite) {
      vite.ssrFixStacktrace(e);
    }
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
