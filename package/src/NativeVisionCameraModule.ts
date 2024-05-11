import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface PhotoFile {
    width: number
    height: number
}

export interface Spec extends TurboModule {
    takePhoto: () => Promise<PhotoFile>;
    focus: () => Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VisionCameraModule');
