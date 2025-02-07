/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
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
