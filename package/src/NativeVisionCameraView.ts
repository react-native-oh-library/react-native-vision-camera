import type { ViewProps } from "react-native/Libraries/Components/View/ViewPropTypes";;
import type { HostComponent } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import { BubblingEventHandler, Float, Int32, WithDefault } from "react-native/Libraries/Types/CodegenTypes";

type Orientation = WithDefault<'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right', 'portrait'>
type AutoFocusSystem = WithDefault<'contrast-detection' | 'phase-detection' | 'none', 'contrast-detection'>
type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';
type CameraPosition = WithDefault<'front' | 'back' | 'external', 'front'>
type PhysicalCameraDeviceType = 'ultra-wide-angle-camera' | 'wide-angle-camera' | 'telephoto-camera'

interface CameraDeviceFormat {
  photoHeight: Int32
  photoWidth: Int32
  videoHeight: Int32
  videoWidth: Int32
  maxISO: Int32
  minISO: Int32
  fieldOfView: Int32
  supportsVideoHdr: boolean
  supportsPhotoHdr: boolean
  supportsDepthCapture: boolean
  minFps: Int32
  maxFps: Int32
  autoFocusSystem?: AutoFocusSystem
  videoStabilizationModes?: WithDefault<ReadonlyArray<VideoStabilizationMode>, null>
}

interface CameraDevice {
  id: string
  physicalDevices?: WithDefault<ReadonlyArray<PhysicalCameraDeviceType>, null>
  position?: CameraPosition
  name: string
  hasFlash: boolean
  hasTorch: boolean
  minFocusDistance: Int32
  isMultiCam: boolean
  minZoom: Float
  maxZoom: Float
  neutralZoom: Float
  minExposure: Float
  maxExposure: Float
  formats: CameraDeviceFormat[]
  supportsLowLightBoost: boolean
  supportsRawCapture: boolean
  supportsFocus: boolean
  hardwareLevel?: WithDefault<'legacy' | 'limited' | 'full', 'legacy'>
  sensorOrientation?: Orientation
}

type CodeType =
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'upc-a'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'

interface CodeScanner {
  codeTypes?: WithDefault<ReadonlyArray<CodeType>, null>;
  // onCodeScanned?: BubblingEventHandler<Readonly<{}>>;
  regionOfInterest?: {
    x: Int32
    y: Int32
    width: Int32
    height: Int32
  }
}

export interface NativeVisionCameraProps extends ViewProps {
  codeScanner?: CodeScanner;
  fps?: WithDefault<Int32, 30>;
  isActive: boolean;
  preview?: WithDefault<boolean, true>;
  device?: CameraDevice;
  resizeMode?: WithDefault<'cover' | 'contain', 'cover'>;
  enableZoomGesture?: WithDefault<boolean, false>;
  exposure?: WithDefault<Int32, 0>;
  zoom?: WithDefault<Float, 1.0>;
  audio?: WithDefault<boolean, false>;
  video?: WithDefault<boolean, false>;
  torch?: WithDefault<'off' | 'on', 'off'>;
  onStarted?: BubblingEventHandler<Readonly<{}>>;
  onStopped?: BubblingEventHandler<Readonly<{}>>;
  onInitialized?: BubblingEventHandler<Readonly<{}>>;
  onError?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeVisionCameraProps>(
  "VisionCameraView"
) as HostComponent<NativeVisionCameraProps>;

