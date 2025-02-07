/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { Orientation } from "./CameraEnumBox"
import { Permissions } from '@kit.AbilityKit';
import { ErrorWithCause } from '../types/CameraError';

export interface Point {
  x: number;
  y: number;
}


export interface TakePhotoOptions {

  flash?: 'on' | 'off' | 'auto'

  enableAutoRedEyeReduction?: boolean

  enableAutoDistortionCorrection?: boolean

  enableShutterSound?: boolean
}

export interface PhotoFile {

  width: number

  height: number

  isRawPhoto: boolean

  orientation: Orientation

  isMirrored: boolean
  thumbnail?: Record<string, unknown>

  path: string
}

export interface ScanResult {
  codes: Code[]
  frame: CodeScannerFrame
}

export interface Code {
  type: string
  value?: string
  corners?: Point[]
  frame?: Frame
}

export interface CodeScannerFrame {
  width: number
  height: number
}

export interface Frame {
  x: number
  y: number
  width: number
  height: number
}

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface CodeScanner {
  codeTypes: CodeType[]
  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void
}

export const PermissionArray: Array<Permissions> = [
  'ohos.permission.CAMERA',
  'ohos.permission.MICROPHONE',
  'ohos.permission.APPROXIMATELY_LOCATION'
];

export type CameraPermissionStatus = 'granted' | 'not-determined' | 'denied' | 'restricted'

export interface ScanRect {
  width: number,
  height: number
}

export type CameraPermissionRequestResult = 'granted' | 'denied'

export type CodeType =
| 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'upc-a'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'

export interface OnErrorEvent {
  code: string
  message: string
  cause?: ErrorWithCause
}