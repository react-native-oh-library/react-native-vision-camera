
import { View } from "react-native";
import React, { forwardRef, memo } from "react";
import type { NativeVisionCameraProps } from './RTNVisionCameraNativeComponent';
import RTNVisionCamera from './RTNVisionCameraNativeComponent';
import RNCCameraView from "./NativeVisionCamera";
import { PhotoFile } from "./types/PhotoFile";

// export * from './Camera'
// export * from './CameraError'
// export * from './FrameProcessorPlugins'
// export * from './NativeVisionCamera'
// export * from './RTNVisionCameraNativeComponent'

// export * from './types/CameraDevice'
// export * from './types/CameraProps'
// export * from './types/Frame'
// export * from './types/Orientation'
// export * from './types/PhotoFile'
// export * from './types/Snapshot'
// export * from './types/PixelFormat'
// export * from './types/Point'
// export * from './types/VideoFile'
// export * from './types/CodeScanner'

// export * from './devices/getCameraFormat'
// export * from './devices/getCameraDevice'
// export * from './devices/Templates'

// export * from './hooks/useCameraDevice'
// export * from './hooks/useCameraDevices'
// export * from './hooks/useCameraFormat'
// export * from './hooks/useCameraPermission'
// export * from './hooks/useCodeScanner'
// export * from './hooks/useFrameProcessor'

// export * from './skia/useSkiaFrameProcessor'


function VisionCameraBase({
    style,
    children,
    forwardedRef,
    codeScanner,
    fps,
    isActive,
    preview,
    device,
    resizeMode,
    enableZoomGesture,
    exposure,
    zoom,
    audio,
    torch,
    onStarted,
    onStopped,
    onInitialized,
    onError,
    ...props
}: NativeVisionCameraProps & { forwardedRef: React.Ref<any> }) {
    return (
        <View style={[style]} ref={forwardedRef}>
            <RTNVisionCamera
                {...props}
                codeScanner={codeScanner}
                fps={fps}
                isActive={isActive}
                preview={preview}
                device={device}
                resizeMode={resizeMode}
                enableZoomGesture={enableZoomGesture}
                exposure={exposure}
                zoom={zoom}
                audio={audio}
                torch={torch}
                onStarted={onStarted}
                onStopped={onStopped}
                onInitialized={onInitialized}
                onError={onError}
            />
            {children}
        </View>
    )
}

const CameraMemo = memo(VisionCameraBase)

const CameraComponent: React.ComponentType<NativeVisionCameraProps> = forwardRef(
    (props: NativeVisionCameraProps, ref: React.Ref<any>) => (
        <CameraMemo forwardedRef={ref} {...props} />
    ),
)

CameraComponent.displayName = 'Camera'

export interface CameraStaticProperties {
}

interface CameraMethods {
    takePhoto: () => Promise<PhotoFile>;
    focus: () => void;
}


const Camera: React.ComponentType<NativeVisionCameraProps> & CameraStaticProperties & CameraMethods = CameraComponent as any

Camera.takePhoto = () => RNCCameraView.takePhoto();
Camera.focus = () => RNCCameraView.focus();

export default Camera;