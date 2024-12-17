/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { useEffect, useState } from 'react'
import { CameraDevice } from '../types/CameraDevice'
import NativeVisionCameraModule from '../NativeVisionCameraModule'
import { DeviceEventEmitter } from 'react-native';

export function useCameraDevices(): CameraDevice[] {
    const [devices, setDevices] = useState(() => NativeVisionCameraModule.getAvailableCameraDevices())

    useEffect(() => {
        const onCameraDevicesChangeListener = DeviceEventEmitter.addListener('onCameraDevicesChange', (newDevices: CameraDevice[]) => {
            setDevices(newDevices)
        });
        return () => onCameraDevicesChangeListener.remove()
    }, [])

    return devices
}