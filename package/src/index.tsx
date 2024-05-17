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


// Types
export * from './types/CameraDevice'
export * from './types/Frame'
export * from './types/Orientation'
export * from './types/PhotoFile'
export * from './types/PixelFormat'
export * from './types/Point'
export * from './types/CodeScanner'

// Devices API
export * from './devices/getCameraFormat'
export * from './devices/getCameraDevice'
export * from './devices/Templates'

// Hooks
export * from './hooks/useCameraDevice'
export * from './hooks/useCameraDevices'
export * from './hooks/useCameraFormat'
export * from './hooks/useCameraPermission'
export * from './hooks/useCodeScanner'

import { CameraDevicesChangedCallback, CameraDevicesChangedReturn, CameraPermissionRequestResult, CameraPermissionStatus } from "./NativeVisionCameraModule";
import { CameraDevice } from "./types/CameraDevice";

type VisionCameraCommands =
    | 'takePhoto'
    | 'focus'
    | 'startRecording'
    | 'stopRecording'
    | 'pauseRecording'
    | 'resumeRecording'
    | 'cancelRecording'
    | 'getAvailableCameraDevices'
    | 'addCameraDevicesChangedListener'
    | 'getCameraPermissionStatus'
    | 'requestCameraPermission'
    | 'getMicrophonePermissionStatus'
    | 'requestMicrophonePermission'
    | 'getLocationPermissionStatus'
    | 'requestLocationPermission'

export interface VisionCameraRef extends Omit<VisionCameraCommandsType, VisionCameraCommands> {
    takePhoto: () => Promise<PhotoFile>;
    focus: (x: Double, y: Double) => Promise<void>;
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    cancelRecording: () => void;
    getAvailableCameraDevices: () => CameraDevice[];
    addCameraDevicesChangedListener: (listener: CameraDevicesChangedCallback) => CameraDevicesChangedReturn;
    getCameraPermissionStatus: () => CameraPermissionStatus;
    requestCameraPermission: () => Promise<CameraPermissionRequestResult>;
    getMicrophonePermissionStatus: () => CameraPermissionStatus;
    requestMicrophonePermission: () => Promise<CameraPermissionRequestResult>;
    getLocationPermissionStatus: () => CameraPermissionStatus;
    requestLocationPermission: () => Promise<CameraPermissionRequestResult>;
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

        const getAvailableCameraDevices = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.getAvailableCameraDevices(VisionCameraRef.current);
            },
            []
        );

        const addCameraDevicesChangedListener = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.addCameraDevicesChangedListener(VisionCameraRef.current);
            },
            []
        );

        const getCameraPermissionStatus = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.getCameraPermissionStatus(VisionCameraRef.current);
            },
            []
        );

        const requestCameraPermission = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.requestCameraPermission(VisionCameraRef.current);
            },
            []
        );

        const getMicrophonePermissionStatus = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.getMicrophonePermissionStatus(VisionCameraRef.current);
            },
            []
        );

        const requestMicrophonePermission = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.requestMicrophonePermission(VisionCameraRef.current);
            },
            []
        );

        const getLocationPermissionStatus = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.getLocationPermissionStatus(VisionCameraRef.current);
            },
            []
        );

        const requestLocationPermission = useCallback(
            () => {
                if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");
                return VisionCameraCommands.requestLocationPermission(VisionCameraRef.current);
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
                getAvailableCameraDevices,
                addCameraDevicesChangedListener,
                getCameraPermissionStatus,
                requestCameraPermission,
                getMicrophonePermissionStatus,
                requestMicrophonePermission,
                getLocationPermissionStatus,
                requestLocationPermission,
            }),
            [
                focus,
                takePhoto,
                startRecording,
                stopRecording,
                pauseRecording,
                resumeRecording,
                cancelRecording,
                getAvailableCameraDevices,
                addCameraDevicesChangedListener,
                getCameraPermissionStatus,
                requestCameraPermission,
                getMicrophonePermissionStatus,
                requestMicrophonePermission,
                getLocationPermissionStatus,
                requestLocationPermission,
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

export interface Camera extends VisionCameraRef { };

export default Camera;