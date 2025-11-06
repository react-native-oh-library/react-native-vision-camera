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

import { curves, display, Size, UIContext } from '@kit.ArkUI';
import { camera } from '@kit.CameraKit';
import Logger from './Logger';
import WindowUtil from './WindowUtil';
import CameraConstants from '../datamodel/constant/CameraConstants'

export enum CameraMode {
  PHOTO,
  VIDEO
}

export declare enum HeightBreakpoint {
  /**
   * Window aspectRatio < 0.8 type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  HEIGHT_SM = 0,
  /**
   * Window aspectRatio >= 0.8 and < 1.2 type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  HEIGHT_MD = 1,
  /**
   * Window aspectRatio >= 1.2 type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  HEIGHT_LG = 2
}

export declare enum WidthBreakpoint {
  /**
   * Window width < 320vp type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  WIDTH_XS = 0,
  /**
   * Window width >= 320vp and < 600vp type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  WIDTH_SM = 1,
  /**
   * Window width >= 600vp and < 840vp type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  WIDTH_MD = 2,
  /**
   * Window width >= 840vp and < 1440vp type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  WIDTH_LG = 3,
  /**
   * Window width >= 1440vp type.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @atomicservice
   * @since 13
   */
  WIDTH_XL = 4
}

const TAG = 'PreviewViewModel';


class PreviewViewUtils {
  static getPreviewRatio(cameraMode: CameraMode, isSmall: boolean) {
    if (isSmall) {
      return 1;
    }
    return cameraMode === CameraMode.PHOTO
      ? CameraConstants.PHOTO_RATIO
      : CameraConstants.VIDEO_RATIO;
  }

  static getProfile: (cameraOrientation: number, isPhoto: boolean, isSmall: boolean) => camera.Profile =
    (cameraOrientation, isPhoto, isSmall) => {
      const displaySize: Size =
        WindowUtil.getMaxDisplaySize(this.getPreviewRatio(isPhoto ? CameraMode.PHOTO : CameraMode.VIDEO, isSmall));
      let displayDefault: display.Display | null = null;
      try {
        displayDefault = display.getDefaultDisplaySync();
      } catch (exception) {
        Logger.error(TAG, `getDefaultDisplaySync failed, code is ${exception.code}, message is ${exception.message}`);
      }
      const displayRotation = (displayDefault?.rotation ?? 0) * 90;
      const isRevert = (cameraOrientation + displayRotation) % 180 !== 0;
      return {
        format: camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP,
        size: {
          height: isRevert ? displaySize.width : displaySize.height,
          width: isRevert ? displaySize.height : displaySize.width
        }
      };
    }


  static getCurrentDisplaySize() {
    const displaySize = display.getDefaultDisplaySync();
    return { width: displaySize.width, height: displaySize.height } as Size;
  }


  static getTargetRatio(isPhoto: boolean, context: UIContext) {
    let previewRatio = isPhoto ? CameraConstants.PHOTO_RATIO : CameraConstants.VIDEO_RATIO;
    const displaySize = this.getCurrentDisplaySize();
    const displayRatio = displaySize.height / displaySize.width;
    let currentWidthBreakpoint: WidthBreakpoint | undefined = context?.getWindowWidthBreakpoint();
    let currentHeightBreakpoint: HeightBreakpoint | undefined = context?.getWindowHeightBreakpoint();
    if (currentWidthBreakpoint === WidthBreakpoint.WIDTH_SM &&
      currentHeightBreakpoint === HeightBreakpoint.HEIGHT_MD && displayRatio >= 0.8 && displayRatio < 1.2) {
      previewRatio = CameraConstants.SMALL_RATIO;
    }
    return previewRatio;
  }


  static getTargetPreviewProfile(targetRatio: number, previewProfilesArray: camera.Profile[],
    xwidth: number, xheight: number) {
    const screenRatio = xheight / xwidth;
    let maxDiff = Number.MAX_VALUE;

    let previewProfile: camera.Profile | undefined = undefined;
    for (let i = 0; i < previewProfilesArray.length; i++) {
      // Preview profile's width is always longer than height
      const profileRatio = previewProfilesArray[i].size.width / previewProfilesArray[i].size.height;
      // Find preview profile with target ratio
      if (profileRatio !== targetRatio) {
        continue;
      }
      // Find profile size closest to window size
      if (screenRatio >= profileRatio) {
        const currDiff = Math.abs(previewProfilesArray[i].size.width - xwidth);
        if (currDiff < maxDiff) {
          previewProfile = previewProfilesArray[i];
          maxDiff = currDiff;
        }
      } else {
        const currDiff = Math.abs(previewProfilesArray[i].size.height - xheight);
        if (currDiff < maxDiff) {
          previewProfile = previewProfilesArray[i];
          maxDiff = currDiff;
        }
      }
    }
    return previewProfile;
  }
}

export default PreviewViewUtils;