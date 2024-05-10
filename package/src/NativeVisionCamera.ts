import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { PhotoFile } from './types/PhotoFile';


export interface Spec extends TurboModule {
    takePhoto: () => Promise<PhotoFile>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCVisionCamera');
