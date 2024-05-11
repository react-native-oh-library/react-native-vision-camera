import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { PhotoFile } from './types/PhotoFile';
export interface Spec extends TurboModule {
    takePhoto: () => Promise<PhotoFile>;
    focus: () => Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VisionCameraModule');
