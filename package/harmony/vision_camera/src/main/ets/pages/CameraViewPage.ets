import { RNComponentContext, RNViewBase, Tag } from '@rnoh/react-native-openharmony';
// import codegen 生成的内容
import { RNC } from '@rnoh/react-native-openharmony/generated';
import { BusinessError } from '@ohos.base';
import Logger from './utils/Logger';
import grantPermission from './utils/PermissionUtils';
import CameraSession from './service/CameraSession';
import { scanBarcode, scanCore } from '@kit.ScanKit';
import { Point } from './core/CameraConfig';
import { display } from '@kit.ArkUI';

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
  @State propertyArr: Array<string> = [];
  @State private childrenTags: Tag[] = []
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  context: Context = getContext(this);
  private localDisplay?: display.Display;
  private cameraSession: CameraSession = new CameraSession(this.context);
  @Prop @Watch("pageStatusChange") isPageHide: boolean = false;
  @State isInit: boolean = false;
  // rect: SurfaceRect = { surfaceWidth: 1080, surfaceHeight: 1920 };
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };

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
    const props = this.descriptorWrapper.props
    console.log(`FG 1.1 ${JSON.stringify(props)}`)
    this.propertyArr = Object.entries(props).map((item: Array<string>) => `${item[0]}: ${item[1]}`)
    console.log(`FG 2 ${this.propertyArr}`)
    console.log(`FG 3 ${JSON.stringify(this.descriptorWrapper)}`)
    grantPermission().then(res => {
      Logger.info(TAG, `权限申请成功  ${JSON.stringify(res)}`);
      this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
      Logger.info(TAG, `aboutToAppear surfaceId:  ${this.surfaceId}`);
      this.cameraSession.initCamera(this.surfaceId).then(() => {
        this.isInit = true;
      })
    }).catch((rej: BusinessError) => {
      Logger.info(TAG, `权限申请失败  ${JSON.stringify(rej)}`);
    })
  }

  private onDescriptorWrapperChange(descriptorWrapper: RNC.VisionCameraView.DescriptorWrapper) {
    this.descriptorWrapper = descriptorWrapper
    this.childrenTags = descriptorWrapper.childrenTags
  }

  aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    Logger.info(TAG, 'aboutToDisappear begin');
    this.cameraSession.cameraRelease();
  }

  pageStatusChange() {
    Logger.info(TAG, `pageStatusChange isPageHide: ${this.isPageHide}`);
    if (this.isPageHide) {
      this.cameraSession.cameraRelease();
    } else {
      if (this.isInit) {
        this.cameraSession.initCamera(this.surfaceId)
      }
    }
  }

  /**
   \* 拍照
   */
  taskPhone() {
    this.cameraSession.taskPhoto()
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
              this.mXComponentController.setXComponentSurfaceRect(this.cameraSession.rect);
              this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
            })
            .width('100%')
            .height('100%')
        }.onClick((clickEvent) => {
          this.cameraSession.focus({ x: clickEvent.x, y: clickEvent.y } as Point)
        })
        .width('100%')
        .height('100%')

        Row() {
          Button('拍照')
            .height('100%')
            .width(120)
            .onClick(() => {
              this.cameraSession.taskPhoto();
            })
          Button('扫码')
            .height('100%')
            .width(120)
            .onClick(() => {
              let options: scanBarcode.ScanOptions = {
                scanTypes: [scanCore.ScanType.ALL],
                enableMultiMode: true,
                enableAlbum: true
              };
              console.log(TAG, '[Scan].Promise scan options: ' + JSON.stringify(options))
              try {
                scanBarcode.startScanForResult(getContext(this), options).then((result: scanBarcode.ScanResult) => {
                  // 收到扫码结果后返回
                  console.log(TAG, '[Scan].Promise scan result: ' + JSON.stringify(result));
                }).catch((error: BusinessError) => {
                  console.log(TAG, '[Scan].Promise error: ' + JSON.stringify(error));
                });
              } catch (error) {
                console.log(TAG, '[Scan].failReason: ' + JSON.stringify(error));
              }
              console.log(TAG, '[Scan].end: ' + JSON.stringify(options))
            })
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