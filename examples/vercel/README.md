# Vercel DXF Preview

This example deploys a small DXF viewer to Vercel. The browser uploads raw DXF
bytes to `/api/parse-dxf`, the Vercel Node function reads the file with
`acadrust.js`, and the returned `DrawingJson` is rendered on a canvas.

## Deploy

1. Publish `acadrust.js` and its platform packages to npm.
2. Import this repository in Vercel.
3. Set the Vercel root directory to `examples/vercel`.
4. Deploy with the default install/build settings.

The Vercel runtime is Linux x64, so `vercel.json` explicitly includes the
`acadrust.js-linux-x64-gnu` native package files in the serverless function.

## Local Development

After `acadrust.js` is published:

```sh
cd examples/vercel
npm install
npm run dev
```

For local development before publishing the package, build the repository root
first and point the example at the local ESM entrypoint and native binary:

```sh
npm run build
cd examples/vercel
ACADRUST_JS_IMPORT=../../../dist/index.js \
NAPI_RS_NATIVE_LIBRARY_PATH="$(pwd)/../../acadrust-js.linux-x64-gnu.node" \
npm run dev
```
