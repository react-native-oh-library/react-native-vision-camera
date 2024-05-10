/**
 * VC坐标系(x,y)-> OH坐标系(x/w,y/h)
 * vision-camera：这应该与相机视图的坐标系相关，并以点表示。(0, 0) 表示左上角，(CameraView.width, CameraView.height) 表示右下角。请确保该值不超过 CameraView 的尺寸
 * harmony：焦点应在0-1坐标系内，该坐标系左上角为{0，0}，右下角为{1，1}
 */
export interface Point {
    x: number;
    y: number;
}

export interface ScanResult {
    codes: Code[]
    frame: CodeScannerFrame
}

export interface Code {
    type: string
    value?: string
    corners?: Point[]
    frame?: Frame
}

export interface CodeScannerFrame {
    width: number
    height: number
}

export interface Frame {
    x: number
    y: number
    width: number
    height: number
}

export interface Rect {
    left: number
    top: number
    right: number
    bottom: number
}