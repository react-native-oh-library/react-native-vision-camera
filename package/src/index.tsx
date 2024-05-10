
import { View } from "react-native";
import React, { forwardRef, memo } from "react";
import type { NativeVisionCameraProps } from './RTNVisionCameraNativeComponent';
import RTNVisionCamera from './RTNVisionCameraNativeComponent';
import RNCCameraView from "./NativeVisionCamera";
import { PhotoFile } from "./types/PhotoFile";



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