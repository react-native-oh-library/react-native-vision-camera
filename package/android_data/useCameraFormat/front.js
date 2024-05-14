// const device = useCameraDevice('front');
// const format = useCameraFormat(device, [
//     { videoResolution: { width: 3048, height: 1960 } },
//     { fps: 60 }
// ])
const device = {
    "videoStabilizationModes": [
        "off",
        "cinematic"
    ],
    "autoFocusSystem": "contrast-detection",
    "photoWidth": 3840,
    "supportsPhotoHdr": false,
    "supportsDepthCapture": false,
    "maxISO": 12392,
    "minISO": 50,
    "minFps": 10,
    "videoWidth": 3840,
    "supportsVideoHdr": false,
    "videoHeight": 2160,
    "fieldOfView": 80.43544584092406,
    "maxFps": 30,
    "photoHeight": 2160
}