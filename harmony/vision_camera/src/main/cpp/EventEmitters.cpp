/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

#include "EventEmitters.h"

namespace facebook {
namespace react {

void VisionCameraViewEventEmitter::onInitialized(OnInitialized event) const {
    dispatchEvent("initialized", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        return payload;
    });
}

} // namespace react
} // namespace facebook
