import express from 'express';
import path from 'path';
import fs from 'fs';
import serverless from 'serverless-http'; // Keep this for Netlify

// Dynamically import the SSR bundle.
// The path '../dist/server/entry-server.js' assumes this function file is in `netlify/functions/ssr.js`
// and the server build output is in `dist/server/`.
const { render } = await import('../dist/server/entry-server.js');

const app = express();
const router = express.Router();

// --- Path resolution ---
// The `dist/client` folder is published at the root of the site.
const distPath = path.resolve(process.cwd(), 'dist/client'); // Vite client builds to 'dist/client'
const indexPath = path.resolve(distPath, 'index.html');

// Serve static files from the 'dist/client' folder
app.use(express.static(distPath, { index: false })); // `index: false` prevents express from serving index.html on its own

// All other requests are handled by our main SSR logic
router.get('*', async (req, res) => {
  try {
    const url = req.originalUrl;
    console.log('SSR: ⚡ Processing request for URL:', url);

    // 1. Read the index.html template
    let template = fs.readFileSync(indexPath, 'utf-8');

    // 2. Call the render function from your SSR bundle
    const helmetContext = {};
    const { html: appHtml, state, helmet } = await render(url, helmetContext);

    // 3. Inject the rendered app's HTML into the template
    template = template.replace('<!--ssr-outlet-->', appHtml);

    // 4. Inject the server-rendered head tags (from react-helmet-async)
    const headTags = [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
      helmet.style.toString(),
      helmet.script.toString(),
      helmet.noscript.toString(),
    ].join('');
    template = template.replace('</head>', `${headTags}</head>`);

    // 5. Inject the dehydrated state of React Query
    template = template.replace(
      '</head>',
      `<script>window.__DEHYDRATED_STATE__ = ${state}</script></head>`
    );

    // 6. Send the final HTML to the browser
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  } catch (error) {
    console.error('SSR: ❌ Top-level error:', error);
    // In case of an error, fall back to client-side rendering
    res.status(500).set({ 'Content-Type': 'text/html' }).end(fs.readFileSync(indexPath, 'utf-8'));
  }
});

app.use('/.netlify/functions/ssr', router); // Path must match the function name

export const handler = serverless(app);