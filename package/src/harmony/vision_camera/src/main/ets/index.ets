import CameraViewPage from './CameraViewPage';
import ScanViewPage from './ScanViewPage';
const TAG: string = 'CameraViewIndex:'


@Entry
@Component
struct Index {
  @State message: string = 'Hello World';
  @State isPageHide: boolean = false;
  @State codeScan: boolean = true

  build() {
    Column() {
      Stack({ alignContent: Alignment.Bottom }) {
        if (this.codeScan) {
          ScanViewPage({isPageHide: this.isPageHide})
            .height('100%')
            .width('100%')
        }else {
          CameraViewPage({isPageHide: this.isPageHide})
            .height('100%')
            .width('100%')
        }

      }
    }
    .height('100%')
    .width('100%')
  }

  onPageHide() {
    this.isPageHide = true;
  }

  onPageShow() {
    this.isPageHide = false;
  }
}