/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
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

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE_RIGHT = 'landscape-right',
  PORTRAIT_UPSIDE_DOWN = 'portrait-upside-down',
  LANDSCAPE_LEFT = 'landscape-left'
}

export enum AutoFocusSystem {
  CONTRAST_DETECTION = 'contrast-detection',
  PHASE_DETECTION = 'phase-detection',
  NONE = 'none'
}

export enum CameraPosition {
  FRONT = 'front',
  BACK = 'back',
  EXTERNAL = 'external'
}

export enum VideoStabilizationMode {
  OFF = 'off',
  STANDARD = 'standard',
  CINEMATIC = 'cinematic',
  CINEMATIC_EXTENDED = 'cinematic-extended',
  AUTO = 'auto'
}

export enum PhysicalCameraDeviceType {
  ULTRA_WIDE_ANGLE_CAMERA = 'ultra-wide-angle-camera',
  WIDE_ANGLE_CAMERA = 'wide-angle-camera',
  TELEPHOTO_CAMERA = 'telephoto-camera'
}

export enum HardwareLevel {
  LEGACY = 'legacy',
  LIMITED = 'limited',
  FULL = 'full'
}

export enum cameraState {
  PHOTO,
  VIDEO,
  SCAN
}
