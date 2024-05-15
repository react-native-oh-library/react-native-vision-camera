
import { View } from "react-native";
import React, { forwardRef, memo } from "react";
import type { NativeVisionCameraProps } from './NativeVisionCameraView';
import RTNVisionCamera from './NativeVisionCameraView';
export * from './hooks/useCameraDevice';
export * from './hooks/useCameraDevices';
export * from './hooks/useCameraFormat';
export * from './hooks/useCameraPermission';
export * from './hooks/useCodeScanner';
export * from './types/CodeScanner';

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
    video,
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
                video={video}
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
}


export const Camera: React.ComponentType<NativeVisionCameraProps> & CameraStaticProperties & CameraMethods = CameraComponent as any

export default Camera;
