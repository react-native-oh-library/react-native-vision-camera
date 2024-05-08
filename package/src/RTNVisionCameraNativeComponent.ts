import type { ViewProps } from "react-native/Libraries/Components/View/ViewPropTypes";;
import type { HostComponent } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import { Float, Int32, WithDefault } from "react-native/Libraries/Types/CodegenTypes";
import type { CameraRuntimeError } from './types/CameraError'
import type { CameraDevice } from './types/CameraDevice'
import type { CodeScanner } from './types/CodeScanner'
export interface NativeProps extends ViewProps {
  fps?: WithDefault<Int32, 30>;
  isActive: boolean;
  preview?: WithDefault<boolean, true>;
  device?: CameraDevice;
  resizeMode?: WithDefault<'cover' | 'contain', 'cover'>;
  enableZoomGesture?: WithDefault<boolean, false>;
  codeScanner?: CodeScanner;
  exposure?: WithDefault<Int32, 0>;
  zoom?: WithDefault<Float, 1.0>;
  audio?: WithDefault<boolean, false>;
  torch?: WithDefault<'off' | 'on', 'off'>;
  onStarted?: () => void;
  onStopped?: () => void;
  onInitialized?: () => void;
  onError?: (error: CameraRuntimeError) => void;
}

export default codegenNativeComponent<NativeProps>(
  "RTNVisionCamera"
) as HostComponent<NativeProps>;