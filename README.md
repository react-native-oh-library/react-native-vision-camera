
### harmony使用说明

点击链接下载 [react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz](https://github.com/react-native-oh-library/react-native-vision-camera/blob/dev/package/react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz) 包，移动到tester目录下

在tester目录下安装tgz包 `npm i @react-native-oh-tpl/react-native-vision-camera@file:./react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.1.tgz`

`tester/harmony/entry/oh-package.json5` 添加以下内容

```json
{
  "dependencies": {
    "@react-native-oh-tpl/react-native-vision-camera": "file:../../node_modules/@react-native-oh-tpl/react-native-vision-camera/harmony/vision_camera.har"
  }
}
```

`tester/harmony/entry/src/main/cpp/CMakeLists.txt`添加以下内容

```diff
+set(VISION_CAMERA_DIR "../../../oh_modules/@react-native-oh-tpl/react-native-vision-camera/src/main/cpp")

add_subdirectory("../../../../sample_package/src/main/cpp" ./sample-package)
+add_subdirectory("${VISION_CAMERA_DIR}" ./vision-camera)
# RNOH_END: manual_package_linking_1

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")
+file(GLOB VISION_CAMERA_CPP_FILES "${VISION_CAMERA_DIR}/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
+    ${VISION_CAMERA_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_link_libraries(rnoh_app PUBLIC rnoh_sample_package)
+target_link_libraries(rnoh_app PUBLIC rnoh_vision_camera)
```

`tester/harmony/entry/src/main/cpp/PackageProvider.cpp`添加以下内容

```diff
#include "SamplePackage.h"
+#include "VisionCameraPackage.h"
std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<SamplePackage>(ctx),
+        std::make_shared<VisionCameraPackage>(ctx),
    };
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



