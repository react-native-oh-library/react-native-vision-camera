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

import camera from '@ohos.multimedia.camera';
import { RNComponentContext, RNViewBase } from '@rnoh/react-native-openharmony';
import Logger from '../utils/Logger';
import { CameraCaptureError, CameraRuntimeError } from '../datamodel/type/CameraError';
import PermissionUtils from '../utils/PermissionUtils';
import {
  CameraPermissionRequestResult,
  CameraPermissionStatus,
  PhotoFile,
  Point,
  ScanResult,
  TakePhotoOptions,
} from '../datamodel/interface/CameraConfig';
import { display, window } from '@kit.ArkUI';
import ScanManager from '../manager/ScanManager';
import { cameraState, VideoStabilizationMode } from '../datamodel/enum/CameraEnumBox';
import VisionCameraModuleManager from '../turbomodule/manager/VisionCameraModuleManager';
import { CameraDeviceInfo } from '../datamodel/interface/CameraDeviceInfo';
import Utils from '../utils/Utils';
import { VisionCameraViewSpec } from './props/VisionCameraViewSpec';
import { RecordVideoOptions } from '../datamodel/interface/VideoFile';
import { Permissions } from '@kit.AbilityKit';
import { scanBarcode } from '@kit.ScanKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { ICallBack, MP4Parser } from '@ohos/mp4parser';
import fileio from '@ohos.fileio';
import sensor from '@ohos.sensor';
import { JSON } from '@kit.ArkTS';
import { getGravity, GravityUtils } from '../utils/GravityUtil';
import PreviewViewUtils, { CameraMode } from '../utils/PreviewViewUtils';
import WindowUtil from '../utils/WindowUtil';
import CameraManager from '../manager/CameraManager';
import CameraConstants from '../datamodel/constant/CameraConstants';
import { CommonManager } from '../manager/CommonManager';

const previewViewType: Record<'surface-view' | 'texture-view', 'surface' | 'texture'> = {
  'surface-view': 'surface',
  'texture-view': 'texture'
}
const TAG: string = 'VisionCameraView:'

@Component
export struct VisionCameraView {
  private callbackList: Array<() => void> = []
  public static readonly NAME = VisionCameraViewSpec.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper =
    {} as VisionCameraViewSpec.DescriptorWrapper
  private cleanUpCallbacks: (() => void)[] = []
  private cleanCommandCallback?: () => void;
  @State propertyArr: Array<string> = [];
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  context: Context = getContext(this);
  private localDisplay?: display.Display;
  private topWindow?: window.Window;
  private cameraManager: CameraManager = {} as CameraManager;
  private cameraState: cameraState = cameraState.PHOTO;
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };
  private scanManager: ScanManager = {} as ScanManager;
  private visionCameraModuleManager: VisionCameraModuleManager = new VisionCameraModuleManager();
  @State scaleValue: number = 1;
  private timer = 0
  private enableZoomGesture: boolean | undefined = undefined;
  private prevProps: VisionCameraViewSpec.RawProps | undefined = undefined;
  private currentProps: VisionCameraViewSpec.RawProps = {} as VisionCameraViewSpec.RawProps;
  @State pageFlag: boolean = false;
  @State localDisplayWidth: number = 100;
  @State localDisplayHeight: number = 100;
  @State androidPreviewViewType: 'surface' | 'texture' = 'surface';
  private noViewPhoto: boolean = false;
  /**
   * 当前相机模式是否相同:当模式切换时用于重新初始化相机
   */
  private isCurrentCameraModeSame: boolean = true;
  /**
   * 视频比例
   */
  private videoAspectRatio: number | undefined = CameraConstants.VIDEO_RATIO;
  /**
   * 拍照比例
   */
  private photoAspectRatio: number | undefined = CameraConstants.PHOTO_RATIO;
  private foldStatus: display.FoldStatus = display.FoldStatus.FOLD_STATUS_UNKNOWN;
  /**
   * 是否设置拍照比例
   */
  @State isSetPhotoAspectRatio: boolean = false;
  /**
   * 是否设置录像比例
   */
  @State isSetVideoAspectRatio: boolean = false;

  aboutToAppear() {
    this.localDisplay = display.getDefaultDisplaySync();
    this.foldStatus = display.getFoldStatus();
    try {
      window.getLastWindow(this.context, (err, topWindow) => {
        if (err.code) {
          Logger.error(TAG, `failed to obtain the top window, code: ${err.code}, message: ${err.message}`);
          return;
        }
        WindowUtil.setTopWindow(topWindow);
        this.topWindow = topWindow;
      })
    } catch (err) {
      Logger.error(TAG, `failed to obtain the top window, code: ${err.code}, message: ${err.message}`);
    }
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<VisionCameraViewSpec.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as VisionCameraViewSpec.DescriptorWrapper)
      }
    ))
    this.subscribeToLifecycleEvents();
    const descriptorBase = this.descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    const width = this.descriptorWrapper.width;
    const height = this.descriptorWrapper.height;
    this.localDisplayWidth = vp2px(width) || this.localDisplay?.width;
    this.localDisplayHeight = vp2px(height) || this.localDisplay?.height;
    if (props.videoAspectRatio) {
      this.isSetVideoAspectRatio = true;
      this.videoAspectRatio = props.videoAspectRatio
    }
    if (props.photoAspectRatio) {
      this.isSetPhotoAspectRatio = true;
      this.photoAspectRatio = props.photoAspectRatio
    }
    Logger.debug(TAG, "init videoAspectRatio " + this.videoAspectRatio + " photoAspectRatio " + this.photoAspectRatio +
      " localDisplayWidth " + this.localDisplayWidth + " localDisplayHeight " + this.localDisplayHeight +
      " isSetVideoAspectRatio " + this.isSetVideoAspectRatio + " isSetPhotoAspectRatio " + this.isSetPhotoAspectRatio);
    this.enableZoomGesture = props.enableZoomGesture;
    this.registerCommandCallback();
    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
    }
    if (props.photo) {
      this.cameraState = cameraState.PHOTO;
      if (this.photoAspectRatio) {
        this.localDisplayHeight = this.localDisplayWidth / this.photoAspectRatio
      }
    } else if (props.video) {
      this.cameraState = cameraState.VIDEO
      if (this.videoAspectRatio) {
        this.localDisplayHeight = this.localDisplayWidth / this.videoAspectRatio
      }
    }
    Logger.debug(TAG,
      "init cameraState " + this.cameraState + " recalculate localDisplayWidth " + this.localDisplayWidth +
        " localDisplayHeight " +
      this.localDisplayHeight)
    if (props.androidPreviewViewType && props.androidPreviewViewType !== `${this.androidPreviewViewType}-view`) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    this.defaultGrantPermission(props).then(async res => {
      this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
      await this.initSession(props);
      this.onInitialized();
    });
    GravityUtils.registerGravity()
  }

  /**
   * 初始化Session
   */
  async initSession(props: VisionCameraViewSpec.RawProps) {
    if (this.cameraState === cameraState.SCAN) {
      this.scanManager = new ScanManager(this.ctx);
      this.scanManager.initScan(props.codeScanner?.codeTypes);
      this.scanStart(true);
    } else {
      this.setPreviewSize(this.cameraState === cameraState.PHOTO,
        this.localDisplayWidth / this.localDisplayHeight === 1)
      this.cameraManager = new CameraManager(this.ctx, this.getUIContext());
      await this.cameraManager.initCamera(this.surfaceId, props,
        this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO : camera.SceneMode.NORMAL_VIDEO,
        this.localDisplayWidth, this.localDisplayHeight);
      this.cameraManager.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
        (width, height) => {
          Logger.debug(TAG, "initSession setResizeMode w " + width + " h " + height)
          this.setXComponentSurfaceRect(props.resizeMode, this.cameraState === cameraState.PHOTO,
            this.localDisplayWidth / this.localDisplayHeight === 1, width, height)
        });
    }
  }

  /**
   * 请求权限
   */
  async defaultGrantPermission(props: VisionCameraViewSpec.RawProps) {
    const permissions: Permissions[] = [
      'ohos.permission.CAMERA',
    ]
    if (props.audio) {
      permissions.push('ohos.permission.MICROPHONE')
    }
    if (props.enableLocation) {
      permissions.push('ohos.permission.APPROXIMATELY_LOCATION')
    }
    try {
      const res = await new PermissionUtils().defaultGrantPermission(permissions);
      return res;
    } catch (e) {
      throw (new Error(e))
    }
  }

  /**
   * 订阅生命周期监听事件
   */
  subscribeToLifecycleEvents() {
    this.callbackList.push(this.ctx.rnInstance.subscribeToLifecycleEvents("FOREGROUND", () => {
      const props = this.descriptorWrapper['descriptor'].rawProps;
      if (this.cameraState === cameraState.SCAN) {
        setTimeout(() => {
          this.scanManager = new ScanManager();
          this.scanManager.initScan(props.codeScanner?.codeTypes);
          if (props.isActive) {
            this.scanStart(true);
          }
        }, 200)
      } else {
        try {
          let mediaModel =
            this.cameraState === cameraState.VIDEO ? camera.SceneMode.NORMAL_VIDEO : camera.SceneMode.NORMAL_PHOTO
          this.cameraManager.initCamera(this.surfaceId, props, mediaModel, this.localDisplayWidth,
            this.localDisplayHeight)
          this.cameraManager.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
            (width, height) => {
              Logger.debug(TAG, "setResizeMode callback w " + width + " h " + height)
              this.setXComponentSurfaceRect(props.resizeMode, this.cameraState === cameraState.PHOTO,
                this.localDisplayWidth / this.localDisplayHeight === 1, width, height)
            });
        } catch (err) {
          Logger.error(TAG, `subscribeToLifecycleEvents initCamera error: ${JSON.stringify(err)}`);
        }
      }
    })
    )
    this.callbackList.push(this.ctx.rnInstance.subscribeToLifecycleEvents("BACKGROUND", async () => {
      if (this.cameraState === cameraState.SCAN) {
        clearTimeout(this.timer)
        await this.scanManager.scanStop();
        this.scanManager.scanRelease();
      } else {
        this.cameraManager.cameraRelease()
      }
    }))
  }

  /**
   * 刷新相机模式
   * @param props
   */
  refreshCameraState(props: VisionCameraViewSpec.RawProps) {
    if (props.videoAspectRatio) {
      this.isSetVideoAspectRatio = true;
      this.videoAspectRatio = props.videoAspectRatio
    }
    if (props.photoAspectRatio) {
      this.isSetPhotoAspectRatio = true;
      this.photoAspectRatio = props.photoAspectRatio
    }
    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
    }
    if (props.photo) {
      if (this.cameraState === cameraState.PHOTO) {
        this.isCurrentCameraModeSame = true
      } else {
        this.isCurrentCameraModeSame = false
      }
      if (this.photoAspectRatio) {
        this.localDisplayHeight = this.localDisplayWidth / this.photoAspectRatio
      }
      this.cameraState = cameraState.PHOTO;
    } else if (props.video) {
      if (this.cameraState === cameraState.VIDEO) {
        this.isCurrentCameraModeSame = true
      } else {
        this.isCurrentCameraModeSame = false
      }
      if (this.videoAspectRatio) {
        this.localDisplayHeight = this.localDisplayWidth / this.videoAspectRatio
      }
      this.cameraState = cameraState.VIDEO
    }
    Logger.debug(TAG,
      "refresh videoAspectRatio " + this.videoAspectRatio + " photoAspectRatio " + this.photoAspectRatio +
        " localDisplayWidth " + this.localDisplayWidth + " localDisplayHeight " + this.localDisplayHeight +
        " cameraState " + this.cameraState)
    this.setPreviewSize(this.cameraState === cameraState.PHOTO, this.localDisplayWidth / this.localDisplayHeight === 1);
    if (!this.isCurrentCameraModeSame) {
      this.cameraManager.initCamera(this.surfaceId, props,
        this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO : camera.SceneMode.NORMAL_VIDEO,
        this.localDisplayWidth, this.localDisplayHeight)
    }
  }

  //更新props
  updateProps(props: VisionCameraViewSpec.RawProps) {
    this.refreshCameraState(props);
    this.cameraManager?.setUphasAudio(true);
    this.defaultGrantPermission(props);
    const foldStatus = display.getFoldStatus();
    Logger.debug(TAG, "updateProps foldStatus " + foldStatus)
    // 折叠态发生变化或手动切换相机时，触发逻辑
    if (this.foldStatus !== foldStatus ||
      props.device?.position !== undefined && this.prevProps?.device?.position !== props.device.position) {
      Logger.debug(TAG, "updateProps foldStatus " + foldStatus + " changeCameraPosition")
      this.cameraManager.changeCameraPosition({
        surfaceId: this.surfaceId, props,
        mediaModel: this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO :
        camera.SceneMode.NORMAL_VIDEO
      }, this.localDisplayWidth, this.localDisplayHeight)
    }
    this.foldStatus = foldStatus;
    if (props.isActive !== undefined && this.prevProps?.isActive !== props.isActive) {
      this.cameraManager.activeChange(props.isActive);
      if (props.isActive) {
        this.ctx.rnInstance.emitDeviceEvent('onCameraStarted', {});
      } else {
        this.ctx.rnInstance.emitDeviceEvent('onCameraStopped', {});
      }
    }
    if (props.isMirrored !== undefined) {
      this.cameraManager.setMirror(props.isMirrored, props.device?.position,
        props.videoAspectRatio || props.photoAspectRatio);
    }
    if (props.audio !== undefined && this.prevProps?.audio !== props.audio) {
      this.cameraManager.setAudio(props.audio);
    }
    if (props.preview !== undefined && this.prevProps?.preview !== props.preview) {
      this.cameraManager.previewChange(props.preview);
    }
    if (props.enableZoomGesture !== undefined && this.prevProps?.enableZoomGesture !== props.enableZoomGesture) {
      this.enableZoomGesture = props.enableZoomGesture;
    }
    if (props.exposure !== undefined && this.prevProps?.exposure !== props.exposure) {
      this.cameraManager.setExposure(props.exposure);
    }
    if (props.zoom !== undefined && this.prevProps?.zoom !== props.zoom) {
      this.cameraManager.setSmoothZoom(props.zoom);
    }
    if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
      this.cameraManager.setTorch(props.torch)
    }
    if (props.photoQualityBalance !== undefined && this.prevProps?.photoQualityBalance !== props.photoQualityBalance) {
      this.cameraManager.setPhotoQualitySetting(props.photoQualityBalance);
    }
    if (props.enableLocation !== undefined && this.prevProps?.enableLocation !== props.enableLocation) {
      this.cameraManager.setPhotoLocationSetting(props.enableLocation);
    }
    if (props.androidPreviewViewType && this.prevProps?.androidPreviewViewType !== props.androidPreviewViewType) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    if (props.videoHdr !== undefined && this.prevProps?.videoHdr !== props.videoHdr) {
      if (props.videoHdr !== undefined && props.videoStabilizationMode !== VideoStabilizationMode.AUTO) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoStabilizationMode must be auto'))
        return;
      }
      this.cameraManager.hdrChange(props, this.localDisplayWidth, this.localDisplayHeight);
    }
    if (props.videoStabilizationMode !== undefined &&
      this.prevProps?.videoStabilizationMode !== props.videoStabilizationMode) {
      if (props.videoHdr) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoHdr must be false'))
        return;
      }
      this.cameraManager.setVideoStabilizationMode(false, props.videoStabilizationMode);
    }
    this.cameraManager.setPreviewRotation(props.videoHdr);
    this.localDisplayWidth = this.topWindow?.getWindowProperties().windowRect.width ?? this.localDisplay?.width ?? 0;
    this.localDisplayHeight = this.topWindow?.getWindowProperties().windowRect.height ?? this.localDisplay?.width ?? 0;

    Logger.debug(TAG,
      "updateProps window videoAspectRatio " + this.videoAspectRatio + " photoAspectRatio " + this.photoAspectRatio +
        " localDisplayWidth " + this.localDisplayWidth + " localDisplayHeight " + this.localDisplayHeight +
        " cameraState " + this.cameraState)

    this.cameraManager.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
      (width, height) => {
        Logger.debug(TAG, "updateProps setResizeMode callback w " + width + " h " + height)
        this.setXComponentSurfaceRect(props.resizeMode, this.cameraState === cameraState.PHOTO,
          this.localDisplayWidth / this.localDisplayHeight === 1, width, height)
      });
    this.pageFlag = !this.pageFlag;
  }

  private onDescriptorWrapperChange(descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper) {
    this.descriptorWrapper = descriptorWrapper;
    const descriptorBase = descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    this.currentProps = props;
    if (this.cameraState !== cameraState.SCAN && !Utils.isEmptyObject(this.cameraManager)) {
      this.updateProps(props);
    }
    if (this.cameraState === cameraState.SCAN && !Utils.isEmptyObject(this.scanManager)) {
      const isActiveChange = props.isActive !== undefined && this.prevProps?.isActive !== props.isActive;
      if (isActiveChange) {
        if (props.isActive) {
          this.scanStart(true);
        } else {
          this.scanManager.scanStop();
          this.scanManager.setEndStatus(true);
        }
      }
      if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
        this.scanManager.setTorch(props.torch);
      }
    }
    this.prevProps = props;
  }

  async aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    if (this.cameraState === cameraState.SCAN) {
      clearTimeout(this.timer)
      await this.scanManager.scanStop();
      this.scanManager.scanRelease();
    } else {
      await this.cameraManager.cameraRelease();
    }
    this.cleanCommandCallback?.();
    this.cancellationCallback();
    try {
      sensor.off(sensor.SensorId.GRAVITY);
    } catch (e) {
      Logger.error(TAG, `Unregister gravity sensor error, e: ${JSON.stringify(e)}`);
    }
    GravityUtils.unRegisterGravity();
  }

  checkTakePhoto(args: (string | number | boolean | object)[]) {
    if (this.currentProps.photo) {
      Logger.debug(TAG, `registerCommandCallback: takePhoto,  ${JSON.stringify(args)}`)
      const options = args[0] as TakePhotoOptions;
      if (this.currentProps.preview) {
        this.takePhoto(options);
        this.noViewPhoto = false;
      } else if (!this.noViewPhoto) {
        this.noViewPhoto = true;
        this.takePhoto(options);
      } else {
        this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/unknown',
          `When preview is set to false, the photo can be taken only once.`));
      }
    }
  }

  registerCommandCallback() {
    if (this.ctx) {
      this.cleanCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
        this.tag,
        async (command, args: (string | number | boolean | object)[]) => {

          if (command === 'takePhoto') {
            Logger.debug(TAG, "registerCommandCallback: takePhoto " + this.cameraState);
            if (this.cameraState === cameraState.PHOTO) {
              this.checkTakePhoto(args);
            }
          }
          if (command === 'focus') {
            Logger.debug(TAG, `registerCommandCallback: focus,  ${JSON.stringify(args)}`)
            const point = args[0] as Point;
            this.focus({
              x: vp2px(point.x),
              y: vp2px(point.y),
            });
          }
          if (command === 'getAvailableCameraDevices') {
            Logger.debug(TAG, `registerCommandCallback: getAvailableCameraDevices.`)
            const result = this.getAvailableCameraDevices();
            this.ctx.rnInstance.emitDeviceEvent('getAvailableCameraDevices', result);
          }
          if (command === 'getCameraPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getCameraPermissionStatus.`)
            const result = this.getCameraPermissionStatus();
            this.ctx.rnInstance.emitDeviceEvent('getCameraPermissionStatus', result);
          }
          if (command === 'requestCameraPermission') {
            Logger.debug(TAG, `registerCommandCallback: requestCameraPermission.`)
            const result = await this.requestCameraPermission();
            this.ctx.rnInstance.emitDeviceEvent('requestCameraPermission', result);
          }
          if (command === 'getMicrophonePermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getMicrophonePermissionStatus.`)
            const result = this.getMicrophonePermissionStatus();
            this.ctx.rnInstance.emitDeviceEvent('getMicrophonePermissionStatus', result);
          }
          if (command === 'requestMicrophonePermission') {
            Logger.debug(TAG, `registerCommandCallback: requestMicrophonePermission.`)
            const result = await this.requestMicrophonePermission();
            this.ctx.rnInstance.emitDeviceEvent('requestMicrophonePermission', result);
          }
          if (command === 'requestLocationPermission') {
            Logger.debug(TAG, `registerCommandCallback: requestLocationPermission.`)
            const result = await this.requestLocationPermission();
            this.ctx.rnInstance.emitDeviceEvent('requestLocationPermission', result);
          }
          if (command === 'getLocationPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getLocationPermissionStatus.`)
            const result = this.getLocationPermissionStatus();
            this.ctx.rnInstance.emitDeviceEvent('getLocationPermissionStatus', result);
          }
          if (command === 'startRecording') {
            Logger.debug(TAG, "registerCommandCallback: startRecording " + this.cameraState);
            if (this.cameraState === cameraState.VIDEO) {
              const options = args[0] as RecordVideoOptions;
              Logger.debug(TAG, `registerCommandCallback: startRecording.${JSON.stringify(options)}}`)
              this.startRecording(options);
            }
          }
          if (command === 'stopRecording') {
            Logger.debug(TAG, `registerCommandCallback: stopRecording.`)
            this.stopRecording();
          }
          if (command === 'pauseRecording') {
            Logger.debug(TAG, `registerCommandCallback: pauseRecording.`)
            this.pauseRecording();
          }
          if (command === 'resumeRecording') {
            Logger.debug(TAG, `registerCommandCallback: resumeRecording.`)
            this.resumeRecording();
          }
        });
    }
  }

  onInitialized() {
    this.ctx.rnInstance.emitDeviceEvent('onInitialized', {});
  }

  onError(cameraError: CameraRuntimeError) {
    this.ctx.rnInstance.emitDeviceEvent('onError', cameraError);
  }

  async scanStart(isFirst?: boolean) {
    clearTimeout(this.timer)
    let scanResult: ScanResult | Array<scanBarcode.ScanResult> | undefined = undefined;
    const isActive = this.descriptorWrapper['rawProps'].isActive;
    try {
      this.scanManager.scanStart(this.surfaceId,
        { width: this.localDisplayWidth, height: this.localDisplayHeight }, isFirst, isActive,
        (error: BusinessError, result: Array<scanBarcode.ScanResult>) => {
          if (error) {
            Logger.error(TAG, `start failed, code: ${error.code}, message: ${error.message} `)
            return;
          }
          scanResult = result;
          if (scanResult) {
            const callbackResult = this.scanManager.showScanResult(result);
            this.ctx.rnInstance.emitDeviceEvent('onCodeScanned', callbackResult);
          }
          this.scanManager.rescan(isActive);
        });
    } catch (error) {
      if (error.code === '1000500001') {
        this.onError(new CameraRuntimeError('unknown/unknown', 'codeScanner preview size not support.'))
      }
    }

  }

  /**
   * 拍照
   */
  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    await this.ctx.rnInstance.emitDeviceEvent('onShutter', { type: 'photo' });
    const photoFile = await this.cameraManager.takePhoto(options);
    await this.ctx.rnInstance.emitDeviceEvent('onTaskPhoto', photoFile);
    return photoFile;
  }

  /**
   * focus
   * @param rnPoint
   */
  focus(rnPoint: Point) {
    this.cameraManager.focus(rnPoint);
  }

  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): CameraDeviceInfo[] {
    return this.visionCameraModuleManager.getAvailableCameraDevices();
  }

  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus(): CameraPermissionStatus {
    return this.visionCameraModuleManager.getCameraPermissionStatus();
  }

  /**
   * 向用户请求相机权限
   */
  requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    return this.visionCameraModuleManager.requestCameraPermission();
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    return this.visionCameraModuleManager.getMicrophonePermissionStatus();
  }

  /**
   * 向用户请求麦克风权限
   */
  requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    return this.visionCameraModuleManager.requestMicrophonePermission();
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    return this.visionCameraModuleManager.getLocationPermissionStatus();
  }

  /**
   * 向用户请求位置权限
   */
  requestLocationPermission(): Promise<CameraPermissionRequestResult> {
    return this.visionCameraModuleManager.requestLocationPermission();
  }

  /**
   * 开始录制
   */
  async startRecording(options: RecordVideoOptions): Promise<void> {

    let curDeviceDegree: number = 0;
    try {
      curDeviceDegree = await getGravity();
    } catch (err) {
      Logger.error(TAG, `startRecording Get target sensor error, ${JSON.stringify(err)}`);
    }
    const deviceDegree = curDeviceDegree === 0 ? GravityUtils.availableDeviceDegree : curDeviceDegree;
    Logger.debug(TAG, "startRecording deviceDegree " + deviceDegree)
    await this.cameraManager.startRecording(options, this.currentProps, this.localDisplayWidth, this.localDisplayHeight,
      deviceDegree)
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    await this.cameraManager.stopRecording()
    //当帧率设置30fps时直接回调，不需要转换，系统默认录制出来是30fps
    if (this.cameraManager.getFps() == 30) {
      await this.cameraManager.sendOnRecordingFinishedEvent();
      return;
    }
    //由于系统Api media.AVRecorder->prepare录制后videoFrameRate设置无效，因此使用FFmpeg处理帧率转换
    let inPath = this.cameraManager?.getVideoUri();
    let outPath = this.context.cacheDir + "/temp.mp4";
    let this_ = this;
    let callBack: ICallBack = {
      async callBackResult(code: number) {
        if (code == 0) { //处理转换帧率成功
          await this_.cameraManager.copyFile(outPath, inPath);
          this_.cameraManager.sendOnRecordingFinishedEvent();
        } else {
          this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to stop recording.'));
        }
      }
    }
    MP4Parser.ffmpegCmd("ffmpeg -y -i " + inPath + " -r " + this.cameraManager.getFps() +
      " -c:v libopenh264 -c:a copy " +
      outPath, callBack)
  }

  /**
   * 暂停录制
   */
  pauseRecording() {
    this.cameraManager.pauseRecording()
  }

  /**
   * 恢复录制
   */
  resumeRecording() {
    this.cameraManager.resumeRecording()
  }

  cancellationCallback() {
    this.callbackList.forEach(
      callback => {
        callback?.()
      }
    )
  }

  build() {
    RNViewBase({
      ctx: this.ctx,
      tag: this.tag,
      controlsFocus: false
    }) {
      Stack({ alignContent: Alignment.Bottom }) {
        Column() {
          XComponent({
            id: 'CameraViewComponent',
            type: this.androidPreviewViewType,
            controller: this.mXComponentController
          })
            .onLoad(() => {
              this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
              this.setPreviewSize(true, this.localDisplayWidth / this.localDisplayHeight === 1)
            })
        }
        .onClick((clickEvent) => {
          if (this.cameraState === cameraState.PHOTO) {
            this.cameraManager.focus({ x: vp2px(clickEvent.x), y: vp2px(clickEvent.y) } as Point)
          }
        })
        .width('100%')
        .height('100%')
        .gesture(
          // 在组件上绑定三指触发的捏合手势
          PinchGesture({ fingers: 2 })// 当捏合手势触发时，可以通过回调函数获取缩放比例，从而修改组件的缩放比例
            .onActionUpdate((event: GestureEvent) => {
              try {
               this.scaleValue = this.cameraManager.getPhotoPreviewScale() * event.scale;
              } catch (e) {
                Logger.error(TAG,"Error get scaleValue failed");
              }
            })
            .onActionEnd(() => {
              if (this.enableZoomGesture) {
                this.cameraManager.setSmoothZoom(this.scaleValue);
              }
            })
        )
      }
      .width('100%')
      .height('100%')
    }
  }

  setPreviewSize(isPhoto: boolean, isSmall: boolean) {
    const displaySize: Size =
      WindowUtil.getMaxDisplaySize(PreviewViewUtils.getPreviewRatio(isPhoto ? CameraMode.PHOTO : CameraMode.VIDEO,
        isSmall));
    Logger.debug(TAG, "setPreviewSize w " + displaySize.width + " h " + displaySize.height)
    this.mXComponentController.setXComponentSurfaceRect({
      surfaceWidth: displaySize.width,
      surfaceHeight: displaySize.height
    });
  }

  setXComponentSurfaceRect(resizeMode: string | undefined, isPhoto: boolean, isSmall: boolean, width: number,
    height: number) {
    if (!this.isSetPhotoAspectRatio && !this.isSetVideoAspectRatio) {
      if (resizeMode === 'cover') {
        this.setPreviewSize(isPhoto, isSmall);
      } else {
        let ratio = width / height;
        let widthTemp = width * 0.7;
        let heightTemp = widthTemp / ratio;
        this.mXComponentController.setXComponentSurfaceRect({
          surfaceWidth: widthTemp,
          surfaceHeight: heightTemp
        });
      }
    }
  }
}