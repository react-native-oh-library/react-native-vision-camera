import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import CameraManager from "./service/CameraManager";
import { CameraDeviceInfo } from './core/CameraDeviceInfo';
import { CameraPermissionRequestResult, CameraPermissionStatus } from './core/CameraConfig';

export class VisionCameraModule extends TurboModule implements TM.VisionCameraModule.Spec {
  private cameraManager: CameraManager = new CameraManager();

  addCameraDevicesChangedListener(listener: (newDevices: unknown[]) => void): Object {
    throw new Error('Method not implemented.');
  }

  getAvailableCameraDevices(): CameraDeviceInfo[] {
    let devices = this.cameraManager.getAvailableCameraDevices();
    return this.cameraManager.convertCameraDeviceInfo(devices);
  }

  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getCameraPermissionStatus();
  }

  /**
   * 向用户请求相机权限
   */
  requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestCameraPermission();
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getMicrophonePermissionStatus();
  }

  /**
   * 向用户请求麦克风权限
   */
  requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestMicrophonePermission();
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getLocationPermissionStatus();
  }

  /**
   * 向用户请求位置权限
   */
  requestLocationPermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestLocationPermission();
  }
}