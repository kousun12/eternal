// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import * as tf from '@tensorflow/tfjs-core';
import { webgl } from '@tensorflow/tfjs-core';
import { arrayOf } from 'utils/typeUtils';

const Types = window.Types;

const TT = {
  Program: Types.object.aliased('GPGPUProgram', 'An uncompiled GPGPU program'),
};
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
      program: TT.Program.desc(
        'Program info output. Use the "Run GPGPU" node to compile and run this over inputs'
      ),
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

export class RunGPGPUProgramNode extends NodeBase<
  {},
  { program: webgl.GPGPUProgram, input: any[] },
  { result: any }
> {
  static +displayName = 'Run GPGPU';
  static +registryName = 'RunGPGPUProgram';
  static description =
    'Compile and run a GPGPU program. Kernels passed in will be compiled and cached, so that subsequent calls to kernels will not create new binaries.';
  static schema = {
    input: {
      program: TT.Program.desc('The uncompiled program info to be turned into a full WebGL shader'),
      input: arrayOf(Types.any).desc('The input tensor to run through the compiled program kernel'),
    },
    output: { result: Types.any.desc('Program output') },
    state: {},
  };
  _inputQ: any[][] = [];
  _program: ?webgl.GPGPUProgram;
  _result: any;

  process = () => ({ result: this._result });

  _compileAndRun = () => {
    if (!this._program) {
      return;
    }
    this._inputQ.forEach(async input => {
      const r = await tf
        .backend()
        .compileAndRun(this._program, [tf.tensor(input)])
        .data();
      if (r) {
        this._result = r;
        this.notifyOutputs('result');
      }
    });
    this._inputQ = [];
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (edge.toPort === 'program') {
      this._program = change.inDataFor('program');
    } else if (edge.toPort === 'input') {
      this._inputQ.push(edge.inDataFor('input'));
    }
    this._compileAndRun();
    return [];
  };
}
