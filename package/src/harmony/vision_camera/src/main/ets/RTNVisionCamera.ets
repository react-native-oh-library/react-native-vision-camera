import { RNComponentContext, RNViewBase } from '@rnoh/react-native-openharmony';
// import codegen 生成的内容
import { RNC } from "@rnoh/react-native-openharmony/generated";
import CameraViewPage from "./core/CameraViewPage"

@Component
export struct RTNVisionCamera {

  public static readonly NAME = RNC.RTNVisionCamera.NAME
  public ctx!: RNComponentContext
  public tag: number = 0

  // cameraId: String = null
  // enableDepthData: boolean = false
  // enablePortraitEffectsMatteDelivery: boolean = false
  //
  // // use-cases
  // photo: boolean = false
  // video: boolean = false
  // audio: boolean = false
  // enableFrameProcessor: boolean = false
  // pixelFormat: PixelFormat = PixelFormat.YUV
  // enableLocation: boolean = false
  // preview: boolean = true
  //
  //   // props that require format reconfiguring
  // format: CameraDeviceFormat = null
  // fps: number = null
  // videoStabilizationMode: VideoStabilizationMode = null
  // videoHdr: boolean = false
  // photoHdr: boolean = false
  // photoQualityBalance:QualityBalance = QualityBalance.BALANCED
  // lowLightBoost: boolean = false
  // // other props
  // isActive = false
  // torch: Torch = Torch.OFF
  // zoom: number = 1 // in "factor"
  // exposure: number = 1.0
  // orientation: Orientation = Orientation.PORTRAIT
  // PreviewViewType: PreviewViewType = PreviewViewType.SURFACE_VIEW
  // enableZoomGesture = false
  // resizeMode: ResizeMode = ResizeMode.COVER
  // codeScannerOptions = null
  //
  // // session
  // cameraSession: CameraSession
  // frameProcessor: FrameProcessor = null
  // previewView: PreviewView = null


  @State private descriptorWrapper: RNC.RTNVisionCamera.DescriptorWrapper = {} as RNC.RTNVisionCamera.DescriptorWrapper
  private eventEmitter: RNC.RTNVisionCamera.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []

  aboutToAppear() {
    this.eventEmitter = new RNC.RTNVisionCamera.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<RNC.RTNVisionCamera.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as RNC.RTNVisionCamera.DescriptorWrapper)
      }
    ))
  }

  private onDescriptorWrapperChange(descriptorWrapper: RNC.RTNVisionCamera.DescriptorWrapper) {
    this.descriptorWrapper = descriptorWrapper
  }

  aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
  }

  build() {
    RNViewBase({ ctx: this.ctx, tag: this.tag }) {
      Text(this.descriptorWrapper.props.text)
        .height("100%")
        .width("100%")
        .fontSize(30)
        .textAlign(TextAlign.Center)
      CameraViewPage()
    }
  }
}
