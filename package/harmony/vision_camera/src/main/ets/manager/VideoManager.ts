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
import camera from '@ohos.multimedia.camera';
import { VisionCameraViewSpec } from "../view/props/VisionCameraViewSpec";
import Logger from "../utils/Logger";
import { photoAccessHelper } from "@kit.MediaLibraryKit";
import { display, UIContext } from "@kit.ArkUI";
import PreviewViewUtils from "../utils/PreviewViewUtils";
import { media } from "@kit.MediaKit";
import { RecordVideoOptions } from "../datamodel/interface/VideoFile";
import { BusinessError } from "@kit.BasicServicesKit";
import { RNOHContext } from "@rnoh/react-native-openharmony/ts";
import CameraConstants from "../datamodel/constant/CameraConstants";
import { CameraCaptureError } from "../datamodel/type/CameraError";
import fs from '@ohos.file.fs';
import { colorSpaceManager } from "@kit.ArkGraphics2D";
import { CommonManager } from "./CommonManager";
import { Context } from '@ohos.arkui.UIContext';
import fileio from '@ohos.fileio';


export class VideoManager {
  private TAG: string = 'VideoManager';
  private hasAudio: boolean = false;
  phAccessHelper: photoAccessHelper.PhotoAccessHelper = undefined;
  private cameraManager?: camera.CameraManager;
  private cameraInput?: camera.CameraInput;
  private capability?: camera.CameraOutputCapability;
  public previewProfile: camera.Profile = {} as camera.Profile;
  private videoSize: camera.Size = {
    width: 1920,
    height: 1080,
  };
  private videoCodeC: 'h264' | 'h265' = 'h265';
  private uiContext: UIContext;
  private ctx!: RNOHContext;
  private context: Context;
  private previewOutput: camera.PreviewOutput = undefined;
  private videoOutput?: camera.VideoOutput;
  private videoProfile: camera.VideoProfile;
  private videoSession?: camera.VideoSession;
  private avRecorder: media.AVRecorder;
  private currCameraDevice?: camera.CameraDevice;
  public fps: number = 30;
  public videoUri: string;
  // 显示/成像预览比例是否反转，横向时为true
  private isRatioReverted: boolean = false;
  private basicPath: string = '';
  private videoFile: fs.File;
  private previewSurfaceId: string;
  private uphasAudio: boolean = false;
  private currVideoCodec: string = "h265"
  private noPath: number = 13900002;
  private videoStartParams: RecordVideoOptions = {
    onRecordingError: error => {
    },
    onRecordingFinished: video => {
    },
    videoCodec: this.videoCodeC,
  };


  constructor(_ctx: RNOHContext, context_: Context, _uiContext: UIContext,) {
    _ctx && (this.ctx = _ctx);
    this.context = context_;
    this.uiContext = _uiContext;
    this.basicPath = this.context.filesDir;

    try {
      this.cameraManager = camera.getCameraManager(this.context);
    } catch (e) {
      Logger.error(this.TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  getPreviewProfile() {
    return this.previewProfile;
  }

  getRatioReverted() {
    return this.isRatioReverted;
  }

  getCameraManager() {
    return this.cameraManager;
  }

  setAudio(isAudio) {
    if (isAudio !== undefined) {
      this.hasAudio = isAudio;
    }
  }

  async initVideoSession(
    currentDevice: camera.CameraDevice,
    surfaceId: string,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
  ): Promise<camera.VideoSession> {
    this.previewSurfaceId = surfaceId;
    this.setAudio(props.audio);
    Logger.debug(this.TAG,
      "initVideoSession xwidth " + xwidth + '  xheight ' + xheight + ' isFoldable ' + display.isFoldable())
    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_VIDEO);
    if (surfaceId && props.preview) {
      if (!display.isFoldable() || xwidth / xheight == 16 / 9) {
        this.previewProfile = this.capability.previewProfiles.find((profile: camera.Profile) => {
          if (props.videoHdr) {
            return (
              profile.size.width === this.videoSize.width &&
                profile.size.height === this.videoSize.height &&
                profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010
            );
          } else {
            return (
              profile.size.width === this.videoSize.width &&
                profile.size.height === this.videoSize.height &&
                profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP
            );
          }
        });
      } else {
        let previewProfilesArray: camera.Profile[] = this.capability.previewProfiles;
        this.previewProfile =
          PreviewViewUtils.getTargetPreviewProfile(PreviewViewUtils.getTargetRatio(false, this.uiContext),
            previewProfilesArray, xwidth, xheight);
      }
      Logger.debug(this.TAG,
        "initVideoSession previewProfile " + this.previewProfile + " width " + this.previewProfile?.size.width +
          '  height ' + this.previewProfile?.size.height)

      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
      this.registerPreviewFrameListeners();
    }
    if (!display.isFoldable() || xwidth / xheight == 16 / 9) {
      this.videoProfile = this.capability.videoProfiles.find((profile: camera.VideoProfile) => {
        if (props.videoHdr) {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010
          );
        } else {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP
          );
        }
      });
    } else {
      this.setVideoProfile(this.capability, this.previewProfile);
    }
    Logger.debug(this.TAG,
      "initVideoSession videoProfile " + this.videoProfile + " width " + this.videoProfile?.size.width +
        '  height ' + this.videoProfile?.size.height)
    this.videoOutput = await this.recordPrepared(this.videoStartParams, props, xwidth, xheight);
    this.videoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_VIDEO);
    this.videoSession.beginConfig();
    this.videoSession.addInput(this.cameraInput);
    if (surfaceId && this.previewOutput && props.preview) {
      Logger.debug(this.TAG, "initVideoSession videoSession.addOutput previewOutput")
      this.videoSession.addOutput(this.previewOutput);
    }
    if (this.videoOutput) {
      Logger.debug(this.TAG, "initVideoSession videoSession.addOutput videoOutput")
      this.videoSession?.addOutput(this.videoOutput);
    }
    try {
      await this.videoSession.commitConfig();
    } catch (error) {
      Logger.error(this.TAG, `initVideoSession commitConfig ${JSON.stringify(error)}`);
      CommonManager.onError(this.ctx, `initVideoSession commitConfig ${JSON.stringify(error)}`);
    }
    try {
      const isMirror = props.isMirrored;
      Logger.debug(
        this.TAG,
        'initVideoSession isMirrorSupported ' + this.videoOutput?.isMirrorSupported()
      );
      if (this.videoOutput?.isMirrorSupported() && props.device?.position !== undefined && isMirror !== undefined) {
        Logger.debug(this.TAG, 'initVideoSession enableMirror');
        this.videoOutput.enableMirror(props.device.position === 'front' ? !isMirror : isMirror);
      }
    } catch (e) {
      Logger.error(this.TAG, 'Error initVideoSession enableMirror failed');
    }
    //当设置比例1:1时不支持设置防抖动模式，会引起旋转90度
    if (xwidth / xheight !== 1) {
      if (props.videoHdr) {
        await this.setVideoStabilizationMode(true);
      } else {
        await this.setVideoStabilizationMode(false, props.videoStabilizationMode);
      }
    }
    try {
      await this.videoSession.start();
    } catch (e) {
      Logger.error(this.TAG, "Error initVideoSession videoSession.start " + JSON.stringify(e))
    }
    Logger.debug(this.TAG, "initVideoSession videoSession.start")
    this.isRatioReverted = this.setPreviewRotation(props.videoHdr)
    return new Promise((resolve) => {
      resolve(this.videoSession)
    });
  }

  setVideoProfile(cameraOutputCap: camera.CameraOutputCapability, targetProfile: camera.Profile) {
    let videoProfilesArray: camera.VideoProfile[] | undefined = cameraOutputCap?.videoProfiles;
    if (videoProfilesArray?.length) {
      try {
        const displayRatio = targetProfile.size.width / targetProfile.size.height;
        const profileWidth = targetProfile.size.width;
        const videoProfile = videoProfilesArray
          .sort((a, b) => Math.abs(a.size.width - profileWidth) - Math.abs(b.size.width - profileWidth))
          .find(pf => {
            const pfDisplayRatio = pf.size.width / pf.size.height;
            return (
              Math.abs(pfDisplayRatio - displayRatio) <= CameraConstants.PROFILE_DIFFERENCE &&
                pf.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP
            );
          });
        if (!videoProfile) {
          Logger.error(this.TAG, 'Failed to get video profile');
          return;
        }
        this.videoProfile = videoProfile;
      } catch (error) {
        Logger.error(this.TAG, `Failed to createPhotoOutput. error: ${JSON.stringify(error)}`);
      }
    }
  }


  /**
   * @note 录制准备
   * @param options RecordVideoOptions
   * @param props VisionCameraViewSpec.RawProps
   * @returns videoOutput
   */
  async recordPrepared(
    options: RecordVideoOptions,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
  ) {
    if (this.avRecorder) {
      await this.avRecorder.release();
    }
    this.avRecorder = await media.createAVRecorder();
    try {
      await this.avRecorder.prepare(this.prepareAVRecorderConfig(options, props, xwidth, xheight));
    } catch (error) {
      Logger.error(this.TAG, `Error avRecorder prepare ${JSON.stringify(error)}`);
      CommonManager.onError(this.ctx, `Error avRecorder prepare ${JSON.stringify(error)}`);
    }
    let videoSurfaceId = await this.avRecorder.getInputSurface();
    let videoOutput: camera.VideoOutput;
    try {
      videoOutput = this.cameraManager.createVideoOutput(this.videoProfile, videoSurfaceId);
    } catch (error) {
      Logger.error(this.TAG, `recordPrepared createVideoOutput error ${JSON.stringify(error)}`);
      CommonManager.onError(this.ctx, `recordPrepared createVideoOutput error ${JSON.stringify(error)}`);
    }
    return videoOutput;
  }

  /**
   * 配置 AVRecorderConfig
   */
  prepareAVRecorderConfig(
    options: RecordVideoOptions,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
  ): media.AVRecorderConfig {
    if (options.videoCodec) {
      this.currVideoCodec = options.videoCodec;
    }
    this.fps = props.fps || 30;
    let { min: minFps, max: maxFps } = this.videoProfile.frameRateRange;
    if (this.fps > maxFps) {
      this.fps = maxFps;
      CommonManager.onError(this.ctx, 'The fps exceeds the maximum value.');
    } else if (this.fps < minFps) {
      this.fps = minFps;
      CommonManager.onError(this.ctx, 'The fps is lower than the minimum value.');
    }
    Logger.debug(this.TAG,
      "prepareAVRecorderConfig options " + JSON.stringify(options) + " fps " + this.videoProfile.frameRateRange.max)
    let audioConfig = {
      audioChannels: 2,
      audioCodec: media.CodecMimeType.AUDIO_AAC,
      audioBitrate: 48000,
      audioSampleRate: 48000,
    };
    let videoConfig: media.AVRecorderProfile = {
      fileFormat: media.ContainerFormatType.CFT_MPEG_4,
      videoBitrate: 32000000,
      videoCodec: options.videoCodec === 'h265' ? media.CodecMimeType.VIDEO_HEVC : media.CodecMimeType.VIDEO_AVC,
      videoFrameWidth:
      display.isFoldable() && xwidth / xheight != 16 / 9 ? this.videoProfile?.size.width : this.videoSize.width,
      videoFrameHeight:
      display.isFoldable() && xwidth / xheight != 16 / 9 ? this.videoProfile?.size.height : this.videoSize.height,
      videoFrameRate: this.fps,
      //小屏1:1不支持设置isHdr=true，会引起保存不了视频
      isHdr: props.videoHdr && (xwidth / xheight !== 1) ? props.videoHdr : false,
    };
    let videoConfigProfile: media.AVRecorderProfile = this.hasAudio
      ? {
        ...audioConfig,
        ...videoConfig,
      }
      : videoConfig;
    if (options?.path !== undefined) {
      let customVideoPath = this.getDirectorySync(options.path);
      if (customVideoPath == undefined) {
        return;
      }
      this.videoUri = `${customVideoPath}/${Date.parse(new Date().toString())}.${options.fileType || 'mp4'}`;
    } else {
      this.videoUri =
        `${this.basicPath}/video/${Date.parse(new Date().toString())}.${options.fileType || 'mp4'}`;
    }
    this.videoUri = `${this.basicPath}/video/${Date.parse(new Date().toString())}.${
    options.fileType || 'mp4'
    }`;
    this.videoFile = fs.openSync(this.videoUri, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    let aVAudio = {
      audioSourceType: media.AudioSourceType.AUDIO_SOURCE_TYPE_MIC,
    };
    let aVVideo = {
      videoSourceType: media.VideoSourceType.VIDEO_SOURCE_TYPE_SURFACE_YUV,
      profile: videoConfigProfile,
      url: `fd://${this.videoFile.fd.toString()}`, // 文件需先由调用者创建，赋予读写权限，将文件fd传给此参数，eg.fd://45--file:///data/media/01.mp4
      rotation: 90, // 合理值0、90、180、270，非合理值prepare接口将报错
      location: {
        latitude: 30,
        longitude: 130,
      },
    };
    return this.hasAudio
      ? {
        ...aVAudio,
        ...aVVideo,
      }
      : aVVideo;
  }

  /**
   * 设置视频防抖模式
   */
  async setVideoStabilizationMode(isStart: boolean, mode?: string) {
    if (!this.videoSession) {
      return;
    }
    let videoMode = camera.VideoStabilizationMode.AUTO;
    if (mode === 'off') {
      videoMode = camera.VideoStabilizationMode.OFF;
    }
    if (mode === 'standard') {
      videoMode = camera.VideoStabilizationMode.LOW;
    }
    if (mode === 'cinematic') {
      videoMode = camera.VideoStabilizationMode.MIDDLE;
    }
    if (mode === 'cinematic-extended') {
      videoMode = camera.VideoStabilizationMode.HIGH;
    }
    Logger.debug(this.TAG, "setVideoStabilizationMode mode " + mode)
    let isSupported: boolean = false;
    try {
      isSupported = this.videoSession.isVideoStabilizationModeSupported(videoMode);
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(this.TAG, `The isVideoStabilizationModeSupported call failed. error code: ${err.code}`);
    }
    if (isSupported) {
      try {
        this.videoSession.setVideoStabilizationMode(videoMode);
        if (!isStart) {
          await this.videoSession.beginConfig();
          await this.videoSession.commitConfig();
          await this.videoSession.start();
        }
      } catch (error) {
        let err = error as BusinessError;
        Logger.error(this.TAG, `The setVideoStabilizationMode call failed. error code: ${err.code}`);
      }
    } else {
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent(
        'onError',
        new CameraCaptureError(
          'capture/unknown',
          `the device does not support the ${mode} video stabilization mode.`,
        ),
      );
    }
  }

  async hdrChange(props: VisionCameraViewSpec.RawProps, xwidth: number, xheight: number) {
    Logger.debug(this.TAG, "hdrChange start xwidth " + xwidth + " xheight " + xheight)
    if (!display.isFoldable() || xwidth / xheight == 16 / 9) {
      this.previewProfile = this.capability.previewProfiles.find((profile: camera.Profile) => {
        if (props.videoHdr) {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010
          );
        } else {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP
          );
        }
      });
    } else {
      this.previewProfile = PreviewViewUtils.getProfile(
        this.currCameraDevice.cameraOrientation,
        false,
        xwidth / xheight === 1,
      );
    }
    if (!display.isFoldable() || xwidth / xheight == 16 / 9) {
      this.videoProfile = this.capability.videoProfiles.find((profile: camera.VideoProfile) => {
        if (props.videoHdr) {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010
          );
        } else {
          return (
            profile.size.width === this.videoSize.width &&
              profile.size.height === this.videoSize.height &&
              profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP
          );
        }
      });
    } else {
      this.setVideoProfile(this.capability, this.previewProfile);
    }

    Logger.debug(this.TAG,
      "hdrChange previewProfile " + this.previewProfile + " width " + this.previewProfile.size.width +
        "  height " + this.previewProfile.size.height + " videoProfile " + this.videoProfile + " width " +
      this.videoProfile?.size.width + " height " + this.videoProfile?.size.height)

    await this.videoSession?.stop();
    try {
      await this.videoSession?.beginConfig();
      if (this.previewOutput) {
        await this.videoSession?.removeOutput(this.previewOutput);
        this.unregisterPreviewFrameListeners();
        await this.previewOutput.release();
      }
      let localPreviewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.previewSurfaceId);
      this.previewOutput = localPreviewOutput;
      this.registerPreviewFrameListeners();
      await this.videoSession?.addOutput(localPreviewOutput);

      let localVideoOutput = await this.recordPrepared(this.videoStartParams, props, xwidth, xheight);
      if (this.videoOutput) {
        await this.videoSession?.removeOutput(this.videoOutput);
        await this.videoOutput.release();
      }
      this.videoOutput = localVideoOutput;
      await this.videoSession.addOutput(this.videoOutput);
      let colorSpace = props?.videoHdr
        ? colorSpaceManager.ColorSpace.BT2020_HLG_LIMIT
        : colorSpaceManager.ColorSpace.BT709_LIMIT;
      await this.videoSession?.setColorSpace(colorSpace);
      await this.videoSession?.commitConfig();
      let isSupported = await this.videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.AUTO);
      if (isSupported) {
        this.videoSession.setVideoStabilizationMode(camera.VideoStabilizationMode.AUTO);
      }
      await this.videoSession?.start();
    } catch (error) {
      Logger.error(this.TAG, `hdrChange change Output error,${JSON.stringify(error)}`);
    }
  }


  /**
   * @note 开始录制
   * @param options RecordVideoOptions
   * @param props VisionCameraViewSpec.RawProps
   */
  async startRecording(
    options: RecordVideoOptions,
    props: VisionCameraViewSpec.RawProps,
    xwidth: number,
    xheight: number,
    deviceDegree: number,
  ) {
    if (this.avRecorder.state === 'stopped' || this.avRecorder.state === 'idle' ||
      (this.avRecorder.state === 'prepared' && !props.videoHdr &&
        (this.uphasAudio || (this.currVideoCodec !== options.videoCodec)))) {
      try {
        this.uphasAudio = false;
        Logger.debug(this.TAG, "startRecording reset videoCodec " + options.videoCodec)
        await this.avRecorder.reset();
        await this.avRecorder.prepare(this.prepareAVRecorderConfig(options, props, xwidth, xheight));
        let videoSurfaceId = await this.avRecorder.getInputSurface();
        //切换编码格式需要重新设置videoOutPut
        await this.videoSession?.stop();
        this.videoSession?.beginConfig();
        if (this.videoOutput) {
          this.videoSession?.removeOutput(this.videoOutput);
          await this.videoOutput.release();
        }
        this.videoOutput = this.cameraManager.createVideoOutput(this.videoProfile, videoSurfaceId);
        this.videoSession.addOutput(this.videoOutput);
        await this.videoSession?.commitConfig();
        await this.videoSession?.start();
      } catch (error) {
        Logger.error(this.TAG, `restart recording error: ${JSON.stringify(error)}`);
      }
    }
    if (options.fileType && options.fileType !== media.ContainerFormatType.CFT_MPEG_4) {
      CommonManager.onError(this.ctx, 'Video file encapsulation format. Only MP4 is supported.');
    }
    this.setVideoFlashMode(options.flash);

    try {
      // 更新角度
      await this.avRecorder.updateRotation(this.getVideoRotation(this.videoOutput, deviceDegree));
      // 开始录制
      await this.avRecorder.start();
    } catch (error) {
      Logger.error(this.TAG, 'startRecording catch Failed to start recording.' + JSON.stringify(error));
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent(
        'onRecordingError',
        new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'),
      );
    }
    // 启动录像输出流
    this.videoOutput.start((err: BusinessError) => {
      if (err) {
        Logger.error(this.TAG, 'startRecording videoOutput.start Failed to start recording.' + JSON.stringify(err));
        this.ctx &&
        this.ctx.rnInstance.emitDeviceEvent(
          'onRecordingError',
          new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'),
        );
        return;
      }
    });
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    if (this.avRecorder != undefined) {
      if (this.avRecorder.state === 'started' || this.avRecorder.state === 'paused') {
        try {
          // 停止录制
          await this.avRecorder.stop();
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(this.TAG, `stopRecording: Failed to stop the avRecorder. error: ${JSON.stringify(err)}`);
          this.ctx &&
          this.ctx.rnInstance.emitDeviceEvent(
            'onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to stop recording.'),
          );
        }
        // 停止录像输出流
        this.videoOutput.stop((err: BusinessError) => {
          if (err) {
            Logger.error(this.TAG, `stopRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
            this.ctx &&
            this.ctx.rnInstance.emitDeviceEvent(
              'onRecordingError',
              new CameraCaptureError('capture/recording-in-progress', 'Failed to stop recording.'),
            );
            return;
          }
        });
      }
      // 重置
      await this.avRecorder.reset();
      // 此处不要释放录制实例，否则需要重新创建 videoOutput 加入 session里，会导致画面闪断

      if (
        this.videoSession.hasFlash() &&
          this.videoSession.getFlashMode() === camera.FlashMode.FLASH_MODE_ALWAYS_OPEN &&
        this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)
      ) {
        this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      }
    }
  }

  /**
   * 发送录制成功回调事件
   */
  async sendOnRecordingFinishedEvent() {
    let avMetadataExtractor: media.AVMetadataExtractor = await media.createAVMetadataExtractor();
    avMetadataExtractor.fdSrc = {
      fd: this.videoFile.fd,
    };
    let avMetadata: media.AVMetadata;
    try {
      avMetadata = await avMetadataExtractor.fetchMetadata();
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(this.TAG, `avMetadataExtractor fetch error: ${JSON.stringify(err)}`);
    }
    let duration: number = parseInt(avMetadata.duration) / 1000;
    this.ctx &&
    this.ctx.rnInstance.emitDeviceEvent('onRecordingFinished', {
      height: parseInt(avMetadata.videoHeight),
      width: parseInt(avMetadata.videoWidth),
      path: this.videoUri,
      duration: Math.floor(duration),
    });
    // 关闭文件
    fs.closeSync(this.videoFile);
    this.videoFile = undefined;
  }

  /**
   * 暂停录制
   */
  async pauseRecording() {
    if (this.avRecorder != undefined && this.avRecorder.state === 'started') {
      await this.avRecorder.pause();
      this.videoOutput.stop((err: BusinessError) => {
        if (err) {
          Logger.error(this.TAG, `pauseRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
          this.ctx &&
          this.ctx.rnInstance.emitDeviceEvent(
            'onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to stop the video output.'),
          );
          return;
        }
      });
    }
  }

  /**
   * 恢复录制
   */
  async resumeRecording() {
    if (this.avRecorder != undefined && this.avRecorder.state === 'paused') {
      this.videoOutput.start((err: BusinessError) => {
        if (err) {
          Logger.error(this.TAG, `resumeRecording: Failed to start the video output. error: ${JSON.stringify(err)}`);
          this.ctx &&
          this.ctx.rnInstance.emitDeviceEvent(
            'onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to stop the video output.'),
          );
          return;
        }
      });
      await this.avRecorder.resume();
    }
  }

  setVideoFlashMode(mode: string) {
    let hasFlash = this.videoSession.hasFlash();
    if (!hasFlash) {
      CommonManager.onError(this.ctx, 'The device does not support the flash memory.');
    }
    if (mode === 'on' && this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN)) {
      this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN);
    } else if (mode === 'off' && this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
      this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
    }
  }

  getVideoRotation(videoOutput: camera.VideoOutput, deviceDegree: number): camera.ImageRotation {
    let videoRotation: camera.ImageRotation = camera.ImageRotation.ROTATION_0;
    try {
      videoRotation = videoOutput.getVideoRotation(deviceDegree);
      Logger.debug(this.TAG, `getVideoRotation rotation is: ${videoRotation}`);
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(this.TAG, `getVideoRotation: The videoOutput.getVideoRotation call failed. error code: ${err.code}`);
    }
    return videoRotation;
  }

  async previewChange(preview: boolean): Promise<void> {
    if (preview) {
      if (this.previewOutput) {
        this.videoSession?.beginConfig();
        this.videoSession?.addOutput(this.previewOutput);
        await this.videoSession?.commitConfig();
        await this.videoSession?.start();
      } else {
        this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
        this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.previewSurfaceId);
        this.registerPreviewFrameListeners();
        this.videoSession?.beginConfig();
        this.videoSession?.addOutput(this.previewOutput);
        await this.videoSession?.commitConfig();
        await this.videoSession?.start();
      }
    } else {
      if (this.previewOutput) {
        this.videoSession?.beginConfig();
        this.videoSession?.removeOutput(this.previewOutput);
        await this.videoSession?.commitConfig();
        await this.videoSession?.start();
      }
    }
  }

  async cameraRelease() {
    try {
      if (this.cameraInput) {
        await this.cameraInput.close();
        this.cameraInput = undefined;
      }
      if (this.previewOutput) {
        this.unregisterPreviewFrameListeners();
        await this.previewOutput.release();
        this.previewOutput = undefined;
      }
      if (this.videoOutput) {
        await this.videoOutput.release();
        this.videoOutput = undefined;
      }
      if (this.videoSession) {
        await this.videoSession.release();
        this.videoSession = undefined;
      }
      if (this.videoFile && this.videoFile.fd) {
        fs.closeSync(this.videoFile);
      }
      if (this.avRecorder) {
        await this.avRecorder.release();
        this.avRecorder = undefined;
      }
    } catch (error) {
      Logger.error(this.TAG, `releaseCamera end error: ${JSON.stringify(error)}`);
      CommonManager.onError(this.ctx, `releaseCamera end error: ${JSON.stringify(error)}`);
    }
    Logger.debug(this.TAG, `camera released!`);
  }

  getUphasAudio() {
    return this.uphasAudio;
  }

  setUphasAudio(uphasAudio: boolean) {
    this.uphasAudio = uphasAudio;
  }

  getFps(): number {
    return this.fps;
  }

  getVideoUri(): string {
    return this.videoUri;
  }

  setPreviewRotation(videoHdr: boolean): boolean {
    return CommonManager.setPreviewRotation(this.previewOutput, videoHdr)
  }

  /**
   * 拷贝文件
   * @param srcPath
   * @param destPath
   * @returns
   */
  async copyFile(srcPath: string, destPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let srcFd: number = -1;
      let destFd: number = -1;
      const bufferSize: number = 4096;
      const buffer: ArrayBuffer = new ArrayBuffer(bufferSize);

      try {
        srcFd = await fileio.open(srcPath, 0o102, 0o666);
        if (srcFd === -1) {
          throw new Error(`Unable to open the source file: ${srcPath}`);
        }
        destFd = await fileio.open(destPath, 0o102, 0o666);
        if (destFd === -1) {
          throw new Error(`Unable to open the target file: ${destPath}`);
        }
        let bytesRead: number;
        do {
          bytesRead = await fileio.readSync(srcFd, buffer);
          if (bytesRead > 0) {
            const bytesWritten = await fileio.write(destFd, buffer, { length: bytesRead });
            if (bytesWritten !== bytesRead) {
              throw new Error(`Writing the file is incomplete. It was expected to write ${bytesRead} bytes, but actually wrote ${bytesWritten} bytes`);
            }
          }
        } while (bytesRead > 0);
        resolve();
      } catch (err) {
        reject(new Error(`File copy failed: ${err.message}`));
      } finally {
        if (srcFd !== -1) {
          try {
            await fileio.close(srcFd);
          } catch (closeErr) {
            Logger.error(`Failed to close the source file descriptor: ${closeErr.message}`);
          }
        }
        if (destFd !== -1) {
          try {
            await fileio.close(destFd);
          } catch (closeErr) {
            Logger.error(`Failed to close the target file descriptor: ${closeErr.message}`);
          }
        }
      }
    });
  }

  getDirectorySync(path: string | null): string {
    if (path === "") {
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
        'The given path (null) is invalid, or not writable!'));
      return;
    }
    let formattedPath = path;
    formattedPath = formattedPath.replace(/\/+/g, '/');
    if (formattedPath !== '/') {
      formattedPath = formattedPath.replace(/\/$/, '');
    }
    if (!formattedPath.startsWith('/data/storage/el2')) {
      this.ctx &&
      this.ctx ?.rnInstance.emitDeviceEvent('onError', new CameraCaptureError(
        'capture/invalid-path',
        'The given path is invalid, or not writable!'
      ));
      return;
    }
    try {
      fs.statSync(formattedPath);
    } catch (statError) {
      if (statError.code === this.noPath) {
        try {
          fs.mkdirSync(formattedPath);
        } catch (mkdirError) {
          this.ctx &&
          this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
            `The given path (` + formattedPath + `) is invalid, or not writable!`));
          return;
        }
      } else {
        this.ctx &&
        this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/invalid-path',
          `The given path (` + formattedPath + `) is invalid, or not writable!`));
        return;
      }
    }
    return formattedPath;
  }

  // 注册预览帧的监听
  registerPreviewFrameListeners() {
    if (this.previewOutput) {
      this.previewOutput.on('frameStart', (err: BusinessError) => {
        if (err !== undefined && err.code !== 0) {
          console.error(`registerPreviewFrameListeners Callback Error, errorCode: ${err.code}`);
          return;
        }
        this.ctx && this.ctx.rnInstance.emitDeviceEvent('onPreviewStarted', {});
      });
    } else {
      Logger.error(this.TAG, 'previewOutput is not initialized, cannot register frame listeners');
    }
  }

  // 取消预览帧的监听
  unregisterPreviewFrameListeners() {
    if (this.previewOutput) {
      this.previewOutput.off('frameStart');
    } else {
      Logger.error(this.TAG, 'previewOutput is not initialized, cannot unregister frame listeners');
    }
  }
}