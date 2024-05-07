import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"

export class VisionCameraModule extends TurboModule implements TM.RTNVisionCamera.Spec {
  add(a: number, b: number): Promise<number> {
    return new Promise((resolve) => resolve(a + b));
  }
}
