import {
  RNComponentContext,
  RNViewBase,
  Tag
} from '@rnoh/react-native-openharmony';
// import codegen 生成的内容
import { RNC } from "@rnoh/react-native-openharmony/generated";
import CameraViewPage from './pages/CameraViewPage';


@Component
export struct VisionCameraView {
  public static readonly NAME = RNC.VisionCameraView.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: RNC.VisionCameraView.DescriptorWrapper = {} as RNC.VisionCameraView.DescriptorWrapper
  private eventEmitter: RNC.VisionCameraView.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []
  @State propertyArr: Array<string> = [];
  @State private childrenTags: Tag[] = []

  aboutToAppear() {
    this.eventEmitter = new RNC.VisionCameraView.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<RNC.VisionCameraView.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as RNC.VisionCameraView.DescriptorWrapper)
      }
    ))

    const props = this.descriptorWrapper.props
    console.log(`FG 1.1 ${JSON.stringify(props)}`)
    this.propertyArr = Object.entries(props).map((item: Array<string>) => `${item[0]}: ${item[1]}`)
    console.log(`FG 2 ${this.propertyArr}`)
    console.log(`FG 3 ${JSON.stringify(this.descriptorWrapper)}`)
  }

  private onDescriptorWrapperChange(descriptorWrapper: RNC.VisionCameraView.DescriptorWrapper) {
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
        Text("====VisionCameraView props start====").fontSize(12)
        Text(JSON.stringify(this.descriptorWrapper.props)).fontSize(12)
        Text("====VisionCameraView props end====").fontSize(12).height('100px')
        Text("===================================").fontSize(12)
        CameraViewPage().height('1200px').width('1200px')
      }
      .backgroundColor('green')
      .height('2500px')
    }
  }
}