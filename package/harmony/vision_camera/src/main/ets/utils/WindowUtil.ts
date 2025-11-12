/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 ("the License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { display, Size, window } from '@kit.ArkUI';
import Logger from './Logger';
import { camera } from '@kit.CameraKit';

const TAG = 'WindowUtil'

class WindowUtil {
  private static topWindow: window.Window;

  static setTopWindow(topWindow: window.Window) {
    WindowUtil.topWindow = topWindow;
  }

  // Given a ratio, obtain the maximum display width and height based on the screen width and height.
  static getMaxDisplaySize(ratio: number): Size {
    let displaySize: Size = { width: 0, height: 0 };
    try {
      if (!WindowUtil.topWindow) {
        Logger.debug(TAG, `getDisplaySizeByDisplay`);
        return this.getDisplaySizeByDisplay(ratio);
      }
      const width = WindowUtil.topWindow.getWindowProperties().windowRect.width;
      const height = WindowUtil.topWindow.getWindowProperties().windowRect.height;
      const defaultDisplay = display.getDefaultDisplaySync();
      let targetRatio = ratio;
      const rotation = defaultDisplay.rotation * camera.ImageRotation.ROTATION_90;
      if (rotation === camera.ImageRotation.ROTATION_90 || rotation === camera.ImageRotation.ROTATION_270) {
        targetRatio = 1 / targetRatio;
      }
      const screenRatio = height / width;
      if (targetRatio >= screenRatio) {
        displaySize = { width: height / targetRatio, height: height };
      } else {
        displaySize = { width: width, height: width * targetRatio };
      }
      Logger.debug(TAG, `displaySize ${JSON.stringify(displaySize)}`);
    } catch (err) {
      Logger.error(TAG, `getMaxDisplaySize failed, code is ${err.code}, message is ${err.message}`);
    } finally {
      return displaySize;
    }
  }

  static getDisplaySizeByDisplay(ratio: number): Size {
    let defaultDisplay: display.Display | null = null;
    try {
      defaultDisplay = display.getDefaultDisplaySync();
    } catch (exception) {
      Logger.error(TAG, `getDefaultDisplaySync failed, code is ${exception.code}, message is ${exception.message}`);
    }
    //const defaultDisplay: display.Display = display.getDefaultDisplaySync();
    const windowWidth: number = defaultDisplay?.width ?? 0;
    const windowHeight: number = defaultDisplay?.height ?? 0;
    const rotation = (defaultDisplay?.rotation ?? 0) * 90;
    if (rotation === 90 || rotation === 270) {
      ratio = 1 / ratio;
    }
    // Calculate the height based on the screen width.
    const calculatedHeight = windowWidth * ratio;
    if (calculatedHeight <= windowHeight) {
      return {
        width: windowWidth,
        height: calculatedHeight
      };
    } else {
      return {
        width: windowHeight / ratio,
        height: windowHeight
      };
    }
  }
}

export default WindowUtil;