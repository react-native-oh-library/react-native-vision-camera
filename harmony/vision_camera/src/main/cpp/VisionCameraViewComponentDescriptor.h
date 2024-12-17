/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */


#ifndef VISION_CAMERA_VIEW_COMPONENT_DESCRIPTOR_H
#define VISION_CAMERA_VIEW_COMPONENT_DESCRIPTOR_H
#pragma once

// This file was generated.

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include "EventEmitters.h"

namespace facebook {
namespace react {

extern const char VisionCameraViewComponentName[] = "VisionCameraView";

class VisionCameraViewProps : public ViewProps {
public:
    VisionCameraViewProps() = default;

    VisionCameraViewProps(const PropsParserContext &context, const VisionCameraViewProps &sourceProps,
                          const RawProps &rawProps)
        : ViewProps(context, sourceProps, rawProps) {}
};

using VisionCameraViewShadowNode =
    ConcreteViewShadowNode<VisionCameraViewComponentName, VisionCameraViewProps, VisionCameraViewEventEmitter>;

class VisionCameraViewComponentDescriptor final : public ConcreteComponentDescriptor<VisionCameraViewShadowNode> {
public:
    VisionCameraViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
        : ConcreteComponentDescriptor(parameters) {}
};

} // namespace react
} // namespace facebook
#endif
