# rheo-example-bare

Runnable **bare React Native** sample for [`@getrheo/react-native-bare`](https://www.npmjs.com/package/%40getrheo%2Freact-native-bare) — minimal host for `react-native-video`, in-app review, and required peers without Expo modules.

Not published to npm.

## Quick start

```bash
git clone https://github.com/getrheo/rheo-example-bare.git
cd rheo-example-bare
pnpm install
pnpm start
# separate terminal: pnpm ios   or   pnpm android
```

The config screen defaults to **`https://api.getrheo.io`**. Use `http://localhost:4000` when testing against a local API.

## SDK repository

[rheo-react-native](https://github.com/getrheo/rheo-react-native)

## Development

```bash
pnpm install
pnpm verify
```

[Documentation](https://docs.getrheo.io/docs/developer-guide/sdk-bare-react-native) · [CONTRIBUTING](./CONTRIBUTING.md) · [MIT](./LICENSE)
