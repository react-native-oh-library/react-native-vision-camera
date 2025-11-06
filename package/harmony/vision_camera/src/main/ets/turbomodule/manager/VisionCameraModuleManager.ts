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

import Logger from '../../utils/Logger';

import { CameraPermissionRequestResult, CameraPermissionStatus, PermissionArray } from '../../datamodel/interface/CameraConfig';
import PermissionUtils from '../../utils/PermissionUtils';
import { CameraDeviceInfo } from '../../datamodel/interface/CameraDeviceInfo';
import CameraManager from '../../manager/CameraManager';


const TAG: string = 'CameraDevice:'

export default class VisionCameraModuleManager {
  getAvailableCameraDevices(): CameraDeviceInfo[] {
    let cameraManager: CameraManager = new CameraManager();
    let cameraInfos = cameraManager.initDeviceInfo();
    Logger.debug(TAG, `initDeviceInfo end CameraDeviceArray size:${cameraInfos?.length}`);
    Logger.debug(TAG, `initDeviceInfo end CameraDeviceArray cameraInfos:${JSON.stringify(cameraInfos)}`);
    return cameraInfos;
  }

  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus() {
    let value = new PermissionUtils().checkPermission(PermissionArray[0]);
    let cameraStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.debug(TAG, `getCameraPermissionStatus:${cameraStatus}`);
    return cameraStatus;
  }

  /**
   * 向用户请求相机权限
   */
  async requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[0]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.debug(TAG, `requestCameraPermission:${requestPermission}`);
    return requestPermission;
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[1]);
    let microStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.debug(TAG, `getMicrophonePermissionStatus:${microStatus}`);
    return microStatus;
  }

  /**
   * 向用户请求麦克风权限
   */
  async requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[1]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.debug(TAG, `requestMicrophonePermission:${requestPermission}`);
    return requestPermission;
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[2]);
    let locationStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.debug(TAG, `getLocationPermissionStatus:${locationStatus}`);
    return locationStatus;
  }

  /**
   * 向用户请求位置权限
   */
  async requestLocationPermission() {
    let value = await new PermissionUtils().grantPermission(PermissionArray[2]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.debug(TAG, `requestLocationPermission:${requestPermission}`);
    return requestPermission;
  }
}