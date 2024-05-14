import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { CameraDevice } from './types/CameraDevice';
import { Int32 } from "react-native/Libraries/Types/CodegenTypes";

export interface PhotoFile {
    width: Int32
    height: Int32
}

export type CameraDevicesChangedCallback = (newDevices: CameraDevice[]) => void;
export type CameraDevicesChangedReturn = unknown;

export interface Spec extends TurboModule {
    takePhoto: () => Promise<PhotoFile>;
    focus: () => Promise<void>;
    getAvailableCameraDevices: () => CameraDevice[];
    addCameraDevicesChangedListener: (listener: CameraDevicesChangedCallback) => CameraDevicesChangedReturn ;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VisionCameraModule');
