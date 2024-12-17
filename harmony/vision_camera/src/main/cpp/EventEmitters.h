/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

#ifndef EVENT_EMITTERS_H
#define EVENT_EMITTERS_H
#pragma once

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

class JSI_EXPORT VisionCameraViewEventEmitter : public ViewEventEmitter {
public:
    using ViewEventEmitter::ViewEventEmitter;

    struct OnInitialized {};

    void onInitialized(OnInitialized value) const;
};

} // namespace react
} // namespace facebook
#endif

