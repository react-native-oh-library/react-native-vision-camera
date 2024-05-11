<a href="https://margelo.io">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/static/img/banner-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./docs/static/img/banner-light.png" />
    <img alt="VisionCamera" src="./docs/static/img/banner-light.png" />
  </picture>
</a>

<br />

<div>
  <img align="right" width="35%" src="docs/static/img/example.png">
</div>

### Features

VisionCamera is a powerful, high-performance Camera library for React Native. It features:

* 📸 Photo and Video capture
* 👁️ QR/Barcode scanner
* 📱 Customizable devices and multi-cameras ("fish-eye" zoom)
* 🎞️ Customizable resolutions and aspect-ratios (4k/8k images)
* ⏱️ Customizable FPS (30..240 FPS)
* 🧩 [Frame Processors](https://react-native-vision-camera.com/docs/guides/frame-processors) (JS worklets to run facial recognition, AI object detection, realtime video chats, ...)
* 🎨 Drawing shapes, text, filters or shaders onto the Camera
* 🔍 Smooth zooming (Reanimated)
* ⏯️ Fast pause and resume
* 🌓 HDR & Night modes
* ⚡ Custom C++/GPU accelerated video pipeline (OpenGL)

Install VisionCamera from npm:

```sh
npm i react-native-vision-camera
cd ios && pod install
```

..and get started by [setting up permissions](https://react-native-vision-camera.com/docs/guides)!

### Documentation

* [Guides](https://react-native-vision-camera.com/docs/guides)
* [API](https://react-native-vision-camera.com/docs/api)
* [Example](./package/example/)
* [Frame Processor Plugins](https://react-native-vision-camera.com/docs/guides/frame-processor-plugins-community)

### ShadowLens

To see VisionCamera in action, check out [ShadowLens](https://mrousavy.com/projects/shadowlens)!

<div>
  <a href="https://apps.apple.com/app/shadowlens/id6471849004">
    <img height="40" src="docs/static/img/appstore.svg" />
  </a>
  <a href="https://play.google.com/store/apps/details?id=com.mrousavy.shadowlens">
    <img height="40" src="docs/static/img/googleplay.svg" />
  </a>
</div>

### Example

```tsx
function App() {
  const device = useCameraDevice('back')

  if (device == null) return <NoCameraErrorView />
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  )
}
```

> See the [example](./package/example/) app

### Adopting at scale

<a href="https://github.com/sponsors/mrousavy">
  <img align="right" width="160" alt="This library helped you? Consider sponsoring!" src=".github/funding-octocat.svg">
</a>

VisionCamera is provided _as is_, I work on it in my free time.

If you're integrating VisionCamera in a production app, consider [funding this project](https://github.com/sponsors/mrousavy) and <a href="mailto:me@mrousavy.com?subject=Adopting VisionCamera at scale">contact me</a> to receive premium enterprise support, help with issues, prioritize bugfixes, request features, help at integrating VisionCamera and/or Frame Processors, and more.

### Socials

* 🐦 [**Follow me on Twitter**](https://twitter.com/mrousavy) for updates
* 📝 [**Check out my blog**](https://mrousavy.com/blog) for examples and experiments
* 💬 [**Join the Margelo Community Discord**](https://discord.gg/6CSHz2qAvA) for chatting about VisionCamera
* 💖 [**Sponsor me on GitHub**](https://github.com/sponsors/mrousavy) to support my work
* 🍪 [**Buy me a Ko-Fi**](https://ko-fi.com/mrousavy) to support my work

### harmony使用说明

点击链接下载 [react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz](https://github.com/react-native-oh-library/react-native-vision-camera/blob/dev/package/react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz) 包，移动到tester目录下

在tester目录下安装tgz包 `npm i @react-native-oh-tpl/react-native-vision-camera@file:./react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz`

在tester目录下运行codegen

```shell
npm run codegen
```


`tester/harmony/entry/oh-package.json5` 添加以下内容

```json
{
  "dependencies": {
    "@react-native-oh-tpl/react-native-vision-camera": "file:../../node_modules/@react-native-oh-tpl/react-native-vision-camera/harmony/vision_camera.har"
  }
}
```

`tester/harmony/entry/ets/pages/Index.ets `添加以下内容

```tsx
import { VisionCameraView } from "@react-native-oh-tpl/react-native-vision-camera";

@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {
  Stack(){
    if (ctx.componentName === VisionCameraView.NAME) {
      VisionCameraView({
        ctx: ctx.rnComponentContext,
        tag: ctx.tag,
      })
    }
  }
}
```

`tester/harmony/entry/ets/RNPackagesFactory.ts `添加以下内容

```ts
import type { RNPackageContext, RNPackage } from 'rnoh/ts';
import { VisionCameraViewPackage } from "@react-native-oh-tpl/react-native-vision-camera/ts";

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new VisionCameraViewPackage(ctx),
  ];
}
```



