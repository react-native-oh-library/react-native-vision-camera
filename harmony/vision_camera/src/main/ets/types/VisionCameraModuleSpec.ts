/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { Tag } from "@rnoh/react-native-openharmony/ts"

export namespace VisionCameraModuleSpec {
  export const NAME = 'VisionCameraModule' as const

  export interface Spec {
    getAvailableCameraDevices(): unknown[];

    addCameraDevicesChangedListener(listener: (newDevices: unknown[]) => void): Object;

    getCameraPermissionStatus(): string;

    requestCameraPermission(): Promise<string>;

    getMicrophonePermissionStatus(): string;

    requestMicrophonePermission(): Promise<string>;

    getLocationPermissionStatus(): string;

    requestLocationPermission(): Promise<string>;

  }
}
