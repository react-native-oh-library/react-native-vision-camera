import { scanBarcode, scanCore, customScan } from '@kit.ScanKit';
import Logger from '../utils/Logger';
import { BusinessError } from '@ohos.base';
import { display, promptAction } from '@kit.ArkUI';
import {
  Point,
  ScanResult,
  Frame,
  Rect,
  Code
} from '../core/CameraConfig';

const TAG: string = 'ScanSession:'

export default class ScanSession {
  private localDisplay?: display.Display;
  rect = {
    surfaceWidth: 1216, surfaceHeight: 2224
  };
  private cameraWidth: number = 450
  private cameraHeight: number = 800

  constructor() {
    this.localDisplay = display.getDefaultDisplaySync();
    if(this.localDisplay){
      Logger.info(TAG, `localDisplay: ${JSON.stringify(this.localDisplay)}`);
      let previewSize = {
        surfaceWidth: this.localDisplay.width, surfaceHeight: this.localDisplay.height-126
      }
      this.rect = previewSize;
    }
  }

  /**
   * 初始化扫描仪
   */
  async initScan() {
    let options: scanBarcode.ScanOptions = {
      scanTypes: [scanCore.ScanType.ALL],
      enableMultiMode: true,
      enableAlbum: true
    }
    try {
      await customScan.init(options);
    } catch (error) {
      Logger.error(TAG, 'init fail, error: %{public}s ', JSON.stringify(error));
    }
  }

  /**
   * 启动相机进行扫码
   */
  async ScanStart(surfaceId: string) {
    Logger.info(TAG, 'ScanStart'+surfaceId)
    let viewControl: customScan.ViewControl = {
      width: this.cameraWidth,
      height: this.cameraHeight,
      surfaceId: surfaceId
    };

    try {
      const result: Array<scanBarcode.ScanResult> = await customScan.start(viewControl)
      await this.showScanResult(result);
    } catch (error) {
      Logger.error(TAG,  'start fail, error: %{public}s ', JSON.stringify(error));
    }
  }

  /**
   * 获取扫描结果
   */
  async showScanResult(result: Array<scanBarcode.ScanResult>) {
    if (result.length > 0) {
      const codeType = ['unknown', 'zatec', 'codebar', 'code-39', 'code-93', 'code-128', 'data-matrix', 'ean-8', 'ean-13', 'itf', 'pdf-417', 'qr', 'upc-a', 'upc-e']
      const codeResult: Code[] = []
      result.forEach((data, index) => {
        Logger.info(TAG+ JSON.stringify(data)+', index:'+index);
        const rect: Rect = {left: data.scanCodeRect?.left || 0, top: data.scanCodeRect?.top || 0, right: data.scanCodeRect?.right || 0, bottom: data.scanCodeRect?.bottom || 0}
        const codeW = rect.right - rect.left
        const codeH = rect.bottom - rect.top
        const codeFrame: Frame = { width: codeW, height: codeH, x: rect.left, y: rect.top }
        const corners: Point[] = [{x:rect.left, y: rect.top}, {x:rect.left+codeW, y: rect.top}, {x:rect.left+codeW, y: rect.top+codeH}, {x:rect.left, y: rect.top+codeH}]
        codeResult.push({
          "frame": codeFrame,
          "corners": corners,
          "value": data.originalValue,
          "type": codeType[data.scanType]
        })
      })
      const res: ScanResult  = {
        codes: codeResult,
        frame: {width: this.rect.surfaceWidth, height: this.rect.surfaceHeight}
      }
      Logger.info(TAG+'scan self result: %{public}s' + JSON.stringify(res));

      // 获取到扫描结果后暂停相机流
      try {
        customScan.stop().then(() => {
          Logger.info(TAG,'stop success!');
        }).catch((error: BusinessError) => {
          Logger.error(TAG,'stop failed error: %{public}s ', JSON.stringify(error));
        })
      } catch (error) {
        Logger.error(TAG,'stop failed error: %{public}s ', JSON.stringify(error));
      }

      try {
        promptAction.showToast({
          message: JSON.stringify(result),
          duration: 5000
        });
      } catch (error) {
        Logger.error(TAG, 'showToast error: %{public}s ', JSON.stringify(error));
      }
    }
  }

  /**
   * 页面消失或隐藏时，停止并释放相机流
   */
  async ScanRelease() {
    try {
      await customScan.stop();
    } catch (error) {
      Logger.error(TAG, 'Catch: stop error %{public}s', JSON.stringify(error));
    }
    try {
      customScan.release().then(() => {
        Logger.info(TAG, 'release success!');
      }).catch((error: BusinessError) => {
        Logger.error(TAG, 'release failed error: %{public}s ', JSON.stringify(error));
      })
    } catch (error) {
      Logger.error(TAG, 'Catch: release error %{public}s', JSON.stringify(error));
    }
  }
}