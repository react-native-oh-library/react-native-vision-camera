import { RNPackage } from '@rnoh/react-native-openharmony/ts';
import type {
  DescriptorWrapperFactoryByDescriptorTypeCtx,
  DescriptorWrapperFactoryByDescriptorType
} from '@rnoh/react-native-openharmony/ts';
import { RNC } from "@rnoh/react-native-openharmony/generated/ts"

export class VisionCameraViewPackage extends RNPackage {
  createDescriptorWrapperFactoryByDescriptorType(ctx: DescriptorWrapperFactoryByDescriptorTypeCtx): DescriptorWrapperFactoryByDescriptorType {
    return {
      [RNC.VisionCameraView.NAME]: (ctx) => new RNC.VisionCameraView.DescriptorWrapper(ctx.descriptor)
    }
  }
}
