import { RNComponentContext, RNViewBase, Tag } from '@rnoh/react-native-openharmony';
// import codegen 生成的内容
import { RNC } from '@rnoh/react-native-openharmony/generated';

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

const TAG: string = 'VisionCameraView:'

@Component
export struct VisionCameraView {
  public static readonly NAME = RNC.VisionCameraView.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: RNC.VisionCameraView.DescriptorWrapper =
    {} as RNC.VisionCameraView.DescriptorWrapper
  private eventEmitter: RNC.VisionCameraView.EventEmitter | undefined = undefined
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
  @Prop @Watch("codeScannerChange") CodeScanner: CodeScanner = {};
  @State isScanEnd: boolean = false;
  private cameraManager: CameraManager = new CameraManager();

  aboutToAppear() {
    this.localDisplay = display.getDefaultDisplaySync();

    Logger.info(TAG, `localDisplay  ${JSON.stringify(this.localDisplay)}`);
    this.eventEmitter = new RNC.VisionCameraView.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<RNC.VisionCameraView.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as RNC.VisionCameraView.DescriptorWrapper)
      }
    ))

    const descriptorBase = this.descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    Logger.info(TAG, `FG 1.1 ${JSON.stringify(props)}`)
    this.propertyArr = Object.entries(props).map((item: Array<string>) => `${item[0]}: ${item[1]}`)
    Logger.info(TAG, `FG 2 ${this.propertyArr}`)
    Logger.info(TAG, `FG 3 ${JSON.stringify(this.descriptorWrapper)}`)
    this.registerCommandCallback();
    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
      Logger.info(TAG, `props.codeScanner ${JSON.stringify(props.codeScanner)}`);
    }
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
        this.cameraSession.initCamera(this.surfaceId);
      }

    }).catch((rej: BusinessError) => {
      Logger.info(TAG, `权限申请失败  ${JSON.stringify(rej)}`);
    })
  }

  private onDescriptorWrapperChange(descriptorWrapper: RNC.VisionCameraView.DescriptorWrapper) {
    Logger.info(TAG, `onDescriptorWrapperChange  ${JSON.stringify(descriptorWrapper)}`);
    this.descriptorWrapper = descriptorWrapper
    this.childrenTags = descriptorWrapper.childrenTags
  }

  aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    Logger.info(TAG, 'aboutToDisappear begin');
    if (this.cameraState === cameraState.SCAN) {
      this.scanSession.ScanRelease();
    } else {
      this.cameraSession.cameraRelease();
    }
    this.cleanCommandCallback?.();
  }

  registerCommandCallback() {
    if (this.ctx) {
      this.cleanCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
        this.tag,
        (command, args: (string | number)[]) => {
          if (command === 'takePhoto') {
            Logger.debug(TAG, `registerCommandCallback: takePhoto,  ${JSON.stringify(args)}`)
            this.taskPhoto({});
          }
          if (command === 'focus') {
            Logger.debug(TAG, `registerCommandCallback: takePhoto,  ${JSON.stringify(args)}`)
            this.taskPhoto({});
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

  async scanStart() {
    this.isScanEnd = false
    const scanResult = await this.scanSession.ScanStart(this.surfaceId);
    this.isScanEnd = true
    if (scanResult) {
      // this.eventEmitter!.emit("onCodeScanned", scanResult)
      Logger.info(TAG, `get scan result: ${JSON.stringify(scanResult)}`)
    }
  }

  async codeScannerChange() {
    await this.scanSession.initScan(this.CodeScanner.codeTypes)
    this.scanStart()
  }

  /**
   * 拍照
   */
  taskPhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    Logger.info(TAG, `taskPhoto params: ${options}`)
    return this.cameraSession.taskPhoto(options);
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
            .width(this.localDisplay?.width + 'px')
            .height(this.localDisplay?.height + 'px')
        }.onClick((clickEvent) => {
          if (this.cameraState === cameraState.PHOTO) {
            this.cameraSession.focus({ x: vp2px(clickEvent.x), y: vp2px(clickEvent.y) } as Point)
          }
        })
        .width('100%')
        .height('100%')

        Row() {
          Button('拍照')
            .height('100%')
            .width(120)
            .onClick(() => {
              this.cameraSession.taskPhoto(undefined);
            })
            .visibility(this.cameraState === cameraState.SCAN ? Visibility.None : Visibility.Visible)
          Button('扫码')
            .height('100%')
            .width(120)
            .onClick(async () => {
              this.scanStart()
            })
            .visibility(this.cameraState === cameraState.SCAN && this.isScanEnd ? Visibility.Visible : Visibility.None)
        }
        .justifyContent(FlexAlign.SpaceAround)
        .width('100%')
        .height(40)
      }
      .width(this.localDisplay?.width + 'px')
      .height(this.localDisplay?.height + 'px')
    }
  }
}