/*
 * MIT License
 *
 * Copyright (C) Huawei Technologies Co.,Ltd. 2024. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
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
