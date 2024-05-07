import React from "react";
import { NativeMethods, ViewProps } from "react-native";
import {NativeProps} from './src/NativeVisionCameraComponent'


interface VisionCameraViewProps extends ViewProps {
    fps?:number
}


export default VisionCamera

