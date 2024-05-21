// import { useMemo } from 'react'
// import { useCameraDevices } from './useCameraDevices'
// import {  getCameraDevice } from '../devices/getCameraDevice'
import { DeviceFilter } from '../devices/getCameraDevice'
import { CameraDevice, CameraPosition } from '../types/CameraDevice'

export function useCameraDevice(position: CameraPosition, _filter?: DeviceFilter): CameraDevice | undefined {
  const mockCameraDevice: CameraDevice = {
    id: '',
    physicalDevices: [],
    position: position,
    name: '',
    hasFlash: false,
    hasTorch: false,
    minFocusDistance: 0,
    isMultiCam: false,
    minZoom: 0,
    maxZoom: 0,
    neutralZoom: 0,
    minExposure: 0,
    maxExposure: 0,
    formats: [],
    supportsLowLightBoost: false,
    supportsRawCapture: false,
    supportsFocus: false,
    hardwareLevel: 'legacy',
    sensorOrientation: 'portrait'
  };
  return mockCameraDevice;
  // console.log("useCameraDevice start")
  // const devices = useCameraDevices()
  // console.log("useCameraDevice devices:" + JSON.stringify(devices))
  // console.log("useCameraDevice position:" + position)
  // console.log("useCameraDevice filter:" + filter)

  // const device = useMemo(
  //   () => getCameraDevice(devices, position, filter),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [devices, position, JSON.stringify(filter)],
  // )

  // console.log("useCameraDevice end")
  // return device
}