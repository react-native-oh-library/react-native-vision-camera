import { BusinessError } from '@ohos.base';
import Logger from './utlis/Logger';
import grantPermission from './utlis/PermissionUtils';
import ScanSession from './service/ScanSession';

const TAG: string = 'ScanViewPage:'

@Component
    export default struct ScanViewPage {
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  private scanSession: ScanSession = new ScanSession();
    @Prop @Watch("pageStatusChange") isPageHide: boolean = false;
    @State isInit: boolean = false;
    @State isScanEnd: boolean = false;

    build() {
        Column() {
            Column() {
                XComponent({
                    id: 'CameraViewComponent',
                    type: 'surface',
                    controller: this.mXComponentController
                })
                    .onLoad(() => {
                        this.mXComponentController.setXComponentSurfaceRect(this.scanSession.rect);
                        this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
                    })
                    .width('100%')
                    .height('100%')
            }
      .width('100%')
                .height('92%')

            Row() {
                Button('扫码')
                    .height('100%')
                    .width(120)
                    .onClick(async () => {
                        this.isScanEnd = false
                        await this.scanSession.ScanStart(this.surfaceId);
                        this.isScanEnd = true
                    })
                    .visibility(this.isScanEnd ? Visibility.Visible : Visibility.None)
            }
      .justifyContent(FlexAlign.SpaceAround)
                .width('100%')
                .height('8%')
        }
    .width('100%')
            .height('100%')
    }

    aboutToAppear() {
        grantPermission().then(res => {
            Logger.info(TAG, `权限申请成功  ${JSON.stringify(res)}`);
            this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
            Logger.info(TAG, `aboutToAppear surfaceId:  ${this.surfaceId}`);

            this.scanSession.initScan().then(() => {
                this.isInit = true;
            })
            this.scanSession.ScanStart(this.surfaceId).then(() => {
                this.isScanEnd = true
            })

        }).catch((rej: BusinessError) => {
            Logger.info(TAG, `权限申请失败  ${JSON.stringify(rej)}`);
        })
    }

    aboutToDisappear() {
        Logger.info(TAG, 'aboutToDisappear begin');
        this.scanSession.ScanRelease()
    }

  async pageStatusChange() {
        Logger.info(TAG, `pageStatusChange isPageHide: ${this.isPageHide}`);
        if (this.isPageHide) {
            this.scanSession.ScanRelease()
        } else {
            if (this.isInit) {
                await this.scanSession.initScan()
                this.isScanEnd = false
                await this.scanSession.ScanStart(this.surfaceId)
                this.isScanEnd = true
            }
        }
    }
}