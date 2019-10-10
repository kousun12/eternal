// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { webgl } from '@tensorflow/tfjs-core';
import { arrayOf } from 'models/types';

const Types = window.Types;

export class GPGPUProgramNode extends NodeBase<
  {},
  { kernel: string, outputShape: number[], variableNames: string[] },
  { program: webgl.GPGPUProgram }
> {
  static +displayName = 'GPGPU Program';
  static +registryName = 'GPGPUProgram';
  static shortNames = { variableNames: 'varNames', outputShape: 'outShape' };
  static description = (
    <span>Define a GPGPU program to be run on your machine's compatible backend</span>
  );
  static schema = {
    input: {
      kernel: Types.string
        .desc(
          "Your user code for the kernel to be uploaded to your graphics hardware. Syntax is specific to your backend, but a safe bet is conforming to the OpenGL/WebGL standards that your hardware supports. In order to set an output to your kernel call `setOutput` in your kernel's main function. To get the output coords in your computation call `getOutputCoords`."
        )
        .aliased('GPGPUKernel', 'An open frameworks compliant shader program'),
      outputShape: arrayOf(Types.number).desc(
        'A tensor shape describing the kernel output, e.g. [100, 100]'
      ),
      variableNames: arrayOf(Types.string).desc(
        'A list of variable names that your kernel will use. This gives you access to functions inside your program kernel. i.e. variable named X gives you the methods `getXAtOutCoords` and `getX`'
      ),
    },
    output: {
      program: Types.object
        .desc('A WebGL GPGPU program. This is not a compiled binary.')
        .aliased('GPGPUProgram', 'An uncompiled gpgpu program'),
    },
    state: {},
  };

  _program: webgl.GPGPUProgram = { outputShape: [], userCode: '', variableNames: [] };

  updateProgram = (up: {
    outputShape?: number[],
    variableNames?: string[] | string,
    userCode?: string,
  }) => {
    if (up.outputShape) {
      this._program.outputShape = up.outputShape;
    }
    if (up.variableNames) {
      if (Array.isArray(up.variableNames)) {
        this._program.variableNames = up.variableNames;
      } else if (
        typeof up.variableNames === 'string' &&
        !this._program.variableNames.includes(up.variableNames)
      ) {
        this._program.variableNames.push(up.variableNames);
      }
    }
    if (up.userCode) {
      this._program.userCode = up.userCode;
    }
  };

  process = () => ({ program: this._program });

  onInputChange = (edge: Edge, change: Object) => {
    this.updateProgram(change);
    return this.outKeys();
  };
}
