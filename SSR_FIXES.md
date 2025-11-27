# Unifying Client-Side and Server-Side Rendering in a Single Vite App

This document outlines the steps taken to configure a Vite application to use both client-side rendering (CSR) and server-side rendering (SSR) from a single server.

## The Goal

The main objective was to have a single Express server that could handle both client-side rendered pages and server-side rendered pages for specific routes, all running on a single port.

## The Journey

I started with a standard Vite + React application, then added an Express server. The path to a unified server had a few bumps along the way. Here's a summary of the challenges I faced and how I solved them.

### 1. PWA Build Errors

**Problem:** The initial production build failed with errors related to `workbox-window` and `workbox-precaching`.

**Solution:** I added the necessary Workbox libraries to our `devDependencies` in `package.json`:

```json
"devDependencies": {
  ...
  "workbox-window": "^7.3.0",
  "workbox-precaching": "^7.3.0",
  "workbox-routing": "^7.3.0",
  "workbox-strategies": "^7.3.0"
}
```

### 2. Top-Level Await Error

**Problem:** The server-side build failed with an error about top-level `await` not being supported in the target environment.

**Solution:** I updated our `vite.config.ts` to set the build target to `es2022`, which supports top-level `await`:

```typescript
// vite.config.ts
export default defineConfig({
  // ...
  build: {
    target: "es2022",
    // ...
  },
});
```

### 3. Virtual Module Error in SSR

**Problem:** When rendering a page on the server, I encountered an `ERR_UNSUPPORTED_ESM_URL_SCHEME` error for `virtual:pwa-register`. This happened because the PWA registration code, which is meant for the client, was being included in the server build.

**Solution:** I modified our `App.tsx` to only render the `ServiceWorkerRegistration` component on the client-side. I achieved this by dynamically importing the component with `React.lazy` and wrapping it in a `ClientOnly` component and `Suspense`:

```typescriptreact
// src/App.tsx
const ServiceWorkerRegistration = lazy(() => import("@/components/ServiceWorkerRegistration"));

function App() {
  return (
    // ...
    <ClientOnly>
      <Suspense fallback={null}>
        <ServiceWorkerRegistration />
      </Suspense>
    </ClientOnly>
    // ...
  );
}
```

### 4. `jsxDEV` Error in Production

**Problem:** The production build was still failing with a `TypeError: jsxDEV is not a function` error, which is specific to the development version of React's JSX runtime.

**Solution:** I forced the `NODE_ENV` to `production` in the `build:server` script in our `package.json`. This ensures that Vite uses the production JSX runtime for the server build.

```json
// package.json
"scripts": {
  // ...
  "build:server": "cross-env NODE_ENV=production vite build --ssr src/entry-server.tsx --outDir dist/server"
}
```

I also ensured that our `tsconfig.json` files Ire configured to use the `react-jsx` runtime.

## The Result

After these changes, I have a single server that can seamlessly handle both client-side and server-side rendered pages. This setup provides the performance benefits of SSR for specific routes while maintaining the flexibility of a client-side rendered application.
