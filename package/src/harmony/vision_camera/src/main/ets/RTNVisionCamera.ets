import {
  RNComponentContext,
  RNViewBase,
  Tag
} from '@rnoh/react-native-openharmony';
// import codegen 生成的内容
import { RNC } from "@rnoh/react-native-openharmony/generated";
import CameraViewPage from './core/CameraViewPage';


@Component
export struct RTNVisionCamera {
  public static readonly NAME = RNC.RTNVisionCamera.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: RNC.RTNVisionCamera.DescriptorWrapper = {} as RNC.RTNVisionCamera.DescriptorWrapper
  private eventEmitter: RNC.RTNVisionCamera.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []
  @State propertyArr: Array<string> = [];
  @State private childrenTags: Tag[] = []

  aboutToAppear() {
    this.eventEmitter = new RNC.RTNVisionCamera.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<RNC.RTNVisionCamera.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as RNC.RTNVisionCamera.DescriptorWrapper)
      }
    ))

    const props = this.descriptorWrapper.props
    console.log(`FG 1.1 ${JSON.stringify(props)}`)
    this.propertyArr = Object.entries(props).map((item: Array<string>) => `${item[0]}: ${item[1]}`)
    console.log(`FG 2 ${this.propertyArr}`)
    console.log(`FG 3 ${JSON.stringify(this.descriptorWrapper)}`)
  }

  private onDescriptorWrapperChange(descriptorWrapper: RNC.RTNVisionCamera.DescriptorWrapper) {
    this.descriptorWrapper = descriptorWrapper
    this.childrenTags = descriptorWrapper.childrenTags
  }

  aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
  }

  build() {
    RNViewBase({
      ctx: this.ctx,
      tag: this.tag,
      controlsFocus: false
    }) {
      Column() {
        Text("===================================").fontSize(12)
        Text("===================================").fontSize(12)
        Text("===================================").fontSize(12)
        Text("===================================").fontSize(12)
        Text("====RTNVisionCamera props start====").fontSize(12)
        Text(JSON.stringify(this.descriptorWrapper.props)).fontSize(12)
        Text("====RTNVisionCamera props end====").fontSize(12).height('100px')
        Text("===================================").fontSize(12)
        CameraViewPage().height('1200px').width('1200px')
      }
      .backgroundColor('green')
      .height('2500px')
    }
  }
}