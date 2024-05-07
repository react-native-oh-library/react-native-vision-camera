import type { ViewProps } from "react-native/Libraries/Components/View/ViewPropTypes";;
import type { HostComponent } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import { Int32, WithDefault } from "react-native/Libraries/Types/CodegenTypes";

export interface NativeProps extends ViewProps {
  fps?: WithDefault<Int32, 30>;
  isActive?: WithDefault<boolean, false>;
  preview?: WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>(
  "RTNVisionCamera"
) as HostComponent<NativeProps>;