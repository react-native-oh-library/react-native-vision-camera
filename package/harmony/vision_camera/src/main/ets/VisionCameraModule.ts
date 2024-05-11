import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"

export class VisionCameraModule extends TurboModule implements TM.VisionCameraModule.Spec {
  takePhoto(): Promise<TM.VisionCameraModule.PhotoFile> {
    throw new Error('Method not implemented.');
  }

  focus(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
