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

import { Orientation } from '../enum/CameraEnumBox';
import { Permissions } from '@kit.AbilityKit';
import { ErrorWithCause } from '../type/CameraError';

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
