/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

#ifndef STATES_H
#define STATES_H
#pragma once

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook {
namespace react {

class VisionCameraViewState {
public:
    VisionCameraViewState() = default;

#ifdef ANDROID
    VisionCameraViewState(VisionCameraViewState const &previousState, folly::dynamic data){};
    folly::dynamic getDynamic() const { return {}; };
    MapBuffer getMapBuffer() const { return MapBufferBuilder::EMPTY(); };
#endif
};

} // namespace react
} // namespace facebook
#endif