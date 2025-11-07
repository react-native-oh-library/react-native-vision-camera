/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CameraCaptureError } from '../type/CameraError'
import type { TemporaryFile } from './TemporaryFile'

export interface RecordVideoOptions {
  flash?: 'on' | 'off'
  fileType?: 'mov' | 'mp4'
  path?: string
  onRecordingError: (error: CameraCaptureError) => void
  onRecordingFinished: (video: VideoFile) => void
  videoCodec?: 'h264' | 'h265'
  videoBitRate?: 'extra-low' | 'low' | 'normal' | 'high' | 'extra-high' | number
}

export interface VideoFile extends TemporaryFile {
  duration: number
  width: number
  height: number
}
