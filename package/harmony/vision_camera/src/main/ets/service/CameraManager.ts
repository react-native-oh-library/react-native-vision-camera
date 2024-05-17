import camera from '@ohos.multimedia.camera';
import Logger from '../utils/Logger';
import { CameraDeviceFormat, CameraDeviceInfo } from '../core/CameraDeviceInfo';

import { PhysicalCameraDeviceType, CameraPosition, VideoStabilizationMode } from '../core/CameraEnumBox';
import { CameraPermissionRequestResult, CameraPermissionStatus, PermissionArray } from '../core/CameraConfig';
import PermissionUtils from "../utils/PermissionUtils";
import { Context } from '@kit.AbilityKit';
declare function getContext(component?: Object | undefined): Context;

const TAG: string = 'CameraDevice:'

export default class CameraManager {
  private cameraManager?: camera.CameraManager;

  constructor() {
    let context = getContext(this);
    try {
      Logger.info(TAG, 'getCameraManager try begin');
      this.cameraManager = camera.getCameraManager(context);
      Logger.info(TAG, 'getCameraManager try end');
    } catch (e) {
      Logger.info(TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): Array<camera.CameraDevice> {
    Logger.info(TAG, 'getAvailableCameraDevices start');
    let camerasArray = this.cameraManager?.getSupportedCameras();
    if (!camerasArray) {
      Logger.error(TAG, 'getAvailableCameraDevices cannot get cameras');
      return;
    }
    Logger.info(TAG, `getAvailableCameraDevices get cameras ${camerasArray.length}`);
    return camerasArray;
  }

  convertCameraDeviceInfo(cameraDevices: Array<camera.CameraDevice>): Array<CameraDeviceInfo> {
    if (!cameraDevices) {
      Logger.error(TAG, 'convertCameraDeviceInfo cameraDevices is null');
      return;
    }
    let photoSession: camera.PhotoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_PHOTO);
    let zoomRatioRange: Array<number> = photoSession.getZoomRatioRange();
    let biasRangeArray: Array<number> = photoSession.getExposureBiasRange();

    // todo autoFocusSystem
    let videoSession: camera.VideoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_VIDEO);

    let supportedVideoStabilizationMode: Array<VideoStabilizationMode> =
      this.getSupportedVideoStabilizationMode(videoSession);
    let isFocusSupported = this.focusSupport(photoSession);

    let cameraArray: Array<CameraDeviceInfo> = [];
    cameraDevices.forEach((cameraDevice) => {
      let cameraInfo: CameraDeviceInfo = {} as CameraDeviceInfo;
      cameraInfo.id = cameraDevice.cameraId;
      cameraInfo.supportsFocus = isFocusSupported;
      if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_WIDE_ANGLE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.WIDE_ANGLE_CAMERA];
      } else if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_ULTRA_WIDE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.ULTRA_WIDE_ANGLE_CAMERA];
      } else {
        Logger.info(TAG, `CameraType: ${cameraDevice.cameraType}`);
      }
      if (cameraDevice.connectionType === camera.ConnectionType.CAMERA_CONNECTION_BUILT_IN) {
        if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) {
          cameraInfo.position = CameraPosition.BACK
        } else if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
          cameraInfo.position = CameraPosition.FRONT
        } else {
          Logger.info(TAG, `CameraPosition: ${cameraDevice.cameraPosition}`);
        }
      } else {
        cameraInfo.position = CameraPosition.EXTERNAL
      }
      cameraInfo.hasFlash = this.cameraManager?.isTorchSupported();
      cameraInfo.hasTorch = this.cameraManager?.isTorchModeSupported(camera.TorchMode.ON);
      if (zoomRatioRange) {
        cameraInfo.minZoom = zoomRatioRange[0];
        cameraInfo.maxZoom = zoomRatioRange[1];
      }
      if (biasRangeArray) {
        cameraInfo.minExposure = biasRangeArray[0];
        cameraInfo.maxExposure = biasRangeArray[1];
      }
      let cameraDeviceFormats: Array<CameraDeviceFormat> = [];
      let photoCapability =
        this.cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_PHOTO);
      for (const pProfile of photoCapability.photoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.photoHeight = pProfile.size.height;
        cameraDeviceFormat.photoWidth = pProfile.size.width;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }

      let videoCapability =
        this.cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_PHOTO);
      for (const vProfile of videoCapability.videoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.videoHeight = vProfile.size.height;
        cameraDeviceFormat.videoWidth = vProfile.size.width;
        cameraDeviceFormat.minFps = vProfile.frameRateRange.min;
        cameraDeviceFormat.maxFps = vProfile.frameRateRange.max;
        cameraDeviceFormat.videoStabilizationModes = supportedVideoStabilizationMode;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      cameraInfo.formats = cameraDeviceFormats;
      cameraArray.push(cameraInfo);
    })
    return cameraArray;
  }

  private getSupportedVideoStabilizationMode(videoSession: camera.VideoSession) {
    let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = [];
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.OFF)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.OFF);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.LOW)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.STANDARD);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.MIDDLE)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.CINEMATIC);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.HIGH)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.CINEMATIC_EXTENDED);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.AUTO)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.AUTO);
    }
    return supportedVideoStabilizationMode;
  }

  private focusSupport(photoSession: camera.PhotoSession): boolean {
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_MANUAL)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_CONTINUOUS_AUTO)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_LOCKED)) {
      return true
    }
    return false;
  }


  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus() {
    let value = new PermissionUtils().checkPermission(PermissionArray[0]);
    return value ? "granted" : "not-determined";
  }

  /**
   * 向用户请求相机权限
   */
  async requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[0]);
    return value ? "granted" : "denied";
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[2]);
    return value ? "granted" : "not-determined";
  }

  /**
   * 向用户请求麦克风权限
   */
  async requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[2]);
    return value ? "granted" : "denied";
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[1]);
    return value ? "granted" : "not-determined";
  }

  /**
   * 向用户请求位置权限
   */
  async requestLocationPermission() {
    let value = await new PermissionUtils().grantPermission(PermissionArray[1]);
    return value ? "granted" : "denied";
  }
}