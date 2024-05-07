import type { ViewProps } from "react-native/Libraries/Components/View/ViewPropTypes";;
import type { HostComponent } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export interface NativeProps extends ViewProps {
  fps?: number;
}

export default codegenNativeComponent<NativeProps>(
  "RTNVisionCamera"
) as HostComponent<NativeProps>;