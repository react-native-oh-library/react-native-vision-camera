import camera from '@ohos.multimedia.camera';
import Logger from '../utils/Logger';
import { media } from '@kit.MediaKit';
import { Context } from '@kit.AbilityKit';
import image from '@ohos.multimedia.image';
import { BusinessError } from '@ohos.base';
import fs from '@ohos.file.fs';
import PhotoAccessHelper from '@ohos.file.photoAccessHelper';

const TAG: string = 'CameraSession:'

export default class CameraSession {
  context: Context = undefined;
  private cameraManager?: camera.CameraManager;
  private camerasArray?: Array<camera.CameraDevice>;
  private cameraInput?: camera.CameraInput;
  private mediaModel: camera.SceneMode = camera.SceneMode.NORMAL_PHOTO;
  private capability?: camera.CameraOutputCapability;

  photoSession?: camera.PhotoSession;

  private previewOutput: camera.PreviewOutput = undefined;
  private photoOutPut?: camera.PhotoOutput;
  private cameraSession?: camera.Session;
  private videoOutput?: camera.VideoOutput;

  private photoProfile?: camera.Profile;

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

  constructor(context: Context) {
    this.context = context;
    try {
      Logger.info(TAG, 'getCameraManager try begin');
      this.cameraManager = camera.getCameraManager(context);
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
    // await this.cameraRelease();
    Logger.info(TAG, 'getCameraManager begin');

    Logger.info(TAG, 'getCameraManager end');
    Logger.info(TAG, `getCameraManager ${JSON.stringify(this.cameraManager)}`);
    this.camerasArray = this.cameraManager?.getSupportedCameras();
    if (!this.camerasArray) {
      Logger.error(TAG, 'cannot get cameras');
      return;
    }
    Logger.info(TAG, `get cameras ${this.camerasArray.length}`);
    if (!this.cameraManager) {
      Logger.error(TAG, 'initCamera check cameraManager is empty');
      return;
    }
    let mCamera = this.camerasArray[0];
    this.cameraInput = this.cameraManager.createCameraInput(mCamera);
    this.cameraInput.open();
    Logger.info(TAG, 'createCameraInput');
    this.capability = this.cameraManager.getSupportedOutputCapability(mCamera, this.mediaModel);
    let previewProfile = this.capability.previewProfiles[0];
    this.previewOutput = this.cameraManager.createPreviewOutput(previewProfile, surfaceId);
    Logger.info(TAG, 'createPreviewOutput');

    this.photoProfile = this.capability.photoProfiles[0];
    this.photoOutPut = this.cameraManager.createPhotoOutput(this.photoProfile);
    this.cameraSession = this.cameraManager.createSession(this.mediaModel);
    Logger.info(TAG, 'createCaptureSession');
    this.cameraSession.beginConfig();
    Logger.info(TAG, 'beginConfig');
    this.cameraSession.addInput(this.cameraInput);
    this.cameraSession.addOutput(this.previewOutput);
    this.cameraSession.addOutput(this.photoOutPut);
    await this.cameraSession.commitConfig();
    await this.cameraSession.start();
    this.setPhotoOutputCb(this.photoOutPut);
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
      console.info(`err: ${JSON.stringify(errCode)}`);
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

  // 参数配置
  /**
   * 拍照
   */
  taskPhone() {
    Logger.info(TAG, 'taskPhone to capture the photo ');
    let photoCaptureSetting: camera.PhotoCaptureSetting = {
      quality: camera.QualityLevel.QUALITY_LEVEL_HIGH, // 设置图片质量高
      rotation: camera.ImageRotation.ROTATION_0 // 设置图片旋转角度0
    }
    // 使用当前拍照设置进行拍照
    this.photoOutPut.capture(photoCaptureSetting, (err: BusinessError) => {
      if (err) {
        Logger.error(TAG, `Failed to capture error: ${err.message}`);
        return;
      }
      Logger.info(TAG, 'Callback invoked to indicate the photo capture request success.');
    });
  }

  // 开始录像
  // 停止录像
  // 暂停录像
  // 恢复录像
}