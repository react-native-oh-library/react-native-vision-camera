## 权限配置

需要在 `entry` 的 `module.json5` 的 `requestPermissions` 字段中加入以下权限

```json
{
    "name": "ohos.permission.CAMERA",
    "reason": "$string:camera_reason",
    "usedScene": {}
},
{
    "name": "ohos.permission.MICROPHONE",
    "reason": "$string:microphone_reason",
    "usedScene": {}
},
{
    "name": "ohos.permission.MEDIA_LOCATION",
    "reason": "$string:location_reason",
    "usedScene": {}
},
{
    "name": "ohos.permission.WRITE_MEDIA",
    "reason": "$string:write_media",
    "usedScene": {}
},
{
    "name": "ohos.permission.READ_MEDIA",
    "reason": "$string:write_media",
    "usedScene": {}
}
```

## 使用示例

```tsx
import * as React from "react";
import { useRef } from "react";
import {
    Camera,
    Code,
    useCameraDevice,
    useCodeScanner,
} from "react-native-vision-camera";

/**
 * "react-native-vision-camera": "4.0.1"
 * android 34
 * ios 12.4
 */
export const MyCamera = () => {
    const camera = useRef<Camera>(null);
    const device = useCameraDevice("back");
    const codeScanner = useCodeScanner({
        codeTypes: ["qr", "code-128"],
        regionOfInterest: undefined,
        onCodeScanned: (results: Code[]) => { },
    });

    const takePhoto = () => {
        camera.current?.takePhoto().then((value) => {
            console.log("value", value);
        });
    };

    const focus = ({ x, y }: { x: number; y: number }) => {
        camera.current?.focus({ x, y }).then((value) => { });
    };

    if (device == null) {
        return null;
    }

    return (
        <Camera
            ref={camera}
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            preview={true}
            resizeMode={"cover"}
            enableZoomGesture={true}
            codeScanner={codeScanner}
            exposure={0}
            zoom={1.0}
            audio={false}
            torch={"off"}
            onTouchEnd={(e) => { }}
            onStarted={() => { }}
            onStopped={() => { }}
            onInitialized={() => { }}
            onError={(e) => { }}
        ></Camera>
    );
};
```

