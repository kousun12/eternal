// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import type Edge from 'models/Edge';
import * as tf from '@tensorflow/tfjs-core';
import { webgl } from '@tensorflow/tfjs-core';
import { arrayOf } from 'utils/typeUtils';

const Types = window.Types;

const TT = { Program: Types.object.aliased('GPGPUProgram', 'An uncompiled GPGPU program') };
export class GPGPUProgramNode extends NodeBase<
  {},
  { userCode: string, outputShape: ?(number[]), variableNames: string[] },
  { program: webgl.GPGPUProgram }
> {
  static +displayName = 'GPGPU Program';
  static +registryName = 'GPGPUProgram';
  static +defaultProps = { variableNames: [], outputShape: [], userCode: '' };
  static shortNames = { variableNames: 'varNames', outputShape: 'outShape' };
  static description = (
    <span>Define a GPGPU program to be run on your machine's compatible backend</span>
  );
  static schema = {
    input: {
      userCode: Types.string
        .desc(
          <p>
            Your user code for the kernel to be uploaded to your graphics hardware. Syntax is
            specific to your backend, but a good strategy is conforming to the OpenGL/WebGL
            standards that most GPUs will support. In order to set an output to your kernel call{' '}
            <code>setOutput</code> in your kernel's main function. To get the output coords in your
            computation call <code>getOutputCoords</code>.
          </p>
        )
        .aliased('GPGPUKernel', 'An open frameworks compliant shader program'),
      outputShape: arrayOf(Types.number).desc(
        <p>
          A tensor shape describing the kernel output, e.g. <code>[100, 100]</code>. if omitted,
          output shape is assumed to be the same as the input shape
        </p>
      ),
      variableNames: arrayOf(Types.string).desc(
        <p>
          A list of variable names that your kernel will use. This gives you access to functions
          inside your program kernel. i.e. variable named <code>X</code> gives you the methods{' '}
          <code>getXAtOutCoords</code> and <code>getX</code>
        </p>
      ),
    },
    output: {
      program: TT.Program.desc(
        'Program info output. Use the "Run GPGPU" node to compile and run this over inputs'
      ),
    },
    state: {},
  };
  _varNames = [];

  updateProgram = (up: { variableNames?: string[] | string }) => {
    if (up.variableNames) {
      if (Array.isArray(up.variableNames)) {
        this._varNames = up.variableNames;
      } else if (
        typeof up.variableNames === 'string' &&
        !this._varNames.includes(up.variableNames)
      ) {
        this._varNames.push(up.variableNames);
      }
    }
  };

  process = () => ({ program: { ...this.props, variableNames: this._varNames } });

  onInputChange = (edge: Edge, change: Object) => {
    this.updateProgram(change);
    return this.outKeys();
  };
}

export class RunGPGPUProgramNode extends NodeBase<
  {},
  { program: webgl.GPGPUProgram, input: any[] },
  { result: number[] }
> {
  static +displayName = 'Run GPGPU';
  static +registryName = 'RunGPGPUProgram';
  static description = (
    <span>
      Compile and run a GPGPU program. Kernels passed in will be compiled and cached, so that
      subsequent calls to kernels will not create new binaries.
    </span>
  );
  static schema = {
    input: {
      program: TT.Program.desc('The uncompiled program info to be turned into a full WebGL shader'),
      input: arrayOf(Types.any).desc('The input tensor to run through the compiled program kernel'),
    },
    output: { result: arrayOf(Types.any).desc('Program output') },
    state: {},
  };

  process = async () => ({ result: await this._compileAndRun() });

  requireForOutput = () =>
    this.props.program && this.props.program.userCode && Boolean(this.props.input);

  // TODO this can get out of sync, but maybe that is the point
  _compileAndRun = async (): Promise<number[]> => {
    const { program, input } = this.props;
    const i = tf.tensor(input);
    if (program && program.outputShape.length === 0) {
      program.outputShape = i.shape.slice();
    }
    const r = await tf
      .backend()
      .compileAndRun(program, [i])
      .data();
    i.dispose();
    console.log(r);
    return r;
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}
