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
import camera from "@ohos.multimedia.camera";
import { RNOHContext } from "@rnoh/react-native-openharmony/ts";
import { VisionCameraViewSpec } from "../view/props/VisionCameraViewSpec";
import Logger from "../utils/Logger";
import PreviewViewUtils from "../utils/PreviewViewUtils";
import { display, UIContext } from "@kit.ArkUI";
import { Context } from "@kit.AbilityKit";
import { CommonManager } from "./CommonManager";
import { BusinessError } from "@kit.BasicServicesKit";
import { photoAccessHelper } from "@kit.MediaLibraryKit";
import fs from '@ohos.file.fs';
import { PhotoFile, TakePhotoOptions } from "../datamodel/interface/CameraConfig";
import sensor from "@ohos.sensor";
import { Orientation } from "../datamodel/enum/CameraEnumBox";
import geoLocationManager from "@ohos.geoLocationManager";
import { CameraCaptureError } from "../datamodel/type/CameraError";

export class PhotoManager {
  private TAG: string = 'PhotoManager';
  private cameraManager?: camera.CameraManager;
  private cameraInput?: camera.CameraInput;
  private capability?: camera.CameraOutputCapability;
  private previewProfile: camera.Profile = {} as camera.Profile;
  private uiContext: UIContext;
  private ctx!: RNOHContext;
  private context: Context;
  private photoProfile?: camera.Profile;
  private previewOutput: camera.PreviewOutput = undefined;
  private photoOutPut?: camera.PhotoOutput;
  private photoSession?: camera.PhotoSession;
  private photoPath: string = '';
  private basicPath: string = '';
  private previewSurfaceId: string;
  private customPhotoPath: string = undefined;
  // 显示/成像预览比例是否反转，横向时为true
  private isRatioReverted: boolean = false;
  /**
   * 旋转角度
   */
  private degree: number = 0;

  private noPath: number = 13900002;

  private isMirrored: boolean = false;

  /**
   * 折叠设备是否被设置
   */
  private isMirrorFoldDevices: boolean = false;

  private photoCaptureSetting: camera.PhotoCaptureSetting = {
    rotation: camera.ImageRotation.ROTATION_0,
    mirror: this.isMirrored,
    quality: camera.QualityLevel.QUALITY_LEVEL_MEDIUM,
  };

  constructor(_ctx: RNOHContext, context_: Context, _uiContext: UIContext,) {
    _ctx && (this.ctx = _ctx);
    this.context = context_;
    this.uiContext = _uiContext;
    this.basicPath = this.context.filesDir;
    try {
      this.cameraManager = camera.getCameraManager(this.context);
    } catch (e) {
      Logger.error(this.TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  getPreviewProfile() {
    return this.previewProfile;
  }

  getRatioReverted() {
    return this.isRatioReverted;
  }

  getCameraManager() {
    return this.cameraManager;
  }

  async initPhotoSession(
    currentDevice: camera.CameraDevice,
    surfaceId: string,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
  ): Promise<camera.PhotoSession> {
    Logger.debug(this.TAG,
      "initPhotoSession xwidth " + xwidth + '  xheight ' + xheight + ' isFoldable ' + display.isFoldable() +
        " surfaceId " + surfaceId + " preview " + props.preview);
    this.previewSurfaceId = surfaceId;
    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_PHOTO);
    if (surfaceId && props.preview) {
      let previewProfilesArray: camera.Profile[] = this.capability.previewProfiles;
      this.previewProfile =
        PreviewViewUtils.getTargetPreviewProfile(PreviewViewUtils.getTargetRatio(true, this.uiContext),
          previewProfilesArray, xwidth, xheight);
      let photoProfilesArray: camera.Profile[] = this.capability.photoProfiles;
      const rPhotoProfilesArray = photoProfilesArray.slice().reverse();
      if (this.previewProfile !== undefined) {
        this.photoProfile = rPhotoProfilesArray.find((profile: camera.Profile) => {
          return (
            profile.size.height * this.previewProfile!.size.width ===
              this.previewProfile!.size.height * profile.size.width
          );
        });
      }
      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
      this.registerPreviewFrameListeners();
    }
    Logger.debug(this.TAG,
      "initPhotoSession previewProfile " + this.previewProfile + " width " + this.previewProfile.size.width +
        "  height " + this.previewProfile.size.height + " photoProfile " + this.photoProfile + " width " +
      this.photoProfile?.size.width + " height " + this.photoProfile?.size.height)
    this.photoOutPut = this.cameraManager.createPhotoOutput(this.photoProfile);
    this.photoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_PHOTO);
    this.photoSession.beginConfig();
    this.photoSession.addInput(this.cameraInput);
    if (this.previewOutput && props.preview) {
      this.photoSession.addOutput(this.previewOutput);
    }
    this.photoSession.addOutput(this.photoOutPut);
    try {
      await this.photoSession.commitConfig();
    } catch (error) {
      Logger.error(this.TAG, `initPhotoSession commitConfig error: ${JSON.stringify(error)}`);
    }
    this.isRatioReverted = this.setPreviewRotation(props.videoHdr)

    try {
      sensor.on(sensor.SensorId.GRAVITY, async (data: sensor.GravityResponse) => {
        this.degree = this.calculateDeviceDegree(data.x, data.y, data.z)
      });
    } catch (error) {
      Logger.error(this.TAG, `Failed to capture error: ${error.message},code:${error.code}`);
    }
    return new Promise((resolve) => {
      resolve(this.photoSession)
    });
  }

  setPhotoOutputCb(): void {
    this.photoOutPut?.on('photoAssetAvailable', (err: BusinessError, photoAsset: photoAccessHelper.PhotoAsset) => {
      if (err || photoAsset === undefined) {
        Logger.error(this.TAG, `setPhotoOutputCb photoAssetAvailable failed, ${JSON.stringify(err)}`);
        return;
      }
      Logger.debug(this.TAG, "photoAssetAvailable")
      this.savePicture(photoAsset);
    });
  }

  // 保存图片
  async savePicture(photoAccess: photoAccessHelper.PhotoAsset): Promise<string> {
    let photoFile: string;
    let PhotoPath = this.customPhotoPath;
    this.customPhotoPath = undefined;
    if (PhotoPath) {
      photoFile = `${PhotoPath}/${Date.now().toString()}.jpeg`;
    } else {
      photoFile = `${this.basicPath}/photo/${Date.now().toString()}.jpeg`;
    }
    // photoFile = await this.getMediaLibraryUri(photoFile, `${Date.now()}`, 'jpeg', photoAccessHelper.PhotoType.IMAGE)
    // 根据相机拍照图片路径，获取文件buffer
    let file = fs.openSync(photoAccess.uri, fs.OpenMode.READ_ONLY);
    let stat = fs.statSync(file.fd);
    let buffer = new ArrayBuffer(stat.size);
    fs.readSync(file.fd, buffer);
    fs.fsyncSync(file.fd);
    fs.closeSync(file);
    let _file;
    try {
      _file = fs.openSync(photoFile, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
      await fs.write(_file.fd, buffer);
    } catch (error) {
      Logger.error(this.TAG, `savePicture statSync failed,code:${error}.`);
    }
    fs.closeSync(_file);
    this.photoPath = photoFile;
    Logger.debug(this.TAG, "savePicture success " + this.photoPath)
    return new Promise((resolve) => {
      resolve(photoFile)
    });
  }

  /**
   * 拍照
   */
  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    if (options && this.photoSession.hasFlash()) {
      if (options.flash === 'on' && this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_OPEN)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_OPEN);
      } else if (
        options.flash === 'off' &&
        this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)
      ) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      } else if (
        options.flash === 'auto' &&
        this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_AUTO)
      ) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_AUTO);
      }
    }
    if (options?.path !== undefined) {
      this.customPhotoPath = await this.getDirectoryAsync(options.path);
      if (this.customPhotoPath == undefined) {
        return;
      }
    }
    this.photoCaptureSetting.rotation = this.getPhotoRotation(this.photoOutPut!, this.degree);
    try {
      if (this.photoOutPut.isMirrorSupported() && !this.isMirrorFoldDevices) {
        Logger.debug(this.TAG, "isMirrored: " + this.isMirrored);
        this.photoCaptureSetting.mirror = this.isMirrored;
      }
      await this.photoOutPut.capture(this.photoCaptureSetting);
    } catch (e) {
      Logger.error(this.TAG, "Error capture: " + JSON.stringify(e))
    }
    await this.waitForPathResult();
    let photoFile: PhotoFile = {} as PhotoFile;
    photoFile.width = this.photoProfile?.size.height;
    photoFile.height = this.photoProfile?.size.width;
    photoFile.path = this.photoPath;
    photoFile.isRawPhoto = false;
    photoFile.orientation = this.getOrientation(this.photoCaptureSetting.rotation);
    Logger.debug(this.TAG, "capture success " + this.photoPath)
    this.photoPath = '';
    return photoFile;
  }

  calculateDeviceDegree(x: number, y: number, z: number): number {
    let deviceDegree: number = 0;
    // Determine if the device is approaching a vertical position (perpendicular to the ground)
    if ((x * x + y * y) * 3 < z * z) {
      return deviceDegree;
    } else {
      try {
        // Calculate the inverse tangent value
        let sd = Math.atan2(y, -x)
        // Convert radian values to angle values;
        let sc = Math.round(Number(sd) / Math.PI * 180);
        // Adjust angle to be relative to vertical orientation
        deviceDegree = 90 - Number(sc);
        // Normalize angle to 0-360 degrees range
        deviceDegree = deviceDegree >= 0 ? deviceDegree % 360 : deviceDegree % 360 + 360;
      } catch (exception) {
        Logger.error(this.TAG,
          `calculateDeviceDegree failed, code is ${exception.code}, message is ${exception.message}`);
      }
    }
    return deviceDegree;
  }

  getPhotoRotation(photoOutput: camera.PhotoOutput, deviceDegree: number): camera.ImageRotation {
    let photoRotation: camera.ImageRotation = camera.ImageRotation.ROTATION_0;
    try {
      photoRotation = photoOutput.getPhotoRotation(deviceDegree);
    } catch (error) {
      Logger.error(this.TAG, `The photoOutput.getPhotoRotation call failed. error code: ${error.code}`);
    }
    return photoRotation;
  }

  /**
   * 等待path的值被设置
   * @returns
   */
  private waitForPathResult(): Promise<void> {
    return new Promise(resolve => {
      const intervalId = setInterval(() => {
        Logger.debug(this.TAG, "waitForPathResult " + this.photoPath)
        if (this.photoPath !== '') {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    });
  }

  getOrientation(orientation: camera.ImageRotation) {
    switch (orientation) {
      case camera.ImageRotation.ROTATION_0:
        return Orientation.PORTRAIT;
      case camera.ImageRotation.ROTATION_90:
        return Orientation.LANDSCAPE_LEFT;
      case camera.ImageRotation.ROTATION_180:
        return Orientation.PORTRAIT_UPSIDE_DOWN;
      case camera.ImageRotation.ROTATION_270:
        return Orientation.LANDSCAPE_RIGHT;
      default:
        Logger.error(this.TAG, `getOrientation param:${orientation}`);
        break;
    }
  }

  /**
   * 获取当前位置
   */
  async getLocation(): Promise<camera.Location> {
    let requestInfo: geoLocationManager.CurrentLocationRequest = {
      priority: geoLocationManager.LocationRequestPriority.FIRST_FIX,
      scenario: geoLocationManager.LocationRequestScenario.UNSET,
      maxAccuracy: 0,
    };
    try {
      const result = await geoLocationManager.getCurrentLocation(requestInfo);
      return result;
    } catch (error) {
      if (error.code === '3301100') {
        Logger.error(this.TAG, `the switch for the location function is not turned on, error code: ${error?.code}.`);
        this.ctx &&
        this.ctx.rnInstance.emitDeviceEvent(
          'onError',
          new CameraCaptureError(
            'capture/location-not-turned-on',
            'the switch for the location function is not turned on.',
          ),
        );
      }
      Logger.error(this.TAG, `getCurrentLocation error, error code is ${error?.code}.`);
      delete this.photoCaptureSetting.location;
    }
  }

  /**
   * 设置镜像
   * @param isMirror
   * @param position
   */
  setMirror(isMirror, position, isMultipleDevices) {
    Logger.debug(this.TAG, "isMirror: " + isMirror);
    this.isMirrored = isMirror;
    this.isMirrorFoldDevices = isMultipleDevices;
    if ('front' === position) {
      this.photoCaptureSetting.mirror = !isMirror;
    } else {
      this.photoCaptureSetting.mirror = isMirror;
    }
  }

  /**
   * 设置拍摄位置
   * @param enableLocation
   */
  async setPhotoLocationSetting(enableLocation: boolean): Promise<void> {
    if (enableLocation) {
      this.photoCaptureSetting.location = await this.getLocation();
    } else {
      delete this.photoCaptureSetting.location;
    }
  }

  async previewChange(preview: boolean): Promise<void> {
    if (preview) {
      if (this.previewOutput) {
        this.photoSession?.beginConfig();
        this.photoSession?.addOutput(this.previewOutput);
        await this.photoSession?.commitConfig();
        await this.photoSession?.start();
      } else {
        this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
        this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.previewSurfaceId);
        this.photoSession?.beginConfig();
        this.photoSession?.addOutput(this.previewOutput);
        await this.photoSession?.commitConfig();
        await this.photoSession?.start();
      }
    } else {
      if (this.previewOutput) {
        this.photoSession?.beginConfig();
        this.photoSession?.removeOutput(this.previewOutput);
        await this.photoSession?.commitConfig();
        await this.photoSession?.start();
      }
    }
  }


  /**
   * 设置photoQuality
   * @param quality
   */
  setPhotoQualitySetting(quality: 'speed' | 'balanced' | 'quality' = 'speed'): void {
    this.photoCaptureSetting.quality = this.getQualityLevel(quality);
  }

  /**
   * photoQuality转换
   * @param level
   * @returns
   */
  getQualityLevel(level) {
    Logger.debug(this.TAG, "getQualityLevel: " + level)
    switch (level) {
      case 'speed':
        return camera.QualityLevel.QUALITY_LEVEL_LOW;
      case 'balanced':
        return camera.QualityLevel.QUALITY_LEVEL_MEDIUM;
      case 'quality':
        return camera.QualityLevel.QUALITY_LEVEL_HIGH;
      default:
        return camera.QualityLevel.QUALITY_LEVEL_MEDIUM;
    }
  }


  async cameraRelease() {
    try {
      this.unregisterPreviewFrameListeners();
      if (this.cameraInput) {
        await this.cameraInput.close();
        this.cameraInput = undefined;
      }
      if (this.previewOutput) {
        await this.previewOutput.release();
        this.previewOutput = undefined;
      }
      if (this.photoOutPut) {
        await this.photoOutPut.release();
        this.photoOutPut = undefined;
      }
      if (this.photoSession) {
        await this.photoSession.release();
        this.photoSession = undefined;
      }
      sensor.off(sensor.SensorId.GRAVITY);
    } catch (error) {
      Logger.error(this.TAG, `releaseCamera end error: ${JSON.stringify(error)}`);
      CommonManager.onError(this.ctx, `releaseCamera end error: ${JSON.stringify(error)}`);
    }
    Logger.debug(this.TAG, `camera released!`);
  }


  setPreviewRotation(videoHdr: boolean): boolean {
    return CommonManager.setPreviewRotation(this.previewOutput, videoHdr)
  }

  // 注册预览帧的监听
  registerPreviewFrameListeners() {
    console.trace()
    if (this.previewOutput) {
      this.previewOutput.on('frameStart', (err: BusinessError) => {
        if (err !== undefined && err.code !== 0) {
          console.error(`registerPreviewFrameListeners Callback Error, errorCode: ${err.code}`);
          return;
        }
        this.ctx && this.ctx.rnInstance.emitDeviceEvent('onPreviewStarted', {});
      });
    } else {
      Logger.error(this.TAG, 'previewOutput is not initialized, cannot register frame listeners');
    }
  }

  // 取消预览帧的监听
  unregisterPreviewFrameListeners() {
    if (this.previewOutput) {
      this.previewOutput.off('frameStart');
    } else {
      Logger.error(this.TAG, 'previewOutput is not initialized, cannot unregister frame listeners');
    }
  }

  async getDirectoryAsync(path: string | null): Promise<string> {
    if (path === "") {
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
        'The given path (null) is invalid, or not writable!'));
      return;
    }
    let formattedPath = path;
    formattedPath = formattedPath.replace(/\/+/g, '/');
    if (formattedPath !== '/') {
      formattedPath = formattedPath.replace(/\/$/, '');
    }
    if (!formattedPath.startsWith('/data/storage/el2')) {
      this.ctx &&
      this.ctx?.rnInstance.emitDeviceEvent('onError', new CameraCaptureError(
        'capture/invalid-path',
        'The given path is invalid, or not writable!'
      ));
      return;
    }

    try {
      await fs.stat(formattedPath);
    } catch (statError) {
      if (statError.code === this.noPath) {
        try {
          await fs.mkdir(formattedPath);
        } catch (mkdirError) {
          this.ctx &&
          this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
            `The given path (` + formattedPath + `) is invalid, or not writable!`));
          return;
        }
      } else {
        this.ctx &&
        this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
          `The given path (` + formattedPath + `) is invalid, or not writable!`));
        return;
      }
    }
    return formattedPath;
  }
}