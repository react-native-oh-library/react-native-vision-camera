// const device = useCameraDevice('back');
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
    "photoWidth": 4096,
    "supportsPhotoHdr": false,
    "supportsDepthCapture": false,
    "maxISO": 51200,
    "minISO": 50,
    "minFps": 15,
    "videoWidth": 3840,
    "supportsVideoHdr": false,
    "videoHeight": 2160,
    "fieldOfView": 85.69407597607774,
    "maxFps": 30,
    "photoHeight": 3072
}