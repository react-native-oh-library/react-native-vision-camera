import { useMemo } from 'react'
import { useCameraDevices } from './useCameraDevices'
import { CameraDevice, CameraPosition } from '../types/CameraDevice'
import { DeviceFilter, getCameraDevice } from '../devices/getCameraDevice'

export function useCameraDevice(position: CameraPosition, filter?: DeviceFilter): CameraDevice | undefined {
  const devices = useCameraDevices()

  const device = useMemo(
    () => getCameraDevice(devices, position, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, position, JSON.stringify(filter)],
  )
 
  return device
}
