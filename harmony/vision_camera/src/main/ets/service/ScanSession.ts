/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { customScan, scanBarcode, scanCore } from '@kit.ScanKit';
import Logger from '../utils/Logger';
import { BusinessError } from '@ohos.base';
import { Code, Frame, Point, Rect, ScanResult } from '../core/CameraConfig';
import { AsyncCallback } from '@kit.BasicServicesKit';
import { RNOHContext } from '@rnoh/react-native-openharmony/ts';

const TAG: string = 'ScanSession:'

export default class ScanSession {
  private ScanFrame = {
    width: 0, height: 0
  };
  private codeType =
    ['unknown', 'aztec', 'codabar', 'code-39', 'code-93', 'code-128', 'data-matrix', 'ean-8', 'ean-13', 'itf',
      'pdf-417', 'qr', 'upc-a', 'upc-e']
  private isScanEnd: boolean = true;
  private ctx!: RNOHContext;

  constructor(_ctx?: RNOHContext) {
    _ctx && (this.ctx = _ctx);
  }

  /**
   * 初始化扫描仪
   */
  initScan(types) {
    let type = []
    if (types && types.length > 0) {
      type = types.map((item) => {
        return this.codeType.indexOf(item)
      })
    }
    let options: scanBarcode.ScanOptions = {
      scanTypes: type || [scanCore.ScanType.ALL],
      enableMultiMode: true,
      enableAlbum: true
    }
    try {
      customScan.init(options);
    } catch (error) {
      Logger.error(TAG, `init fail, error:${JSON.stringify(error)}`);
      this.onError(`init fail, error:${JSON.stringify(error)}`)
    }
  }

  /**
   * 启动相机进行扫码
   */
  async scanStart(surfaceId: string, SurfaceRect, isFirst: boolean, isAction: boolean, callback: AsyncCallback<Array<scanBarcode.ScanResult>>): Promise<void> {
    if (this.isScanEnd) {
      this.setEndStatus(false)
      // 获取到扫描结果后暂停相机流
      if (!isFirst) {
        this.scanStop()
      }
      this.ScanFrame = SurfaceRect;

      let viewControl: customScan.ViewControl = {
        width: SurfaceRect.width,
        height: SurfaceRect.height,
        surfaceId: surfaceId
      };
      customScan.start(viewControl, callback);
    }
  }

  async rescan(isAction: boolean) {
    this.setEndStatus(true);
    if (isAction) {
      customScan.rescan();
    }
  }

  /**
   * 获取扫描结果
   */
  showScanResult(result: Array<scanBarcode.ScanResult>) {
    if (result.length > 0) {
      const codes: Code[] = []
      result.forEach((data, index) => {
        const rect: Rect = {
          left: data.scanCodeRect?.left || 0,
          top: data.scanCodeRect?.top || 0,
          right: data.scanCodeRect?.right || 0,
          bottom: data.scanCodeRect?.bottom || 0
        }

        const codeW = rect.right - rect.left;
        const codeH = rect.bottom - rect.top;

        const codeFrame: Frame = {
          width: codeW,
          height: codeH,
          x: rect.left,
          y: rect.top
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
        frame: this.ScanFrame
      }
      return scanResult
    }
    return null
  }

  /**
   * 回调获取ScanFrame
   */
  private frameCallback: AsyncCallback<customScan.ScanFrame> =
    async (error: BusinessError, scanFrame: customScan.ScanFrame) => {
      if (error) {
        Logger.error(TAG, `start frame failed, code: ${error.code}, message: ${error.message}`);
        return;
      }
      if (!this.ScanFrame.width || !this.ScanFrame.height) {
        this.ScanFrame = {
          width: scanFrame.width,
          height: scanFrame.height
        }
      }
    }

  setEndStatus(flag: boolean) {
    this.isScanEnd = flag
  }

  /**
   * 页面消失或隐藏时，停止相机流/获取到扫描结果后暂停相机流
   */
  async scanStop() {
    try {
      customScan.stop().then(() => {
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `stop try failed error: ${JSON.stringify(error)}`);
      })
    } catch (error) {
      Logger.error(TAG, `stop catch failed error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * 页面消失或隐藏时，释放相机流
   */
  async scanRelease() {
    try {
      customScan.release().then(() => {
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `release failed error: ${JSON.stringify(error)}`);
      })
    } catch (error) {
      Logger.error(TAG, `Catch: release error ${JSON.stringify(error)}`);
    }
  }

  setTorch(torch: string) {
    let isTorch: boolean = torch === 'on';
    let status = customScan.getFlashLightStatus();
    if (status !== isTorch) {
      if (isTorch) {
        customScan.openFlashLight();
      } else {
        customScan.closeFlashLight();
      }
    }
  }
  onError(message: string) {
    if (this.ctx) {
      this.ctx.rnInstance?.emitDeviceEvent('onError', {
        nativeEvent: {
          errorMessage: `${TAG}: ${message}`
        }
      });
    }
  }
}