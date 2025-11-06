/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import VisionCameraModuleManager from "./manager/VisionCameraModuleManager";
import { CameraDeviceInfo } from '../datamodel/interface/CameraDeviceInfo';
import { CameraPermissionRequestResult, CameraPermissionStatus } from '../datamodel/interface/CameraConfig';
import { VisionCameraModuleSpec } from './interface/VisionCameraModuleSpec';
import Logger from '../utils/Logger';

const TAG: string = 'VisionCameraModule:'

export class VisionCameraModule extends TurboModule implements VisionCameraModuleSpec.Spec {
  private cameraManager: VisionCameraModuleManager = new VisionCameraModuleManager();

  addCameraDevicesChangedListener(listener: (newDevices: unknown[]) => void): Object {
    throw new Error('Method not implemented.');
  }

  getAvailableCameraDevices(): CameraDeviceInfo[] {
    let cameraInfos = this.cameraManager.getAvailableCameraDevices();
    Logger.debug(TAG, `initDeviceInfo end CameraDeviceArray size:${cameraInfos?.length}`);
    return cameraInfos;
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