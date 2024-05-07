import { RNPackage } from '@rnoh/react-native-openharmony/ts';
import type {
  DescriptorWrapperFactoryByDescriptorTypeCtx,
  DescriptorWrapperFactoryByDescriptorType
} from '@rnoh/react-native-openharmony/ts';
import { RNC } from "@rnoh/react-native-openharmony/generated/ts"

export class RTNVisionCameraPackage extends RNPackage {
  createDescriptorWrapperFactoryByDescriptorType(ctx: DescriptorWrapperFactoryByDescriptorTypeCtx): DescriptorWrapperFactoryByDescriptorType {
    return {
      [RNC.RTNVisionCamera.NAME]: (ctx) => new RNC.RTNVisionCamera.DescriptorWrapper(ctx.descriptor)
    }
  }
}
