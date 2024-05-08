import camera from '@ohos.multimedia.camera';
import { BusinessError } from '@ohos.base';
import common from '@ohos.app.ability.common';
import grantPermission from '../utils/PermissionUtils';
import Logger from '../utils/Logger';

const TAG: string = 'CameraViewPage:';

@Component
export default struct CameraViewPage {
  mXComponentController: XComponentController = new XComponentController();
  surfaceId: string = '';
  context: Context = getContext(this);
  cameraInput?: camera.CameraInput;
  photoSession?: camera.PhotoSession;
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };

  build() {
    Flex() {
      XComponent({
        id: 'CameraViewComponent',
        type: 'surface',
        controller: this.mXComponentController
      })
        .onLoad(() => {
          this.mXComponentController.setXComponentSurfaceRect(this.rect);
          this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
        })
        .width('1920px')
        .height('1080px')
    }
  }

  async aboutToAppear() {
    await grantPermission().then(res => {
      Logger.info(TAG, `权限申请成功 ${JSON.stringify(res)}`);
    }).catch((rej: BusinessError) => {
      Logger.info(TAG, `权限申请失败 ${JSON.stringify(rej)}`);
    })
    let cameraManager: camera.CameraManager = camera.getCameraManager(this.context);
    let cameraDevices: Array<camera.CameraDevice> = cameraManager.getSupportedCameras();
    let outputCapability: camera.CameraOutputCapability =
      this.getSupportedOutputCapability(cameraDevices[0], cameraManager);
    let previewOutput = this.getPreviewOutput(cameraManager, outputCapability, this.surfaceId);
    this.getCameraInput(cameraDevices[0], cameraManager);
    this.getPhotoSession(cameraManager);
    if (previewOutput != undefined) {
      this.startPreviewOutput(cameraManager, previewOutput);
    }
  }

  async aboutToDisappear(): Promise<void> {
    if (this.photoSession) {
      await this.photoSession.release()
    }
    if (this.cameraInput) {
      this.cameraInput.close()
    }
  }

  getSupportedOutputCapability(cameraDevice: camera.CameraDevice,
    cameraManager: camera.CameraManager): camera.CameraOutputCapability {
    let cameraOutputCapability: camera.CameraOutputCapability =
      cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_PHOTO);
    return cameraOutputCapability;
  }

  getPreviewOutput(cameraManager: camera.CameraManager, cameraOutputCapability: camera.CameraOutputCapability,
    surfaceId: string): camera.PreviewOutput | undefined {
    let previewProfilesArray: Array<camera.Profile> = cameraOutputCapability.previewProfiles;
    let previewOutput: camera.PreviewOutput | undefined = undefined;
    try {
      previewOutput = cameraManager.createPreviewOutput(previewProfilesArray[0], surfaceId);
    } catch (error) {
      let err = error as BusinessError;
      console.error("Failed to create the PreviewOutput instance. error code: " + err.code);
    }
    return previewOutput;
  }

  getCameraInput(camera: camera.CameraDevice, cameraManager: camera.CameraManager) {
    this.cameraInput = cameraManager.createCameraInput(camera);
    if (this.cameraInput === undefined) {
      console.error('cameraInput is undefined');
    }
  }

  getPhotoSession(cameraManager: camera.CameraManager) {
    this.photoSession = cameraManager.createSession(camera.SceneMode.NORMAL_PHOTO) as camera.PhotoSession;
    if (this.photoSession === undefined) {
      console.error('session is undefined');
    }
  }

  async startPreviewOutput(cameraManager: camera.CameraManager, previewOutput: camera.PreviewOutput): Promise<void> {
    let cameraArray: Array<camera.CameraDevice> = [];
    cameraArray = cameraManager.getSupportedCameras();
    if (cameraArray.length == 0) {
      console.error('no camera.');
      return;
    }
    // 获取支持的模式类型
    let sceneModes: Array<camera.SceneMode> = cameraManager.getSupportedSceneModes(cameraArray[0]);
    let isSupportPhotoMode: boolean = sceneModes.indexOf(camera.SceneMode.NORMAL_PHOTO) >= 0;
    if (!isSupportPhotoMode) {
      console.error('photo mode not support');
      return;
    }

    // 打开相机
    if (this.cameraInput && this.photoSession) {
      await this.cameraInput.open();
      this.photoSession.beginConfig();
      this.photoSession.addInput(this.cameraInput);
      this.photoSession.addOutput(previewOutput);
      await this.photoSession.commitConfig();
      await this.photoSession.start();
    }
  }
}

