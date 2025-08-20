/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */
 
import camera from '@ohos.multimedia.camera';
import { RNComponentContext, RNViewBase } from '@rnoh/react-native-openharmony';
import Logger from './utils/Logger';
import { CameraCaptureError, CameraRuntimeError, CaptureError } from './types/CameraError';
import PermissionUtils from './utils/PermissionUtils';
import CameraSession from './service/CameraSession';
import {
  CameraPermissionRequestResult,
  CameraPermissionStatus,
  PhotoFile,
  Point,
  ScanResult,
  TakePhotoOptions
} from './core/CameraConfig';
import { display } from '@kit.ArkUI';
import ScanSession from './service/ScanSession';
import { cameraState, VideoStabilizationMode } from './core/CameraEnumBox';
import CameraManager from './service/CameraManager';
import { CameraDeviceInfo } from './core/CameraDeviceInfo';
import Utils from './utils/Utils';
import { VisionCameraViewSpec } from './types/VisionCameraViewSpec';
import { RecordVideoOptions } from './types/VideoFile';
import { Permissions } from '@kit.AbilityKit';
import { scanBarcode } from '@kit.ScanKit'
import { BusinessError } from '@kit.BasicServicesKit'
import { ICallBack, MP4Parser } from '@ohos/mp4parser';
import fileio from '@ohos.fileio';

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
  private eventEmitter: VisionCameraViewSpec.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []
  private cleanCommandCallback?: () => void;
  @State propertyArr: Array<string> = [];
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  context: Context = getContext(this);
  private localDisplay?: display.Display;
  private cameraSession: CameraSession = {} as CameraSession;
  private cameraState: cameraState = cameraState.PHOTO;
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };
  private scanSession: ScanSession = {} as ScanSession;
  private cameraManager: CameraManager = new CameraManager();
  @State scaleValue: number = 1;
  @State componentWidth: number = 0;
  @State componentHeight: number = 0;
  private timer = 0
  private enableZoomGesture: boolean | undefined = undefined;
  private prevProps: VisionCameraViewSpec.RawProps | undefined = undefined;
  private currentProps: VisionCameraViewSpec.RawProps = {} as VisionCameraViewSpec.RawProps;
  @State pageFlag: boolean = false;
  @State localDisplayWidth: number = 100;
  @State localDisplayHeight: number = 100;
  @State androidPreviewViewType: 'surface' | 'texture' = 'surface';
  private noViewPhoto: boolean = false;
  @State maskWidth: number = 0;
  @State maskHeight: number = 0;
  @State maskOffsetx: string = '0px'
  @State maskOffsety: string = '0px'

  aboutToAppear() {
    this.localDisplay = display.getDefaultDisplaySync();
    this.eventEmitter = new VisionCameraViewSpec.EventEmitter(this.ctx.rnInstance, this.tag)
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
    this.maskWidth = vp2px(width)
    this.maskHeight = vp2px(height)

    this.localDisplayWidth =  this.localDisplay?.width;
    this.localDisplayHeight = this.localDisplay?.height;
    this.enableZoomGesture = props.enableZoomGesture;
    this.registerCommandCallback();

    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
    }
    if (props.photo) {
      this.cameraState = cameraState.PHOTO;
    } else if (props.video) {
      this.cameraState = cameraState.VIDEO
    }
    if (props.androidPreviewViewType && props.androidPreviewViewType !== `${this.androidPreviewViewType}-view`) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    this.defaultGrantPermission(props).then(res => {
      this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
      this.initSession(props);
      this.onInitialized();
    });
  }

  /**
   * 初始化Session
   */
  initSession(props: VisionCameraViewSpec.RawProps) {
    if (this.cameraState === cameraState.SCAN) {
      this.scanSession = new ScanSession(this.ctx);
      this.scanSession.initScan(props.codeScanner?.codeTypes);
      this.scanStart(true);
    } else {
      this.cameraSession = new CameraSession(this.ctx);
      this.cameraSession.initCamera(this.surfaceId, props,
        this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO : camera.SceneMode.NORMAL_VIDEO);
      this.cameraSession.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
        (width, height) => {
          this.componentWidth = width;
          this.componentHeight = height;
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
          this.scanSession = new ScanSession();
          this.scanSession.initScan(props.codeScanner?.codeTypes);
          if (props.isActive) {
            this.scanStart(true);
          }
        }, 200)
      } else {
        try {
          let mediaModel =
            this.cameraState === cameraState.VIDEO ? camera.SceneMode.NORMAL_VIDEO : camera.SceneMode.NORMAL_PHOTO
          this.cameraSession.initCamera(this.surfaceId, props, mediaModel)
          this.cameraSession.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
            (width, height) => {
              this.componentWidth = width;
              this.componentHeight = height;
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
        await this.scanSession.scanStop();
        this.scanSession.scanRelease();
      }else {
        this.cameraSession.cameraRelease()
      }
    }))
  }

  //更新props
  updateProps(props: VisionCameraViewSpec.RawProps) {
    this.cameraSession.uphasAudio = true;
    this.defaultGrantPermission(props);
    this.cameraSession.changeCameraPosition({
      surfaceId: this.surfaceId, props,
      mediaModel: this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO : camera.SceneMode.NORMAL_VIDEO
    })
    if (props.isActive !== undefined && this.prevProps?.isActive !== props.isActive) {
      this.cameraSession.activeChange(props.isActive);
      if (props.isActive) {
        this.ctx.rnInstance.emitDeviceEvent('onCameraStarted', {});
      } else {
        this.ctx.rnInstance.emitDeviceEvent('onCameraStopped', {});
      }
    }
    if (props.audio !== undefined && this.prevProps?.audio !== props.audio) {
      this.cameraSession.setAudio(props.audio);
    }
    if (props.preview !== undefined && this.prevProps?.preview !== props.preview) {
      this.cameraSession.previewChange(props.preview);
    }
    if (props.enableZoomGesture !== undefined && this.prevProps?.enableZoomGesture !== props.enableZoomGesture) {
      this.enableZoomGesture = props.enableZoomGesture;
    }
    if (props.exposure !== undefined && this.prevProps?.exposure !== props.exposure) {
      this.cameraSession.setExposure(props.exposure);
    }
    if (props.zoom !== undefined && this.prevProps?.zoom !== props.zoom) {
      this.cameraSession.setSmoothZoom(props.zoom);
    }
    if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
      this.cameraSession.setTorch(props.torch)
    }
    if (props.photoQualityBalance !== undefined && this.prevProps?.photoQualityBalance !== props.photoQualityBalance) {
      this.cameraSession.setPhotoQualitySetting(props.photoQualityBalance);
    }
    if (props.enableLocation !== undefined && this.prevProps?.enableLocation !== props.enableLocation) {
      this.cameraSession.setPhotoLocationSetting(props.enableLocation);
    }
    if (props.androidPreviewViewType && this.prevProps?.androidPreviewViewType !== props.androidPreviewViewType) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    if (props.videoHdr !== undefined && this.prevProps?.videoHdr !== props.videoHdr) {
      if (props.videoHdr !== undefined && props.videoStabilizationMode !== VideoStabilizationMode.AUTO) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoStabilizationMode must be auto'))
        return;
      }
      this.cameraSession.hdrChange(props);
    }
    if (props.videoStabilizationMode !== undefined &&
      this.prevProps?.videoStabilizationMode !== props.videoStabilizationMode) {
      if (props.videoHdr) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoHdr must be false'))
        return;
      }
      this.cameraSession.setVideoStabilizationMode(false, props.videoStabilizationMode);
    }
    this.maskWidth = Math.floor(vp2px(this.descriptorWrapper.width))
    this.maskHeight = Math.floor(vp2px(this.descriptorWrapper.height))
    this.maskOffsetx = this.calculateX(this.maskWidth) + 'px'
    this.maskOffsety = this.calculateY(this.maskHeight) + 'px'
    this.cameraSession.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
     (width, height) => {
       if(this.maskWidth < width)
       {
          this.maskWidth = width
       }
      this.componentWidth = width;
      this.componentHeight = height;

      });

    this.pageFlag = !this.pageFlag;
  }

  private onDescriptorWrapperChange(descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper) {
    this.descriptorWrapper = descriptorWrapper;
    const descriptorBase = descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    this.currentProps = props;
    if (this.cameraState !== cameraState.SCAN && !Utils.isEmptyObject(this.cameraSession)) {
      this.updateProps(props);
    }
    if (this.cameraState === cameraState.SCAN && !Utils.isEmptyObject(this.scanSession)) {
      const isActiveChange = props.isActive !== undefined && this.prevProps?.isActive !== props.isActive;
      if (isActiveChange) {
        if (props.isActive) {
          this.scanStart(true);
        } else {
          this.scanSession.scanStop();
          this.scanSession.setEndStatus(true);
        }
      }
      if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
        this.scanSession.setTorch(props.torch);
      }
    }
    this.prevProps = props;
  }

  async aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    if (this.cameraState === cameraState.SCAN) {
      clearTimeout(this.timer)
      await this.scanSession.scanStop();
      this.scanSession.scanRelease();
    } else {
      await this.cameraSession.cameraRelease();
    }
    this.cleanCommandCallback?.();
    this.cancellationCallback()
  }

  registerCommandCallback() {
    if (this.ctx) {
      this.cleanCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
        this.tag,
        async (command, args: (string | number | boolean | object)[]) => {
          if (command === 'takePhoto') {
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
            } else {
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
            const options = args[0] as RecordVideoOptions;
            Logger.debug(TAG, `registerCommandCallback: startRecording.${JSON.stringify(options)}}`)
            this.startRecording(options);
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
      this.scanSession.scanStart(this.surfaceId,
        { width: this.localDisplayWidth, height: this.localDisplayHeight }, isFirst, isActive,
        (error: BusinessError, result: Array<scanBarcode.ScanResult>) => {
          if (error) {
            Logger.error(TAG, `start failed, code: ${error.code}, message: ${error.message} `)
            return;
          }
          scanResult = result;
          if (scanResult) {
            const callbackResult = this.scanSession.showScanResult(result);
            this.ctx.rnInstance.emitDeviceEvent('onCodeScanned', callbackResult);
          }
          this.scanSession.rescan(isActive);
        });
    } catch (error) {
      if (error.code === '1000500001') {
        this.onError(new CameraRuntimeError('unknown/unknown', 'codeScanner preview size not support.'))
      }
    }

  }
  /**
   * 计算裁剪X 偏移量
   */
  calculateX(maskWidth: number) {
    const slope = 12 / 13;    // 斜率
    const intercept = -4630;  // 截距
    return slope * maskWidth + intercept;
  }
  /**
   * 计算裁剪Y 偏移量
   */
  calculateY(maskHeight: number) {
  // 精确分数计算: y = (-29/13)x - 20
  const slope = -29 / 13;  // 精确斜率
  const intercept = -20;   // 精确截距
  return Math.round(slope * maskHeight + intercept);
}
  /**
   * 拍照
   */
  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    this.ctx.rnInstance.emitDeviceEvent('onShutter', { type: 'photo' });
    const photoFile = await this.cameraSession.takePhoto(options);
    this.ctx.rnInstance.emitDeviceEvent('onTaskPhoto', photoFile);
    return photoFile;
  }

  /**
   * focus
   * @param rnPoint
   */
  focus(rnPoint: Point) {
    this.cameraSession.focus(rnPoint);
  }

  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): CameraDeviceInfo[] {
    return this.cameraManager.getAvailableCameraDevices();
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

  /**
   * 开始录制
   */
  startRecording(options: RecordVideoOptions): void {
    this.cameraSession.startRecording(options, this.currentProps)
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    await this.cameraSession.stopRecording()
    //当帧率设置30fps时直接回调，不需要转换，系统默认录制出来是30fps
    if(this.cameraSession.fps == 30) {
      this.cameraSession.sendOnRecordingFinishedEvent();
      return;
    }
    //由于系统Api media.AVRecorder->prepare录制后videoFrameRate设置无效，因此使用FFmpeg处理帧率转换
    let inPath =  this.cameraSession.videoUri;
    let outPath = this.context.cacheDir + "/temp.mp4";
    let this_ = this;
    let callBack: ICallBack = {
      async callBackResult(code: number) {
         if (code == 0 ) {  //处理转换帧率成功
           await this_.copyFile(outPath,inPath);
           this_.cameraSession.sendOnRecordingFinishedEvent();
         } else {
           this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
             new CameraCaptureError('capture/recording-in-progress', 'Failed to stop recording.'));
         }
      }
    }
    MP4Parser.ffmpegCmd("ffmpeg -y -i "+inPath+" -r "+this.cameraSession.fps+" -c:v libopenh264 -c:a copy "+outPath,callBack)
  }

  /**
   * 拷贝文件
   * @param srcPath
   * @param destPath
   * @returns
   */
  async  copyFile(srcPath: string, destPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let srcFd: number = -1;
    let destFd: number = -1;
    const bufferSize: number = 4096;
    const buffer: ArrayBuffer = new ArrayBuffer(bufferSize);

    try {
      srcFd = await fileio.open(srcPath, 0o102, 0o666);
      if (srcFd === -1) {
        throw new Error(`Unable to open the source file: ${srcPath}`);
      }
      destFd = await fileio.open(destPath, 0o102, 0o666);
      if (destFd === -1) {
        throw new Error(`Unable to open the target file: ${destPath}`);
      }
      let bytesRead: number;
      do {
        bytesRead = await fileio.readSync(srcFd, buffer);
        if (bytesRead > 0) {
          const bytesWritten = await fileio.write(destFd, buffer, { length: bytesRead });
          if (bytesWritten !== bytesRead) {
            throw new Error(`Writing the file is incomplete. It was expected to write ${bytesRead} bytes, but actually wrote ${bytesWritten} bytes`);
          }
        }
      } while (bytesRead > 0);
      resolve();
    } catch (err) {
      reject(new Error(`File copy failed: ${err.message}`));
    } finally {
      if (srcFd !== -1) {
        try {
          await fileio.close(srcFd);
        } catch (closeErr) {
          Logger.error(`Failed to close the source file descriptor: ${closeErr.message}`);
        }
      }
      if (destFd !== -1) {
        try {
          await fileio.close(destFd);
        } catch (closeErr) {
          Logger.error(`Failed to close the target file descriptor: ${closeErr.message}`);
        }
      }
    }
  });
 }

  /**
   * 暂停录制
   */
  pauseRecording() {
    this.cameraSession.pauseRecording()
  }

  /**
   * 恢复录制
   */
  resumeRecording() {
    this.cameraSession.resumeRecording()
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
            })
            .width(this.cameraState === cameraState.SCAN ? this.localDisplayWidth + 'px' : this.componentWidth + 'px')
            .height(this.cameraState === cameraState.SCAN ? this.localDisplayHeight + 'px' :
              this.componentHeight + 'px')
            .clipShape(new Rect({width: this.maskWidth,height: this.maskHeight}).offset({x:this.maskOffsetx,y: this.maskOffsety}))
        }
        .onClick((clickEvent) => {
          if (this.cameraState === cameraState.PHOTO) {
            this.cameraSession.focus({ x: vp2px(clickEvent.x), y: vp2px(clickEvent.y) } as Point)
          }
        })
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .gesture(
          // 在组件上绑定三指触发的捏合手势
          PinchGesture({ fingers: 2 })// 当捏合手势触发时，可以通过回调函数获取缩放比例，从而修改组件的缩放比例
            .onActionUpdate((event: GestureEvent) => {
              this.scaleValue = this.cameraSession.photoPreviewScale * event.scale;
            })
            .onActionEnd(() => {
              if (this.enableZoomGesture) {
                this.cameraSession.setSmoothZoom(this.scaleValue);
              }
            })
        )
      }
      .width(this.localDisplayWidth + 'px')
      .height(this.localDisplayHeight + 'px')
    }
  }
}