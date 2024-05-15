import React, {
    useCallback,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
import {
    View,
    StyleSheet,
} from "react-native";
import NativeVisionCameraView, { VisionCameraCommands } from "./NativeVisionCameraView";
import type { VisionCameraCommandsType, VisionCameraComponentType } from "./NativeVisionCameraView";

import type { NativeSyntheticEvent } from "react-native";
import { PhotoFile } from "./types/PhotoFile";
import { VisionCameraProps } from "./types/Camera";
import { Double } from "react-native/Libraries/Types/CodegenTypes";

export interface VisionCameraRef extends Omit<VisionCameraCommandsType, 'focus' | 'takePhoto'> {
    takePhoto: () => Promise<PhotoFile>;
    focus: (x: Double, y: Double) => Promise<void>;
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    cancelRecording: () => void;
}

export const Camera = forwardRef<VisionCameraRef, VisionCameraProps>(
    (
        {
            style,
            device,
            isActive,
            preview,
            resizeMode,
            fps,
            enableZoomGesture,
            codeScanner,
            format,
            exposure,
            zoom,
            audio,
            video,
            torch,
            onTouchEnd,
            onStarted,
            onStopped,
            onInitialized,
            onError,
            ...rest
        },
        ref
    ) => {
        const VisionCameraRef = useRef<React.ElementRef<VisionCameraComponentType>>(null);

        const takePhoto = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.takePhoto(VisionCameraRef.current);
            },
            []
        );

        const focus = useCallback(
            (x: Double, y: Double) => {
                if (isNaN(x) || isNaN(y)) throw new Error("VisionCameraCommands focus point x or y is NaN");
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.focus(VisionCameraRef.current, x, y);
            },
            []
        );

        const startRecording = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.startRecording(VisionCameraRef.current);
            },
            []
        );

        const stopRecording = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.stopRecording(VisionCameraRef.current);
            },
            []
        );

        const pauseRecording = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.pauseRecording(VisionCameraRef.current);
            },
            []
        );

        const resumeRecording = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.resumeRecording(VisionCameraRef.current);
            },
            []
        );

        const cancelRecording = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.cancelRecording(VisionCameraRef.current);
            },
            []
        );


        const onVisionCameraStarted = useCallback(
            () => {
                onStarted?.();
            },
            [onStarted]
        );

        const onVisionCameraStopped = useCallback(
            () => {
                onStopped?.();
            },
            [onStopped]
        );

        const onVisionCameraInitialized = useCallback(
            () => {
                onInitialized?.();
            },
            [onInitialized]
        );

        const onVisionCameraError = useCallback(
            (error: NativeSyntheticEvent<{ error: string }>) => {
                onError?.(error.nativeEvent);
            },
            [onError]
        );

        useImperativeHandle(
            ref,
            () => ({
                focus,
                takePhoto,
                startRecording,
                stopRecording,
                pauseRecording,
                resumeRecording,
                cancelRecording,
            }),
            [
                focus,
                takePhoto,
                startRecording,
                stopRecording,
                pauseRecording,
                resumeRecording,
                cancelRecording,
            ]
        );

        return (
            <View style={style}>
                <NativeVisionCameraView
                    ref={VisionCameraRef}
                    style={StyleSheet.absoluteFill}
                    codeScanner={codeScanner}
                    fps={fps}
                    isActive={false}
                    preview={preview}
                    device={device}
                    resizeMode={resizeMode}
                    enableZoomGesture={enableZoomGesture}
                    exposure={exposure}
                    zoom={zoom}
                    audio={audio}
                    video={video}
                    torch={torch}
                    onStarted={onVisionCameraStarted}
                    onStopped={onVisionCameraStopped}
                    onInitialized={onVisionCameraInitialized}
                    onError={onVisionCameraError}
                    {...rest}
                />
            </View>
        );
    }
);

export default Camera;
