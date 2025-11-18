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
import { camera } from "@kit.CameraKit";
import { display } from "@kit.ArkUI";
import Logger from "../utils/Logger";
import { RNOHContext } from "@rnoh/react-native-openharmony/ts";
import fs from '@ohos.file.fs';
import { Context } from "@ohos.arkui.UIContext";
import { BusinessError } from "@kit.BasicServicesKit";
import { CameraPosition, PhysicalCameraDeviceType, VideoStabilizationMode } from "../datamodel/enum/CameraEnumBox";
import { CameraDeviceFormat, CameraDeviceInfo } from "../datamodel/interface/CameraDeviceInfo";


export class CommonManager {
  static TAG: string = 'CommonManager';

  /**
   * 初始化保存图片和视频的目录
   * @param path
   */
  static initTempPath(basicPath: string, path: string) {
    let pathDir = basicPath + '/' + path;
    let res;
    try {
      res = fs.accessSync(pathDir);
    } catch (error) {
      Logger.error(CommonManager.TAG, `constructor error path not exists:${JSON.stringify(error)}`);
    }
    if (!res) {
      Logger.error(CommonManager.TAG, `constructor photo path not exists:${pathDir}`);
      fs.mkdirSync(pathDir, true);
    }
  }

  /**
   * 获取可用设备
   */
  static getAvailableCameraDevices(cameraManager?: camera.CameraManager): Array<camera.CameraDevice> {
    let camerasArray = cameraManager?.getSupportedCameras();
    if (!camerasArray) {
      Logger.error(CommonManager.TAG, 'getAvailableCameraDevices cannot get cameras');
      return;
    }
    return camerasArray;
  }


  static getNewCameraDevice(ctx: RNOHContext, position: 'front' | 'back' | 'external',
    cameraManager?: camera.CameraManager) {
    const currCameraPosition =
      position === 'front' ? camera.CameraPosition.CAMERA_POSITION_FRONT : camera.CameraPosition.CAMERA_POSITION_BACK;
    const currCameraDeviceList = this.getAvailableCameraDevices(cameraManager);
    if (currCameraDeviceList.length === 0) {
      Logger.error(CommonManager.TAG, 'get getAvailableCameraDevices is empty');
      this.onError(ctx, 'get getAvailableCameraDevices is empty');
      return;
    }

    const cameraDevice =
      currCameraDeviceList.find(value => {
        return value.cameraPosition === currCameraPosition;
      }) ?? currCameraDeviceList[0];

    return cameraDevice;
  }

  static setPreviewRotation(previewOutput: camera.PreviewOutput, isHdr: boolean,
    localDisplay?: display.Display): boolean {
    let isRatioReverted = false;
    if (previewOutput === undefined || isHdr) {
      return isRatioReverted;
    }
    try {
      const displayRotation = localDisplay ?? display.getDefaultDisplaySync();
      const previewRotation = previewOutput.getPreviewRotation(
        displayRotation.rotation * camera.ImageRotation.ROTATION_90,
      );
      if (
        previewRotation === camera.ImageRotation.ROTATION_0 ||
          previewRotation === camera.ImageRotation.ROTATION_180
      ) {
        // 需要反转XComponent宽高比例
        isRatioReverted = true;
      } else {
        isRatioReverted = false;
      }
      previewOutput.setPreviewRotation(previewRotation);
      Logger.debug(CommonManager.TAG, 'setPreviewRotation previewRotation ' + previewRotation);
    } catch (e) {
      Logger.error(CommonManager.TAG, `previewOutput.setPreviewRotation catch e:${JSON.stringify(e)}`);
    }
    return isRatioReverted
  }

  static onError(ctx: RNOHContext, message: string) {
    if (ctx) {
      ctx.rnInstance?.emitDeviceEvent('onError', {
        nativeEvent: {
          errorMessage: `${message}`,
        },
      });
    }
  }

  static getCameraManagerFn(ctx: RNOHContext, context: Context): camera.CameraManager | undefined {
    let cameraManager: camera.CameraManager | undefined = undefined;
    try {
      cameraManager = camera.getCameraManager(context);
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(CommonManager.TAG, `getCameraManager failed: ${JSON.stringify(err)}`);
      this.onError(ctx, `getCameraManager failed: ${JSON.stringify(err)}`);
    }
    return cameraManager;
  }

  private static getCameraPhysicalDevices(cameraDevice: camera.CameraDevice) {
    if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_WIDE_ANGLE) {
      // 广角相机
      return [PhysicalCameraDeviceType.WIDE_ANGLE_CAMERA];
    }
    if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_ULTRA_WIDE) {
      // 超广角相机
      return [PhysicalCameraDeviceType.ULTRA_WIDE_ANGLE_CAMERA];
    }
    if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_TELEPHOTO) {
      // 长焦相机
      return [PhysicalCameraDeviceType.TELEPHOTO_CAMERA];
    }
    return [];
  }

  static convertCameraDevice(cameraManager: camera.CameraManager, videoSession: camera.VideoSession,
    camerasArray: Array<camera.CameraDevice>): CameraDeviceInfo[] {
    if (!camerasArray) {
      Logger.error(CommonManager.TAG, 'convertCameraDeviceInfo cameraDevices is null');
      return;
    }
    let cameraDevices = camerasArray;
    let cameraArray: Array<CameraDeviceInfo> = [];
    for (const cameraDevice of cameraDevices) {
      let cameraInfo: CameraDeviceInfo = {} as CameraDeviceInfo;
      cameraInfo.id = cameraDevice.cameraId;
      cameraInfo.physicalDevices = this.getCameraPhysicalDevices(cameraDevice);
      cameraInfo.position = this.getCameraPosition(cameraDevice);
      cameraInfo.hasFlash = cameraManager?.isTorchSupported();
      cameraInfo.hasTorch = cameraManager?.isTorchModeSupported(camera.TorchMode.ON);

      let cameraDeviceFormats: Array<CameraDeviceFormat> = [];
      let capability = cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_VIDEO);
      for (const pProfile of capability.photoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.photoHeight = pProfile.size.height;
        cameraDeviceFormat.photoWidth = pProfile.size.width;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = this.getSupportedVideoStabilizationMode(
        videoSession,
      );
      for (const vProfile of capability.videoProfiles) {
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
    }
    return cameraArray;
  }

  private static getCameraPosition(cameraDevice: camera.CameraDevice) {
    if (cameraDevice.connectionType !== camera.ConnectionType.CAMERA_CONNECTION_BUILT_IN) {
      return CameraPosition.EXTERNAL;
    }
    if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) {
      return CameraPosition.BACK;
    }
    if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
      return CameraPosition.FRONT;
    }
    return CameraPosition.BACK;
  }

  private static getSupportedVideoStabilizationMode(videoSession: camera.VideoSession) {
    let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = [];
    if (!videoSession) {
      Logger.warn(CommonManager.TAG, `getSupportedVideoStabilizationMode params videoSession is empty`);
      return supportedVideoStabilizationMode;
    }
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
}