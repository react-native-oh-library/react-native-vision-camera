/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import { useMemo } from 'react'
import type { CameraDevice, CameraDeviceFormat } from '../types/CameraDevice'
import type { FormatFilter } from '../devices/getCameraFormat'
import { getCameraFormat } from '../devices/getCameraFormat'

export function useCameraFormat(device: CameraDevice | undefined, filters: FormatFilter[]): CameraDeviceFormat | undefined {
  const format = useMemo(() => {
    if (device == null) return undefined
    return getCameraFormat(device, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, JSON.stringify(filters)])

  return format
}
