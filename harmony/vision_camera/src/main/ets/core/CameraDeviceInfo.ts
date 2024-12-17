/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import type {
  AutoFocusSystem,
  VideoStabilizationMode,
  PhysicalCameraDeviceType,
  CameraPosition,
  HardwareLevel,
  Orientation
} from './CameraEnumBox'

export interface CameraDeviceFormat {
  photoHeight: number

  photoWidth: number

  videoHeight: number

  videoWidth: number

  maxISO: number

  minISO: number

  fieldOfView: number

  supportsVideoHdr: boolean

  supportsPhotoHdr: boolean

  supportsDepthCapture: boolean

  minFps: number

  maxFps: number

  autoFocusSystem: AutoFocusSystem

  videoStabilizationModes: VideoStabilizationMode[]
}

export interface CameraDeviceInfo {

  id: string

  physicalDevices: PhysicalCameraDeviceType[]

  position: CameraPosition

  name: string

  hasFlash: boolean

  hasTorch: boolean

  minFocusDistance: number

  isMultiCam: boolean

  minZoom: number

  maxZoom: number

  neutralZoom: number

  minExposure: number

  maxExposure: number

  formats: CameraDeviceFormat[]

  supportsLowLightBoost: boolean

  supportsRawCapture: boolean

  supportsFocus: boolean

  hardwareLevel: HardwareLevel

  sensorOrientation: Orientation
}