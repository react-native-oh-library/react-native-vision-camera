import { RNComponentContext, RNViewBase, Tag } from '@rnoh/react-native-openharmony';
import { BusinessError } from '@ohos.base';
import Logger from './utils/Logger';
import PermissionUtils from './utils/PermissionUtils';
import CameraSession from './service/CameraSession';
import {
  CameraPermissionRequestResult,
  CameraPermissionStatus,
  CodeScanner,
  PhotoFile,
  Point,
  TakePhotoOptions
} from './core/CameraConfig';
import { display } from '@kit.ArkUI';
import ScanSession from './service/ScanSession';
import { cameraState } from './core/CameraEnumBox';
import CameraManager from "./service/CameraManager";
import { CameraDeviceInfo } from './core/CameraDeviceInfo';
import Utils from './utils/Utils';
import { VisionCameraViewSpec } from './types/VisionCameraViewSpec';

const TAG: string = 'VisionCameraView:'

@Component
export struct VisionCameraView {
  public static readonly NAME = VisionCameraViewSpec.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper =
    {} as VisionCameraViewSpec.DescriptorWrapper
  private eventEmitter: VisionCameraViewSpec.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []
  private cleanCommandCallback?: () => void;
  @State propertyArr: Array<string> = [];
  @State private childrenTags: Tag[] = []
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
  private enableZoomGesture:boolean|undefined = undefined;

  aboutToAppear() {
    this.localDisplay = display.getDefaultDisplaySync();

    Logger.info(TAG, `localDisplay  ${JSON.stringify(this.localDisplay)}`);
    this.eventEmitter = new VisionCameraViewSpec.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<VisionCameraViewSpec.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as VisionCameraViewSpec.DescriptorWrapper)
      }
    ))

    const descriptorBase = this.descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    this.enableZoomGesture = props.enableZoomGesture;
    Logger.info(TAG, `FG 1.1 ${JSON.stringify(props)}`)
    this.propertyArr = Object.entries(props).map((item: Array<string>) => `${item[0]}: ${item[1]}`)
    Logger.info(TAG, `FG 2 ${this.propertyArr}`)
    Logger.info(TAG, `FG 3 ${JSON.stringify(this.descriptorWrapper)}`)
    this.registerCommandCallback();

    Logger.info(TAG, `props.registerCommandCallback end`);
    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
      Logger.info(TAG, `props.codeScanner ${JSON.stringify(props.codeScanner)}`);
    }
    Logger.info(TAG, `defaultGrantPermission before`);
    new PermissionUtils().defaultGrantPermission().then(res => {
      Logger.info(TAG, `权限申请成功  ${JSON.stringify(res)}`);
      this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
      Logger.info(TAG, `aboutToAppear surfaceId:  ${this.surfaceId},cameraState:  ${this.cameraState}`);
      if (this.cameraState === cameraState.SCAN) {
        Logger.info(TAG, `aboutToAppear cameraState:  ${this.cameraState}`);
        this.scanSession = new ScanSession();
        Logger.info(TAG, `aboutToAppear initScan:  ${JSON.stringify(props.codeScanner)}`);
        this.scanSession.initScan(props.codeScanner?.codeTypes);
        this.scanStart();
      } else {
        this.cameraSession = new CameraSession();
        this.cameraSession.initDeviceInfo().then(() => {
          this.cameraSession.initCamera(this.surfaceId, props)
          this.cameraSession.setResizeMode(props.resizeMode, this.localDisplay?.width, this.localDisplay?.height,
          (width, height) => {
            this.componentWidth = width;
            this.componentHeight = height;
          });
        })
      }
      this.onInitialized();
    }).catch((rej: BusinessError) => {
      Logger.info(TAG, `权限申请失败  ${JSON.stringify(rej)}`);
    })
  }

  private onDescriptorWrapperChange(descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper) {
    Logger.info(TAG, `onDescriptorWrapperChange  ${JSON.stringify(descriptorWrapper)}`);
    this.descriptorWrapper = descriptorWrapper
    this.childrenTags = descriptorWrapper.childrenTags
  }

  async aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    Logger.info(TAG, 'aboutToDisappear begin');
    if (this.cameraState === cameraState.SCAN) {
      clearTimeout(this.timer)
      this.scanSession.ScanRelease();
    } else {
      await this.cameraSession.cameraRelease();
    }
    this.cleanCommandCallback?.();
  }

  registerCommandCallback() {
    if (this.ctx) {
      this.cleanCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
        this.tag,
        (command, args: (string | number | boolean | object)[]) => {
          if (command === 'takePhoto') {
            Logger.debug(TAG, `registerCommandCallback: takePhoto,  ${JSON.stringify(args)}`)
            const options = args[0] as TakePhotoOptions;
            this.taskPhoto(options);
          }
          if (command === 'focus') {
            Logger.debug(TAG, `registerCommandCallback: focus,  ${JSON.stringify(args)}`)
            const point = args[0] as Point;
            this.focus(point);
          }
          if (command === 'getAvailableCameraDevices') {
            Logger.debug(TAG, `registerCommandCallback: getAvailableCameraDevices.`)
            this.getAvailableCameraDevices();
          }
          if (command === 'getCameraPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getCameraPermissionStatus.`)
            this.getCameraPermissionStatus();
          }
          if (command === 'requestCameraPermission') {
            Logger.debug(TAG, `registerCommandCallback: requestCameraPermission.`)
            this.requestCameraPermission();
          }
          if (command === 'getMicrophonePermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getMicrophonePermissionStatus.`)
            this.getMicrophonePermissionStatus();
          }
          if (command === 'requestMicrophonePermission') {
            Logger.debug(TAG, `registerCommandCallback: requestMicrophonePermission.`)
            this.requestMicrophonePermission();
          }
          if (command === 'getLocationPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getLocationPermissionStatus.`)
            this.getLocationPermissionStatus();
          }
        });
    }
  }

  onInitialized() {
    Logger.info(TAG, `emitDeviceEvent onInitialized`)
    this.ctx.rnInstance.emitDeviceEvent('onInitialized', {});
    Logger.info(TAG, `emitDeviceEvent onInitialized end`)
  }

  onError() {
    Logger.info(TAG, `emitDeviceEvent onError`)
    this.ctx.rnInstance.emitDeviceEvent('onError', { error: 'test' });
  }


  async scanStart() {
    clearTimeout(this.timer)
    const scanResult = await this.scanSession.ScanStart(this.surfaceId, this.localDisplay);
    if (scanResult) {
      this.ctx.rnInstance.emitDeviceEvent('onCodeScanned', scanResult);
      Logger.info(TAG, `get scan result: ${JSON.stringify(scanResult)}`)

      this.timer = setTimeout(() => {
        this.scanStart()
      }, 1000)
    }
  }

  /**
   * 拍照
   */
  async taskPhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    const photoFile = await this.cameraSession.taskPhoto(options);
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
            type: 'surface',
            controller: this.mXComponentController
          })
            .onLoad(() => {
              let temp: SurfaceRect = { surfaceWidth: vp2px(450), surfaceHeight: vp2px(800) }
              // Logger.info(TAG, `temp SurfaceRect: ${JSON.stringify(temp)}`)
              // this.mXComponentController.setXComponentSurfaceRect(temp);
              this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
            })
            .width(this.cameraState === cameraState.SCAN ? this.localDisplay?.width + 'px' : this.componentWidth + 'px')
            .height(this.cameraState === cameraState.SCAN ? this.localDisplay?.height + 'px' : this.componentHeight + 'px')

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
              if(this.enableZoomGesture){
                this.scaleValue = this.cameraSession.photoPreviewScale * event.scale;
                Utils.throttle(this.cameraSession.setSmoothZoom(this.scaleValue), 500);
              }
            })
        )
      }
      .width(this.localDisplay?.width + 'px')
      .height(this.localDisplay?.height + 'px')
    }
  }
}