import { customScan, scanBarcode, scanCore } from '@kit.ScanKit';
import Logger from '../utils/Logger';
import { BusinessError } from '@ohos.base';
import { Code, Frame, Point, Rect, ScanResult } from '../core/CameraConfig';

const TAG: string = 'ScanSession:'

export default class ScanSession {
  private rect = {
    surfaceWidth: 0, surfaceHeight: 0
  };
  private codeType = ['unknown', 'aztec', 'codabar', 'code-39', 'code-93', 'code-128', 'data-matrix', 'ean-8', 'ean-13', 'itf', 'pdf-417', 'qr', 'upc-a', 'upc-e']
  private isScanEnd: boolean = true;

  constructor() {
  }

  /**
   * 初始化扫描仪
   */
  async initScan(types) {
    Logger.info(TAG, `initScan types:${JSON.stringify(types)}`);
    let type = []
    if (types && types.length > 0) {
      type = types.map((item) => {
        return this.codeType.indexOf(item)
      })
    }
    Logger.info(TAG, `init:type:${JSON.stringify(type)}`);
    let options: scanBarcode.ScanOptions = {
      scanTypes: type || [scanCore.ScanType.ALL],
      enableMultiMode: true,
      enableAlbum: true
    }
    try {
      await customScan.init(options);
    } catch (error) {
      Logger.error(TAG, `init fail, error:${JSON.stringify(error)}`);
    }
  }

  /**
   * 启动相机进行扫码
   */
  async ScanStart(surfaceId: string, SurfaceRect) {
    this.rect = SurfaceRect
    Logger.info(TAG, `ScanStart:surfaceId: ${surfaceId}, SurfaceRect:${JSON.stringify(SurfaceRect)}}`)
    if (this.isScanEnd) {
      this.isScanEnd = false

      // 获取到扫描结果后暂停相机流
      try {
        customScan.stop().then(() => {
          Logger.info(TAG, 'stop success!');
        }).catch((error: BusinessError) => {
          Logger.error(TAG, `stop failed error: ${JSON.stringify(error)}`);
        })
      } catch (error) {
        Logger.error(TAG, `stop failed error: ${JSON.stringify(error)}`);
      }

      let viewControl: customScan.ViewControl = {
        width: SurfaceRect.width,
        height: SurfaceRect.height,
        surfaceId: surfaceId
      };

      try {
        Logger.info(TAG, `start viewControl, info: ${JSON.stringify(viewControl)}`);
        const result: Array<scanBarcode.ScanResult> = await customScan.start(viewControl)
        const scanResult = await this.showScanResult(result);
        this.isScanEnd = true
        return scanResult
      } catch (error) {
        Logger.error(TAG, `start fail, error: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * 获取扫描结果
   */
  async showScanResult(result: Array<scanBarcode.ScanResult>) {
    if (result.length > 0) {
      const codes: Code[] = []
      result.forEach((data, index) => {
        const rect: Rect = {
          left: data.scanCodeRect?.left || 0,
          top: data.scanCodeRect?.top || 0,
          right: data.scanCodeRect?.right || 0,
          bottom: data.scanCodeRect?.bottom || 0
        }
        const codeW = rect.right - rect.left
        const codeH = rect.bottom - rect.top
        const codeFrame: Frame = {
          width: codeW, height: codeH, x: rect.left, y: rect.top
        }
        const corners: Point[] = [{
          x: rect.left, y: rect.top
        }, {
          x: rect.left + codeW, y: rect.top
        }, {
          x: rect.left + codeW, y: rect.top + codeH
        }, {
          x: rect.left, y: rect.top + codeH
        }]
        codes.push({
          "frame": codeFrame,
          "corners": corners,
          "value": data.originalValue,
          "type": this.codeType[data.scanType]
        })
      })
      const scanResult: ScanResult = {
        codes: codes,
        frame: {
          width: this.rect.surfaceHeight, height: this.rect.surfaceWidth
        }
      }
      Logger.info(TAG, `scan self result: ${JSON.stringify(scanResult)}`);

      // // 获取到扫描结果后暂停相机流
      // try {
      //   customScan.stop().then(() => {
      //     Logger.info(TAG, 'stop success!');
      //   }).catch((error: BusinessError) => {
      //     Logger.error(TAG, `stop failed error: ${JSON.stringify(error)}`);
      //   })
      // } catch (error) {
      //   Logger.error(TAG, `stop failed error: ${JSON.stringify(error)}`);
      // }
      return scanResult
    }
    return null
  }

  /**
   * 页面消失或隐藏时，停止并释放相机流
   */
  async ScanRelease() {
    try {
      await customScan.stop();
    } catch (error) {
      Logger.error(TAG, `Catch: stop error ${JSON.stringify(error)}`);
    }
    try {
      customScan.release().then(() => {
        Logger.info(TAG, 'release success!');
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `release failed error: ${JSON.stringify(error)}`);
      })
    } catch (error) {
      Logger.error(TAG, `Catch: release error ${JSON.stringify(error)}`);
    }
  }
}