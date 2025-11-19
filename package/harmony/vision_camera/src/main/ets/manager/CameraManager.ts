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
import Logger from '../utils/Logger';
import { PhotoFile, Point, TakePhotoOptions } from '../datamodel/interface/CameraConfig';
import { Context } from '@kit.AbilityKit';
import { BusinessError } from '@ohos.base';
import { CameraDeviceInfo } from '../datamodel/interface/CameraDeviceInfo';
import { display, UIContext } from '@kit.ArkUI';
import { RecordVideoOptions } from '../datamodel/interface/VideoFile';
import { RNOHContext } from '@rnoh/react-native-openharmony/ts';
import type { VisionCameraViewSpec } from '../view/props/VisionCameraViewSpec';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { deviceInfo } from '@kit.BasicServicesKit';
import { CommonManager } from './CommonManager';
import { VideoManager } from './VideoManager';
import { PhotoManager } from './PhotoManager';

declare function getContext(component?: Object | undefined): Context;

const TAG: string = 'RNCameraManager';

type ZoomRangeType = [number, number];

export default class CameraManager {
  context: Context = undefined;
  phAccessHelper: photoAccessHelper.PhotoAccessHelper = undefined;
  private cameraManager?: camera.CameraManager;
  private mediaModel: camera.SceneMode = camera.SceneMode.NORMAL_PHOTO;
  private localDisplay?: display.Display;
  rect = {
    surfaceWidth: 1216,
    surfaceHeight: 2224,
  };
  private basicPath: string = '';
  private outPathArray: string[] = ['photo', 'video'];
  private currCameraDevice?: camera.CameraDevice;
  private newCameraDevice?: camera.CameraDevice;
  public ZoomRange: ZoomRangeType | null = null;
  // preview原点相对于设备原点x偏移量
  private offsetX: number = 0;
  // preview原点相对于设备原点y偏移量
  private offsetY: number = 0;
  // 是否前置摄像头
  private isFront: boolean = false;
  // 显示/成像预览比例是否反转，横向时为true
  private isRatioReverted: boolean = false;
  private foldStatus: display.FoldStatus;
  private uiContext: UIContext;
  private ctx!: RNOHContext;
  private videoManager: VideoManager;
  private photoManager: PhotoManager;
  private photoSession?: camera.PhotoSession;
  private videoSession?: camera.VideoSession;
  private photoPreviewScale: number = 1;

  constructor(_ctx?: RNOHContext, _uiContext?: UIContext) {
    _ctx && (this.ctx = _ctx);
    this.uiContext = _uiContext;
    this.context = getContext(this);
    this.phAccessHelper = photoAccessHelper.getPhotoAccessHelper(this.context);
    this.basicPath = this.context.filesDir;
    for (let outPath of this.outPathArray) {
      CommonManager.initTempPath(this.basicPath, outPath);
    }
    this.localDisplay = display.getDefaultDisplaySync();
    this.foldStatus = display.getFoldStatus();
    if (this.localDisplay) {
      let previewSize = {
        surfaceWidth: this.localDisplay.width,
        surfaceHeight: this.localDisplay.height,
      };
      this.rect = previewSize;
    }
    try {
      this.cameraManager = camera.getCameraManager(this.context);
    } catch (e) {
      Logger.error(TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
    this.videoManager = new VideoManager(this.ctx, this.context, this.uiContext)
    this.photoManager = new PhotoManager(this.ctx, this.context, this.uiContext)
  }

  /**
   * 切换摄像头
   * @param config
   * @param xwidth
   * @param xheight
   * @returns
   */
  async changeCameraPosition(
    config: {
      surfaceId: string;
      props: VisionCameraViewSpec.RawProps;
      mediaModel: camera.SceneMode;
    },
    xwidth: number,
    xheight: number,
  ): Promise<void> {
    const { surfaceId, props, mediaModel } = config;
    this.isFront = props.device?.position === 'front';
    Logger.debug(TAG, `changeCameraPosition isFront `+ this.isFront);
    if (!this.currCameraDevice) {
       return;
    }
    const newFoldStatus = display.getFoldStatus();
    if (
      deviceInfo.productSeries === 'GRL' &&
        (newFoldStatus === display.FoldStatus.FOLD_STATUS_EXPANDED ||
          newFoldStatus === display.FoldStatus.FOLD_STATUS_HALF_FOLDED)
    ) {
      // 三折M态，固定使用后置
      this.newCameraDevice = CommonManager.getNewCameraDevice(this.ctx, 'back', this.cameraManager);
    } else if (this.foldStatus !== newFoldStatus) {
      // 其他折叠状态，且折叠状态发生变更，优先保持原位置
      this.newCameraDevice = CommonManager.getNewCameraDevice(this.ctx,
        this.currCameraDevice?.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK ? 'back' : 'front',
        this.cameraManager
      );
    } else {
      // 手动切换状态
      this.newCameraDevice = CommonManager.getNewCameraDevice(this.ctx, props.device?.position, this.cameraManager);
      if (this.currCameraDevice === this.newCameraDevice) {
        return;
      }
    }
    this.foldStatus = display.getFoldStatus();

    Logger.debug(TAG, `changeCameraPosition: ${JSON.stringify(this.newCameraDevice?.cameraPosition)}`);
    this.cameraManager= CommonManager.getCameraManagerFn(this.ctx, this.context);
    await this.initCamera(surfaceId, props, mediaModel, xwidth, xheight);
  }

  /**
   * 初始化相机
   * @param surfaceId
   */
  async initCamera(
    surfaceId: string,
    props: VisionCameraViewSpec.RawProps,
    mediaModel: camera.SceneMode,
    xwidth: number,
    xheight: number,
  ): Promise<void> {
    this.isFront = props.device?.position === 'front';
    Logger.debug(TAG, "initCamera xwidth " + xwidth + " xheight " + xheight + " isFront " + this.isFront)
    this.mediaModel = mediaModel;
    if (mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.cameraManager = this.photoManager.getCameraManager();
    }
    if (mediaModel === camera.SceneMode.NORMAL_VIDEO) {
      this.cameraManager = this.videoManager.getCameraManager();
    }
    if (!this.cameraManager) {
      Logger.error(TAG, 'initCamera check cameraManager is empty');
      return;
    }
    this.currCameraDevice = this.newCameraDevice ?? CommonManager.getNewCameraDevice(this.ctx, props.device?.position, this.cameraManager);
    await this.cameraRelease();
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.photoSession =
        await this.photoManager.initPhotoSession(this.currCameraDevice, surfaceId, props, xwidth, xheight);
      await this.photoSession.start();
      this.photoManager.setPhotoOutputCb();
    } else {
      this.videoSession =
        await this.videoManager.initVideoSession(this.currCameraDevice, surfaceId, props, xwidth, xheight)
    }
    if (!props.isActive) {
      this.activeChange(props.isActive);
    }
    this.focus(undefined);
    this.initProps(props);
  }

  /**
   * 初始化props参数
   */
  async initProps(props) {
    if (props.isMirrored !== undefined) {
      this.setMirror(props.isMirrored, props.device?.position, props.videoAspectRatio || props.photoAspectRatio);
    }
    if (props.exposure !== undefined) {
      this.setExposure(props.exposure);
    }
    if (props.zoom !== undefined) {
      this.setSmoothZoom(props.zoom);
    }
    if (props.audio !== undefined) {
      this.videoManager?.setAudio(props.audio)
    }
    if (props.torch !== undefined) {
      this.setTorch(props.torch);
    }
    if (props.photoQualityBalance !== 'balanced') {
      this.setPhotoQualitySetting(props.photoQualityBalance);
    }
    if (props.enableLocation) {
      this.setPhotoLocationSetting(props.enableLocation);
    }
  }

  /**
   * 设置镜像
   * @param isMirror
   * @param position
   */
  setMirror(isMirror, position, isMultipleDevices) {
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.photoManager?.setMirror(isMirror, position, isMultipleDevices);
    }
  }

  /**
   * hdr切换
   * @param props
   * @param xwidth
   * @param xheight
   */
  async hdrChange(props: VisionCameraViewSpec.RawProps, xwidth: number, xheight: number) {
    this.videoManager?.hdrChange(props, xwidth, xheight);
  }

  /**
   * 预览模式切换
   * @param preview
   * @returns
   */
  async previewChange(preview: boolean): Promise<void> {
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.photoManager?.previewChange(preview);
    }
    if (this.mediaModel === camera.SceneMode.NORMAL_VIDEO) {
      this.videoManager?.previewChange(preview);
    }
  }


  /**
   * 设置预览样式 cover/contain
   * @param _resizeMode
   * @param displayWidth
   * @param displayHeight
   * @param callback
   */
  setResizeMode(
    _resizeMode: string,
    displayWidth: number = 1216,
    displayHeight: number = 2688,
    callback: (width: number, height: number) => void,
  ) {

    let previewSize = this.photoManager?.getPreviewProfile()?.size;
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.isRatioReverted = this.photoManager?.getRatioReverted();
      previewSize = this.photoManager?.getPreviewProfile().size
    }
    if (this.mediaModel === camera.SceneMode.NORMAL_VIDEO) {
      this.isRatioReverted = this.videoManager?.getRatioReverted();
      previewSize = this.videoManager?.getPreviewProfile()?.size
    }
    if (!previewSize) {
      return;
    }
    // 相机成像角度与显示方向成0°/180°时，显示区域的比例需要反转，否则会导致拉伸，因为预览流返回的宽始终大于高。
    let screenAspect = this.isRatioReverted ? displayHeight / displayWidth : displayWidth / displayHeight;
    let previewAspect = previewSize.height / previewSize.width;
    let componentWidth: number = 0;
    let componentHeight: number = 0;
    let resizeMode = _resizeMode ?? 'cover';
    if (resizeMode === 'cover') {
      componentWidth = displayWidth;
      componentHeight = displayHeight;
    } else if (resizeMode === 'contain') {
      if (screenAspect >= previewAspect) {
        componentWidth = this.isRatioReverted ? displayWidth : displayHeight * previewAspect;
        componentHeight = this.isRatioReverted ? displayWidth * previewAspect : displayHeight;
      } else {
        componentWidth = this.isRatioReverted ? displayHeight / previewAspect : displayWidth;
        componentHeight = this.isRatioReverted ? displayHeight : displayWidth / previewAspect;
      }
    }
    // 计算设备左上角与预览流左上角偏移量
    this.offsetX = (componentWidth - displayWidth) / 2;
    this.offsetY = (componentHeight - displayHeight) / 2;
    this.rect = {
      surfaceWidth: componentWidth,
      surfaceHeight: componentHeight,
    };
    Logger.debug(TAG, `setResizeMode width: ${componentWidth}, height: ${componentHeight}`);
    callback(componentWidth, componentHeight);
  }

  //开始预览 isActive:true
  async activeChange(isActive: boolean): Promise<void> {

    let targetSession;
    if(this.photoSession && this.mediaModel == camera.SceneMode.NORMAL_PHOTO) {
      targetSession = this.photoSession;
    }

    if(this.videoSession && this.mediaModel == camera.SceneMode.NORMAL_VIDEO) {
      targetSession = this.videoSession;
    }

    try {
      if (isActive) {
        await targetSession.start();
      } else {
        await targetSession.stop();
      }
    } catch (error) {
      Logger.error(TAG, `The activeChange targetSession start call failed. error code: ${error.code}`);
      CommonManager.onError(this.ctx, `The activeChange targetSession start call failed. error code: ${error.code}`);
    }
  }

  //设置曝光补偿
  setExposure(exposure: number): void {
    try {
      //[-4,4]
      const [min, max]: Array<number> = this.photoSession?.getExposureBiasRange();
      if (exposure >= min && exposure <= max) {
        let value = this.photoSession?.getExposureValue();
        this.photoSession?.setExposureBias(exposure);
      } else {
      }
    } catch (error) {
      Logger.error(TAG, `The setExposureBias call failed. error code: ${error.code}`);
    }
  }

  //设置缩放[0.49,50]
  setSmoothZoom(zoom: number): void {
    try {
      const [min, max]: Array<number> = this.getZoomRange(true);
      if (zoom <= min) {
        zoom = min;
      } else if (zoom >= max) {
        zoom = max;
      }
      if (this.photoSession && this.mediaModel == camera.SceneMode.NORMAL_PHOTO) {
        this.photoSession?.setSmoothZoom(zoom, camera.SmoothZoomMode.NORMAL);
      } else if (this.videoSession && this.mediaModel == camera.SceneMode.NORMAL_VIDEO) {
        this.videoSession?.setSmoothZoom(zoom, camera.SmoothZoomMode.NORMAL);
      }
      this.photoPreviewScale = zoom;
    } catch (error) {
      Logger.error(TAG, `The setSmoothZoom call failed. error code: ${error.code}.`);
    }
  }

  //获取缩放阈值
  getZoomRange(forceUpdate: boolean = false): ZoomRangeType {
    try {
      if (this.ZoomRange === null || forceUpdate) {
        let [min, max]: Array<number> = [];
        if (this.photoSession && this.mediaModel == camera.SceneMode.NORMAL_PHOTO) {
          [min, max] = this.photoSession?.getZoomRatioRange();
        } else if (this.videoSession && this.mediaModel == camera.SceneMode.NORMAL_VIDEO) {
          [min, max] = this.videoSession?.getZoomRatioRange();
        }
        this.ZoomRange = [min, max];
      }
      return this.ZoomRange;
    } catch (error) {
      Logger.error(TAG, `The getZoomRatioRange call failed. error code: ${error.code}.`);
    }
  }

  //设置手电筒模式
  setTorch(mode: string): void {
    let cameraSession;
    if (this.photoSession && this.mediaModel == camera.SceneMode.NORMAL_PHOTO) {
      cameraSession = this.photoSession;
    } else if (this.videoSession && this.mediaModel == camera.SceneMode.NORMAL_VIDEO) {
      cameraSession = this.videoSession;
    } else {
      Logger.error(TAG, `The setTorchMode call failed. error cameraManager is undefined`);
      return;
    }
    if (cameraSession.hasFlash()) {
      if (mode === 'on' && cameraSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN)) {
        cameraSession?.setFlashMode(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN);
      } else if (mode === 'off' && cameraSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
        cameraSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      }
    }
  }


  /**
   * 相机输出能力
   */
  getSupportedOutputCapability(
    cameraDevice: camera.CameraDevice,
    cameraManager: camera.CameraManager,
  ): camera.CameraOutputCapability {
    let cameraOutputCapability: camera.CameraOutputCapability = cameraManager.getSupportedOutputCapability(
      cameraDevice,
      this.mediaModel,
    );
    return cameraOutputCapability;
  }

  /**
   * 资源释放
   */
  async cameraRelease() {
    await this.photoManager?.cameraRelease();
    await this.videoManager?.cameraRelease();
    Logger.debug(TAG, `camera released!`);
  }

  // 通过弹窗获取需要保存到媒体库的位于应用沙箱的图片/视频uri
  async getMediaLibraryUri(
    srcFileUri: string,
    title: string,
    fileNameExtension: string,
    photoType: photoAccessHelper.PhotoType,
  ): Promise<string> {
    try {
      let srcFileUris: Array<string> = [
      // 应用沙箱的图片/视频uri
        srcFileUri,
      ];
      let photoCreationConfigs: Array<photoAccessHelper.PhotoCreationConfig> = [
        {
          title: title,
          fileNameExtension: fileNameExtension,
          photoType: photoType,
          subtype: photoAccessHelper.PhotoSubtype.DEFAULT,
        },
      ];
      let desFileUris: Array<string> = await this.phAccessHelper.showAssetsCreationDialog(
        srcFileUris,
        photoCreationConfigs,
      );
      return desFileUris[0];
    } catch (err) {
      Logger.error(TAG, `showAssetsCreationDialog failed, errCode is:${err.code},errMsg is:${err.message}`);
    }
  }

  /**
   * 参数配置
   */
  focus(rnPoint: Point) {
    let status: boolean = false;
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    try {
      status = targetSession?.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO);
    } catch (error) {
      Logger.error(TAG, `The focus isFocusModeSupported call failed. error code: ${JSON.stringify(error)}`);
      return;
    }
    if (status) {
      // 指定焦点时设置焦点
      if (rnPoint) {
        try {
          targetSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
        let ohPoint = this.convertPoint(rnPoint);
        try {
          targetSession.setFocusPoint(ohPoint);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusPoint call failed. error code: ${err.code}`);
        }
      } else {
        // 没有指定焦点时设置自动对焦
        try {
          targetSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
      }
    }
  }

  /**
   * 转换为鸿蒙Point坐标
   * VC坐标系(x,y)-> OH坐标系(x/w,y/h)
   * @param rnPoint
   * @returns
   */
  convertPoint(rnPoint: Point): Point {
    let ohPoint: Point = {
      x: 0,
      y: 0,
    };
    if (rnPoint) {
      ohPoint.x = (rnPoint.x + this.offsetX) / this.rect.surfaceWidth;
      ohPoint.y = (rnPoint.y + this.offsetY) / this.rect.surfaceHeight;
    }
    return ohPoint;
  }

  /**
   * 设置photoQuality
   * @param quality
   */
  setPhotoQualitySetting(quality: 'speed' | 'balanced' | 'quality' = 'speed'): void {
    this.photoManager?.setPhotoQualitySetting(quality);
  }


  /**
   * 设置拍摄位置
   * @param enableLocation
   */
  async setPhotoLocationSetting(enableLocation: boolean): Promise<void> {
    this.photoManager?.setPhotoLocationSetting(enableLocation);
  }

  initDeviceInfo(): CameraDeviceInfo[] {
    let cameraInfos = CommonManager.convertCameraDevice(this.cameraManager, this.videoSession,
      CommonManager.getAvailableCameraDevices(this.cameraManager));
    return cameraInfos;
  }

  /**
   * @note 开始录制
   * @param options RecordVideoOptions
   * @param props VisionCameraViewSpec.RawProps
   */
  async startRecording(
    options: RecordVideoOptions,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
    deviceDegree: number,
  ) {
    await this.videoManager?.startRecording(options, props, xwidth, xheight, deviceDegree);
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    await this.videoManager?.stopRecording();
  }

  /**
   * 发送录制成功回调事件
   */
  async sendOnRecordingFinishedEvent() {
    await this.videoManager?.sendOnRecordingFinishedEvent();
  }

  /**
   * 暂停录制
   */
  async pauseRecording() {
    await this.videoManager?.pauseRecording();
  }

  /**
   * 恢复录制
   */
  async resumeRecording() {
    await this.videoManager?.resumeRecording();
  }

  getUphasAudio() {
    return this.videoManager?.getUphasAudio();
  }

  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    return this.photoManager?.takePhoto(options);
  }

  getFps() {
    return this.videoManager?.getFps();
  }

  getVideoUri() {
    return this.videoManager?.getVideoUri();
  }

  getPhotoPreviewScale() {
    return this.photoPreviewScale;
  }

  setUphasAudio(uphasAudio: boolean) {
    this.videoManager?.setUphasAudio(uphasAudio)
  }

  setAudio(isAudio: boolean) {
    this.videoManager?.setAudio(isAudio)
  }

  async setVideoStabilizationMode(isStart: boolean, mode?: string) {
    return this.videoManager?.setVideoStabilizationMode(isStart, mode);
  }

  setPreviewRotation(videoHdr: boolean) {
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      this.photoManager?.setPreviewRotation(videoHdr);
    }
    if (this.mediaModel === camera.SceneMode.NORMAL_VIDEO) {
      this.videoManager?.setPreviewRotation(videoHdr);
    }
  }

  async copyFile(srcPath: string, destPath: string): Promise<void> {
    return this.videoManager?.copyFile(srcPath, destPath);
  }

}
