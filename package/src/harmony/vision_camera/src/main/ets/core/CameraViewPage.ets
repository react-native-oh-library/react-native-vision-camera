import { BusinessError } from '@ohos.base';
import Logger from '../utils/Logger';
import grantPermission from '../utils/PermissionUtils';
import CameraSession from '../service/CameraSession';
import { scanBarcode, scanCore } from '@kit.ScanKit';

const TAG: string = 'CameraViewPage:'

@Component
export default struct CameraViewPage {
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  context: Context = getContext(this);
  private cameraSession: CameraSession = new CameraSession(this.context);
  @Prop @Watch("pageStatusChange") isPageHide: boolean = false;
  @State isInit: boolean = false;
  // rect: SurfaceRect = { surfaceWidth: 1080, surfaceHeight: 1920 };
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };

  build() {
    Column() {
      XComponent({
        id: 'CameraViewComponent',
        type: 'surface',
        controller: this.mXComponentController
      })
        .onLoad(() => {
          this.mXComponentController.setXComponentSurfaceRect(this.rect);
          this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
        })
        .width('1920px')
        .height('1080px')
      Row() {
        Button('拍照')
          .height(40)
          .width(120)
          .onClick(() => {
            this.cameraSession.taskPhone();
          })
        Button('扫码')
          .height(40)
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
    }
  }

  aboutToAppear() {
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

  aboutToDisappear() {
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
}