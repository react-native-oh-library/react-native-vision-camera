// import React, {
//     useState,
//     useCallback,
//     useMemo,
//     useRef,
//     forwardRef,
//     useImperativeHandle,
// } from "react";
// import {
//     View,
//     StyleSheet,
//     Image,
//     Platform,
// } from "react-native";
// import NativeVisionCameraView, { VisionCameraCommands } from "./NativeVisionCameraView";
// import type { VisionCameraCommandsType, VisionCameraComponentType } from "./NativeVisionCameraView";

// import type { StyleProp, ImageStyle, NativeSyntheticEvent } from "react-native";
// import { PhotoFile } from "./types/PhotoFile";
// import { VisionCameraProps } from "./types/Camera";
// import { Double } from "react-native/Libraries/Types/CodegenTypes";

// export interface VisionCameraRef extends Omit<VisionCameraCommandsType, 'focus' | 'takePhoto'> {
//     takePhoto: () => Promise<PhotoFile>;
//     focus: () => Promise<void>;
// }

// const Video = forwardRef<VisionCameraRef, VisionCameraProps>(
//     (
//         {
//             style,
//             device,
//             isActive,
//             preview,
//             resizeMode,
//             fps,
//             enableZoomGesture,
//             codeScanner,
//             format,
//             exposure,
//             zoom,
//             audio,
//             video,
//             torch,
//             onTouchEnd,
//             onStarted,
//             onStopped,
//             onInitialized,
//             onError,
//             ...rest
//         },
//         ref
//     ) => {
//         const VisionCameraRef = useRef<React.ElementRef<VisionCameraComponentType>>(null);

//         const focus = useCallback(
//             (x: Double, y: Double) => {
//                 if (isNaN(x) || isNaN(y)) throw new Error("VisionCameraCommands focus point x or y is NaN");
//                 if (!VisionCameraRef.current) return;
//                 VisionCameraCommands.focus(VisionCameraRef.current, x, y);
//             },
//             []
//         );

//         const takePhoto = useCallback(
//             () => {
//                 if (!VisionCameraRef.current) throw new Error("VisionCameraRef.current is NaN");;
//                 return VisionCameraCommands.takePhoto(VisionCameraRef.current);
//             },
//             []
//         );

//         const onVideoLoadStart = useCallback(
//             (e: NativeSyntheticEvent<OnLoadStartData>) => {
//                 onLoadStart?.(e.nativeEvent);
//             },
//             [onLoadStart]
//         );

//         // const onVideoLoad = useCallback(
//         //   (e: NativeSyntheticEvent<OnLoadData>) => {
//         //     if (Platform.OS === "windows") setShowPoster(false);
//         //     onLoad?.(e.nativeEvent);
//         //   },
//         //   [onLoad, setShowPoster]
//         // );

//         /** @todo: fix type */
//         const _onVideoLoad = useCallback(
//             (e: NativeSyntheticEvent<OnLoadData>) => {
//                 if (Platform.OS === "windows") setShowPoster(false);
//                 onLoad?.(e.nativeEvent);
//             },
//             [onLoad, setShowPoster]
//         );

//         const onVideoError = useCallback(
//             (e: NativeSyntheticEvent<OnVideoErrorData>) => {
//                 onError?.(e.nativeEvent);
//             },
//             [onError]
//         );

//         const onVideoProgress = useCallback(
//             (e: NativeSyntheticEvent<OnProgressData>) => {
//                 onProgress?.(e.nativeEvent);
//             },
//             [onProgress]
//         );

//         const onVideoSeek = useCallback(
//             (e: NativeSyntheticEvent<OnSeekData>) => {
//                 onSeek?.(e.nativeEvent);
//             },
//             [onSeek]
//         );

//         /** @todo: fix type */
//         const _onTimedMetadata = useCallback(
//             (e: NativeSyntheticEvent<OnTimedMetadataData>) => {
//                 onTimedMetadata?.(e.nativeEvent);
//             },
//             [onTimedMetadata]
//         );

//         const _onPlaybackRateChange = useCallback(
//             (e: NativeSyntheticEvent<Readonly<{ playbackRate: number }>>) => {
//                 onPlaybackRateChange?.(e.nativeEvent);
//             },
//             [onPlaybackRateChange]
//         );

//         const _onReadyForDisplay = useCallback(() => {
//             setShowPoster(false);
//             onReadyForDisplay?.();
//         }, [setShowPoster, onReadyForDisplay]);

//         const _onPictureInPictureStatusChanged = useCallback(
//             (e: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>) => {
//                 onPictureInPictureStatusChanged?.(e.nativeEvent);
//             },
//             [onPictureInPictureStatusChanged]
//         );

//         const _onAudioFocusChanged = useCallback((e: NativeSyntheticEvent<OnAudioFocusChangedData>) => {
//             onAudioFocusChanged?.(e.nativeEvent)
//         }, [onAudioFocusChanged])

//         const onVideoBuffer = useCallback((e: NativeSyntheticEvent<OnBufferData>) => {
//             onBuffer?.(e.nativeEvent);
//         }, [onBuffer]);

//         const onVideoExternalPlaybackChange = useCallback((e: NativeSyntheticEvent<OnExternalPlaybackChangeData>) => {
//             onExternalPlaybackChange?.(e.nativeEvent);
//         }, [onExternalPlaybackChange])

//         const _onBandwidthUpdate = useCallback((e: NativeSyntheticEvent<OnBandwidthUpdateData>) => {
//             onBandwidthUpdate?.(e.nativeEvent);
//         }, [onBandwidthUpdate]);


//         const onGetLicense = useCallback(
//             (event: NativeSyntheticEvent<OnGetLicenseData>) => {
//                 if (drm && drm.getLicense instanceof Function) {
//                     const data = event.nativeEvent;
//                     if (data && data.spcBase64) {
//                         const getLicenseOverride = drm.getLicense(data.spcBase64, data.contentId, data.licenseUrl);
//                         const getLicensePromise = Promise.resolve(getLicenseOverride); // Handles both scenarios, getLicenseOverride being a promise and not.
//                         getLicensePromise.then((result => {
//                             if (result !== undefined) {
//                                 //   if (VisionCameraRef.current) VisionCameraCommands.setLicenseResult(VisionCameraRef.current, result);
//                                 // } else {
//                                 //   if (VisionCameraRef.current) VisionCameraCommands.setLicenseResultError(VisionCameraRef.current, 'Empty license result');
//                             }
//                         })).catch(() => {
//                             // if (VisionCameraRef.current) VisionCameraCommands.setLicenseResultError(VisionCameraRef.current, 'fetch error');
//                         });
//                     } else {
//                         // if (VisionCameraRef.current) VisionCameraCommands.setLicenseResultError(VisionCameraRef.current, 'No spc received');
//                     }
//                 }
//             },
//             [drm]
//         );

//         useImperativeHandle(
//             ref,
//             () => ({
//                 focus,
//                 takePhoto,
//             }),
//             [
//                 focus,
//                 takePhoto,
//             ]
//         );

//         return (
//             <View style={style}>
//                 <NativeVisionCameraView
//                     ref={VisionCameraRef}
//                     {...rest}
//                     src={src}
//                     drm={_drm}
//                     style={StyleSheet.absoluteFill}
//                     resizeMode={resizeMode}
//                     fullscreen={isFullscreen}
//                     restoreUserInterfaceForPIPStopCompletionHandler={
//                         _restoreUserInterfaceForPIPStopCompletionHandler
//                     }
//                     textTracks={textTracks}
//                     selectedTextTrack={_selectedTextTrack}
//                     selectedAudioTrack={_selectedAudioTrack}
//                     selectedVideoTrack={_selectedVideoTrack}
//                     onGetLicense={onGetLicense}
//                     onVideoLoad={(e) => {
//                         _onVideoLoad(e as NativeSyntheticEvent<OnLoadData>)
//                     }}
//                     onVideoLoadStart={onVideoLoadStart}
//                     onVideoError={onVideoError}
//                     onVideoProgress={onVideoProgress}
//                     onVideoSeek={onVideoSeek}
//                     onVideoEnd={onEnd}
//                     onVideoBuffer={onVideoBuffer}
//                     onBandwidthUpdate={_onBandwidthUpdate}
//                     onTimedMetadata={(e) => {
//                         _onTimedMetadata(e as NativeSyntheticEvent<OnTimedMetadataData>)
//                     }}
//                     onVideoFullscreenPlayerDidDismiss={onFullscreenPlayerDidDismiss}
//                     onVideoFullscreenPlayerDidPresent={onFullscreenPlayerDidPresent}
//                     onVideoFullscreenPlayerWillDismiss={onFullscreenPlayerWillDismiss}
//                     onVideoFullscreenPlayerWillPresent={onFullscreenPlayerWillPresent}
//                     onVideoExternalPlaybackChange={onVideoExternalPlaybackChange}
//                     onAudioFocusChanged={_onAudioFocusChanged}
//                     onReadyForDisplay={_onReadyForDisplay}
//                     onPlaybackRateChange={_onPlaybackRateChange}
//                     onVideoAudioBecomingNoisy={onAudioBecomingNoisy}
//                     onPictureInPictureStatusChanged={_onPictureInPictureStatusChanged}
//                     onRestoreUserInterfaceForPictureInPictureStop={
//                         onRestoreUserInterfaceForPictureInPictureStop
//                     }
//                 />
//                 {showPoster ? (
//                     <Image style={posterStyle} source={{ uri: poster }} />
//                 ) : null}
//             </View>
//         );
//     }
// );

// export default Video;
