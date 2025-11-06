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

import { sensor } from '@kit.SensorServiceKit';
import { Decimal } from '@kit.ArkTS';
import Logger from '../utils/Logger';

const TAG: string = 'GravityUtils';

export class GravityUtils {
  public static availableDeviceDegree: number = 0;

  /**
   * Obtain device data from gravity sensors
   * @returns
   */
  public static async registerGravity() {
    let data: sensor.Sensor[] = [];
    try {
      data = await sensor.getSensorList();
    } catch (err) {
      Logger.error(TAG,`registerGravity Device get sensor list error, ${JSON.stringify(err)}`);
      return;
    }
    for (let i = 0; i < data.length; i++) {
      if (data[i].sensorId === sensor.SensorId.GRAVITY) {
        sensor.on(sensor.SensorId.GRAVITY, GravityUtils.gravityCallback);
        break;
      }
      if (data[i].sensorId === sensor.SensorId.ACCELEROMETER) {
        sensor.on(sensor.SensorId.ACCELEROMETER, GravityUtils.gravityCallback);
        break;
      }
    }
  }

  /**
   * Obtain device data from gravity sensors
   * @returns
   */
  public static async unRegisterGravity() {
    let data: sensor.Sensor[] = [];
    try {
      data = await sensor.getSensorList();
    } catch (err) {
      Logger.error(TAG, `unRegisterGravity Device get sensor list error, ${JSON.stringify(err)}`);
      return;
    }
    for (let i = 0; i < data.length; i++) {
      if (data[i].sensorId === sensor.SensorId.GRAVITY) {
        sensor.off(sensor.SensorId.GRAVITY);
        break;
      }
      if (data[i].sensorId === sensor.SensorId.ACCELEROMETER) {
        sensor.off(sensor.SensorId.ACCELEROMETER);
        break;
      }
    }
  }

  static gravityCallback = (data: sensor.GravityResponse) => {
    const currentDeviceDegree = getRealData(data);
    GravityUtils.availableDeviceDegree =
      currentDeviceDegree === 0 ? GravityUtils.availableDeviceDegree : currentDeviceDegree;
  }
}

/**
 * Obtain device degree by sensor data
 * @param data
 * @returns
 */
function getRealData(data: sensor.GravityResponse): number {
  let getDeviceDegree: number = 0;
  let x = data.x;
  let y = data.y;
  let z = data.z;
  if ((x * x + y * y) * 3 < z * z) {
    return getDeviceDegree;
  } else {
    let sd: Decimal = Decimal.atan2(y, -x);
    let sc: Decimal = Decimal.round(Number(sd) / 3.141592653589 * 180)
    getDeviceDegree = 90 - Number(sc);
    getDeviceDegree = getDeviceDegree >= 0 ? getDeviceDegree % 360 : getDeviceDegree % 360 + 360;
  }
  return getDeviceDegree;
}

/**
 * Obtain device data from gravity sensors
 * @returns
 */
export async function getGravity(): Promise<number> {
  let data: sensor.Sensor[] = [];
  try {
    data = await sensor.getSensorList();
  } catch (err) {
    Logger.error(TAG, `getGravity Device get sensor list error, ${JSON.stringify(err)}`);
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i].sensorId === sensor.SensorId.GRAVITY) {
      return new Promise((resolve) => {
        sensor.once(sensor.SensorId.GRAVITY, (data: sensor.GravityResponse) => {
          resolve(getRealData(data));
        });
      })
    }
    if (data[i].sensorId === sensor.SensorId.ACCELEROMETER) {
      return new Promise((resolve) => {
        sensor.once(sensor.SensorId.ACCELEROMETER, (data: sensor.AccelerometerResponse) => {
          resolve(getRealData(data as sensor.GravityResponse));
        });
      })
    }
  }

  return 0;
}