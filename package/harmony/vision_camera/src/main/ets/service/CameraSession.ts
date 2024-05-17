import camera from '@ohos.multimedia.camera';
import Logger from '../utils/Logger';
import { PhotoFile, Point, TakePhotoOptions } from '../core/CameraConfig';
import { media } from '@kit.MediaKit';
import { Context } from '@kit.AbilityKit';
import image from '@ohos.multimedia.image';
import { BusinessError } from '@ohos.base';
import fs from '@ohos.file.fs';

import PhotoAccessHelper from '@ohos.file.photoAccessHelper';
import { display } from '@kit.ArkUI';
import { dataSharePredicates } from '@kit.ArkData';
declare function getContext(component?: Object | undefined): Context;

const TAG: string = 'CameraSession:'

export default class CameraSession {
  context: Context = undefined;
  private cameraManager?: camera.CameraManager;
  private camerasArray?: Array<camera.CameraDevice>;
  private cameraInput?: camera.CameraInput;
  private mediaModel: camera.SceneMode = camera.SceneMode.NORMAL_PHOTO;
  private capability?: camera.CameraOutputCapability;
  private localDisplay?: display.Display;
  rect = {
    surfaceWidth: 1216, surfaceHeight: 2224
  };

  private photoSession?: camera.PhotoSession;

  private previewOutput: camera.PreviewOutput = undefined;
  private photoOutPut?: camera.PhotoOutput;
  private cameraSession?: camera.Session;
  private videoOutput?: camera.VideoOutput;

  private photoProfile?: camera.Profile;
  private takingPhoto: boolean = false;

  private videoSession?: camera.PhotoSession;
  // private fileAsset?: mediaLibrary.FileAsset;
  // private avRecorder: media.AVRecorder;
  // private receiver: image.ImageReceiver;
  private photoPath: string = '';
  private fd: number = -1;
  private takePictureHandle: (photoUri: string) => void;


  // private videoFrameWH: VideoFrameWH = {
  //   width: 480,
  //   height: 360,
  // }; // 视频分辨率
  private imageRotation: camera.ImageRotation = camera.ImageRotation.ROTATION_0;
  // 图片旋转角度

  private videoProfile: media.AVRecorderProfile = {
    audioChannels: 2,
    audioCodec: media.CodecMimeType.AUDIO_AAC,
    audioBitrate: 48000,
    audioSampleRate: 48000,
    fileFormat: media.ContainerFormatType.CFT_MPEG_4,
    videoBitrate: 48000,
    videoCodec: media.CodecMimeType.VIDEO_MPEG4,
    videoFrameWidth: 480,
    videoFrameHeight: 360,
    videoFrameRate: 30,
  };
  private videoSourceType: number = 0;

  constructor() {
    this.context = getContext(this);
    this.localDisplay = display.getDefaultDisplaySync();
    if (this.localDisplay) {
      Logger.info(TAG, `localDisplay: ${JSON.stringify(this.localDisplay)}`);
      let previewSize = {
        surfaceWidth: this.localDisplay.width, surfaceHeight: this.localDisplay.height
      }
      this.rect = previewSize;
    }

    try {
      Logger.info(TAG, 'getCameraManager try begin');
      this.cameraManager = camera.getCameraManager(this.context);
      Logger.info(TAG, 'getCameraManager try end');
    } catch (e) {
      Logger.info(TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  /**
   * 初始化相机
   * @param surfaceId
   */
  async initCamera(surfaceId: string): Promise<void> {
    Logger.info(TAG, `initCamera surfaceId:${surfaceId}`);
    if (!this.cameraManager) {
      Logger.error(TAG, 'initCamera check cameraManager is empty');
      return;
    }
    this.camerasArray = this.getAvailableCameraDevices();
    let mCamera = this.camerasArray[0];
    Logger.info(TAG, `initCamera cameraDevice: ${JSON.stringify(mCamera)}`);
    this.cameraInput = this.cameraManager.createCameraInput(mCamera);
    this.cameraInput.open();
    Logger.info(TAG, 'initCamera createCameraInput');
    this.capability = this.cameraManager.getSupportedOutputCapability(mCamera, this.mediaModel);
    let previewProfile = this.capability.previewProfiles[0];
    Logger.info(TAG, 'initCamera createCameraInput');
    this.previewOutput = this.cameraManager.createPreviewOutput(previewProfile, surfaceId);
    Logger.info(TAG, 'initCamera createPreviewOutput');

    this.cameraSession = this.cameraManager.createSession(this.mediaModel);
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      Logger.info(TAG, `initCamera photo branch`);
      this.photoProfile = this.capability.photoProfiles[this.capability.photoProfiles.length-1];
      Logger.info(TAG, `initCamera createCaptureSession: photoProfile,size: ${JSON.stringify(this.photoProfile.size)}`);
      this.photoOutPut = this.cameraManager.createPhotoOutput(this.photoProfile);
      this.photoSession = this.cameraSession as camera.PhotoSession;
      Logger.info(TAG, 'initCamera cameraSession');
      this.cameraSession.beginConfig();
      Logger.info(TAG, 'beginConfig');
      this.cameraSession.addInput(this.cameraInput);
      this.cameraSession.addOutput(this.previewOutput);
      this.cameraSession.addOutput(this.photoOutPut);
      await this.cameraSession.commitConfig();
      await this.cameraSession.start();
      this.setPhotoOutputCb(this.photoOutPut);
      this.focus(undefined);
    } else {
      Logger.info(TAG, `initCamera video branch`);
      // output
      this.videoSession = this.cameraSession as camera.VideoSession;
      // videoSession.addXX
      // videooutputCb
    }
    Logger.info(TAG, 'cameraSession start');
  }

  /**
   * 相机输出能力
   */
  getSupportedOutputCapability(cameraDevice: camera.CameraDevice,
    cameraManager: camera.CameraManager): camera.CameraOutputCapability {
    let cameraOutputCapability: camera.CameraOutputCapability =
      cameraManager.getSupportedOutputCapability(cameraDevice, this.mediaModel);
    return cameraOutputCapability;
  }

  /**
   * 资源释放
   */
  async cameraRelease() {
    Logger.info(TAG, 'releaseCamera');
    if (this.cameraInput) {
      await this.cameraInput.close();
    }
    if (this.previewOutput) {
      await this.previewOutput.release();
    }
    if (this.photoOutPut) {
      await this.photoOutPut.release();
    }
    if (this.videoOutput) {
      await this.videoOutput.release();
    }
    if (this.cameraSession) {
      await this.cameraSession.release();
    }
  }

  async savePicture(buffer: ArrayBuffer, img: image.Image): Promise<void> {
    Logger.info(TAG, 'savePicture start');
    let photoAccessHelper: PhotoAccessHelper.PhotoAccessHelper = PhotoAccessHelper.getPhotoAccessHelper(this.context);
    let options: PhotoAccessHelper.CreateOptions = {
      title: Date.now().toString()
    };
    let photoUri: string = await photoAccessHelper.createAsset(PhotoAccessHelper.PhotoType.IMAGE, 'jpg', options);
    Logger.info(TAG, `savePicture photoUri: ${photoUri}`);
    this.photoPath = photoUri;
    //createAsset的调用需要ohos.permission.READ_IMAGEVIDEO和ohos.permission.WRITE_IMAGEVIDEO的权限
    let file: fs.File = fs.openSync(photoUri, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    await fs.write(file.fd, buffer);
    fs.closeSync(file);
    img.release();
    Logger.info(TAG, 'savePicture end');
  }

  setPhotoOutputCb(photoOutput: camera.PhotoOutput): void {
    Logger.info(TAG, 'setPhotoOutputCb end');
    //设置回调之后，调用photoOutput的capture方法，就会将拍照的buffer回传到回调中
    photoOutput.on('photoAvailable', (errCode: BusinessError, photo: camera.Photo): void => {
      Logger.info(TAG, 'setPhotoOutputCb getPhoto start');
      Logger.info(`err: ${JSON.stringify(errCode)}`);
      if (errCode || photo === undefined) {
        Logger.error(TAG, 'setPhotoOutputCb getPhoto failed');
        return;
      }
      let imageObj = photo.main;
      imageObj.getComponent(image.ComponentType.JPEG, (errCode: BusinessError, component: image.Component): void => {
        Logger.info(TAG, 'setPhotoOutputCb getComponent start');
        if (errCode || component === undefined) {
          Logger.error(TAG, 'setPhotoOutputCb getComponent failed');
          return;
        }
        let buffer: ArrayBuffer;
        if (component.byteBuffer) {
          buffer = component.byteBuffer;
        } else {
          Logger.error(TAG, 'setPhotoOutputCb byteBuffer is null');
          return;
        }
        this.savePicture(buffer, imageObj);
      });
    });
  }

  /**
   * 参数配置
   */
  focus(rnPoint: Point) {
    let status: boolean = false;
    Logger.info(TAG, `The focus method start`);
    try {
      status = this.photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO);
    } catch (error) {
      // 失败返回错误码error.code并处理
      let err = error as BusinessError;
      Logger.error(TAG, `The focus isFocusModeSupported call failed. error code: ${err.code}`);
      return;
    }
    if (status) {
      Logger.info(TAG, `The focus isFocusModeSupported status: ${status}`);
      // 指定焦点时设置焦点
      if (rnPoint) {
        Logger.info(TAG, `The focus rnPoint: ${JSON.stringify(rnPoint)}`);
        try {
          this.photoSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
        let ohPoint = this.convertPoint(rnPoint);
        Logger.info(TAG, `The focus ohPoint: ${JSON.stringify(ohPoint)}`);
        try {
          this.photoSession.setFocusPoint(ohPoint);
          Logger.info(TAG, `The focus ohPoint success`);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusPoint call failed. error code: ${err.code}`);
        }
      } else {
        // 没有指定焦点时设置自动对焦
        Logger.info(TAG, `The focus setFocusMode: auto`);
        try {
          this.photoSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
      }
    }
  }

  /**
   * 转换为鸿蒙Point坐标
   * VC坐标系(x,y)-> OH坐标系(x/w,y/h)
   * @param rnPoint
   * @returns
   */
  convertPoint(rnPoint: Point): Point {
    let ohPoint: Point = {
      x: 0, y: 0
    }
    if (rnPoint) {
      ohPoint.x = rnPoint.x / this.rect.surfaceWidth;
      ohPoint.y = rnPoint.y / this.rect.surfaceHeight;
    }
    return ohPoint;
  }

  /**
   * 拍照
   */
  async taskPhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    Logger.info(TAG, 'taskPhone to capture the photo ');
    this.takingPhoto = true;
    if (options && this.photoSession.hasFlash()) {
      if (options.flash === 'on' && this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_OPEN)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_OPEN);
      } else if (options.flash === 'off' &&
      this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      } else if (options.flash === 'auto' &&
      this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_AUTO)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_AUTO);
      }
    }
    try {
      await this.photoOutPut.capture();
    } catch (error) {
      this.takingPhoto = false;
      Logger.error(TAG, `Failed to capture error: ${error.message}`);
      return;
    }
    Logger.info(TAG, `photoOutPut.capture success`);
    await this.waitForPathResult();
    let thumbnail = await this.getThumbnail();
    let photoFile: PhotoFile = {} as PhotoFile;
    photoFile.width = this.photoProfile?.size.width;
    photoFile.height = this.photoProfile?.size.height;
    photoFile.path = this.photoPath;
    photoFile.isRawPhoto = false;
    photoFile.thumbnail = thumbnail;
    Logger.info(TAG, `taskPhoto photoFile:${JSON.stringify(photoFile)}`);

    this.takingPhoto = false;
    this.photoPath = '';
    return photoFile;
  }
  /**
   * 获取缩略图
   * @returns
   */
  async getThumbnail(): Promise<Record<string, image.ImageInfo>> {
    Logger.info(TAG, `getThumbnail start`);
    let fileName = this.photoPath.substring(this.photoPath.lastIndexOf('/') + 1);
    Logger.info(TAG, `getThumbnail fileName: ${fileName}`);
    let predicates: dataSharePredicates.DataSharePredicates = new dataSharePredicates.DataSharePredicates();
    let fetchOption: PhotoAccessHelper.FetchOptions = {
      fetchColumns: [PhotoAccessHelper.PhotoKeys.URI, PhotoAccessHelper.PhotoKeys.PHOTO_TYPE,
        PhotoAccessHelper.PhotoKeys.SIZE, PhotoAccessHelper.PhotoKeys.DATE_ADDED],
      predicates: predicates.equalTo(PhotoAccessHelper.PhotoKeys.DISPLAY_NAME, fileName)
    };
    let photoAccessHelper: PhotoAccessHelper.PhotoAccessHelper = PhotoAccessHelper.getPhotoAccessHelper(this.context);
    let fetchResult: PhotoAccessHelper.FetchResult<PhotoAccessHelper.PhotoAsset> =
      await photoAccessHelper.getAssets(fetchOption);
    let asset: PhotoAccessHelper.PhotoAsset = await fetchResult.getFirstObject();
    Logger.info(TAG, `getThumbnail asset ${JSON.stringify(asset.uri)}`);
    Logger.info(TAG, `getThumbnail asset ${JSON.stringify(asset.displayName)}`);
    let size: image.Size = {
      width: 720, height: 720
    };
    let pixelMap = await asset?.getThumbnail(size);
    let imageInfo: image.ImageInfo = await pixelMap?.getImageInfo()
    let result: Record<string, image.ImageInfo> = {
      [fileName]: imageInfo
    }
    Logger.info(TAG, `getThumbnail result ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * 等待path的值被设置
   * @returns
   */
  private waitForPathResult(): Promise<void> {
    Logger.info(TAG, 'waitForPathResult start');
    return new Promise(resolve => {
      const intervalId = setInterval(() => {
        if (this.photoPath !== '') {
          clearInterval(intervalId);
          Logger.info(TAG, 'waitForPathResult clearInterval');
          resolve();
        }
      }, 100);
    })
  }


  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): Array<camera.CameraDevice> {
    Logger.info(TAG, 'getAvailableCameraDevices start');
    let camerasArray = this.cameraManager?.getSupportedCameras();
    if (!camerasArray) {
      Logger.error(TAG, 'getAvailableCameraDevices cannot get cameras');
      return;
    }
    Logger.info(TAG, `getAvailableCameraDevices get cameras ${camerasArray.length}`);
    return camerasArray;
  }

  // 开始录像
  // 停止录像
  // 暂停录像
  // 恢复录像
}