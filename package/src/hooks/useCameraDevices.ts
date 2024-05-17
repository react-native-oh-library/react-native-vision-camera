// import { useEffect, useState } from 'react'
// import { CameraDevice } from '../types/CameraDevice'
// import { CameraDevices } from '../devices/CameraDevices';

// interface RemovableListener {
//     remove: () => void;
// }

// export function useCameraDevices(): CameraDevice[] {
//     const [devices, setDevices] = useState(() => CameraDevices.getAvailableCameraDevices())

//     useEffect(() => {
//         const listener = CameraDevices.addCameraDevicesChangedListener((newDevices: CameraDevice[]) => {
//             setDevices(newDevices)
//         }) as RemovableListener
//         return () => listener.remove()
//     }, [])

//     return devices
// }

import { useEffect, useState } from 'react'
import { CameraDevice } from '../types/CameraDevice'
import NativeVisionCameraModule from '../NativeVisionCameraModule'

interface RemovableListener {
    remove: () => void;
}

export function useCameraDevices(): CameraDevice[] {
    const [devices, setDevices] = useState(() => NativeVisionCameraModule.getAvailableCameraDevices())

    useEffect(() => {
        const listener = NativeVisionCameraModule.addCameraDevicesChangedListener((newDevices: CameraDevice[]) => {
            setDevices(newDevices)
        }) as RemovableListener
        return () => listener.remove()
    }, [])

    return devices
}
