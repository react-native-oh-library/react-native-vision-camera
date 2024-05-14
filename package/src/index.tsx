
import { View } from "react-native";
import React, { forwardRef, memo } from "react";
import type { NativeVisionCameraProps } from './NativeVisionCameraView';
import RTNVisionCamera from './NativeVisionCameraView';
import NativeVisionCameraModule from "./NativeVisionCameraModule";
export * from './hooks/useCameraDevice'
export * from './hooks/useCameraDevices'
export * from './hooks/useCameraFormat'
export * from './hooks/useCameraPermission'

export interface PhotoFile {
    width: number
    height: number
}

function VisionCameraViewBase({
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

const CameraMemo = memo(VisionCameraViewBase)

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


export const Camera: React.ComponentType<NativeVisionCameraProps> & CameraStaticProperties & CameraMethods = CameraComponent as any

Camera.takePhoto = () => NativeVisionCameraModule.takePhoto();
Camera.focus = () => NativeVisionCameraModule.focus();

export default Camera;
