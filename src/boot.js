// @flow

import Tone, { AudioNode } from 'tone';
import 'models/AttributeType';
import 'models/types';
import 'models/nodes';

window.Tone = Tone;

const nativeConnect = AudioNode.prototype.connect;
const cnt = function(dstNode, inputNum, outputNum) {
  if (dstNode instanceof Tone) {
    Tone.connect(this, dstNode, inputNum, outputNum);
  } else {
    nativeConnect.call(this, dstNode, inputNum, outputNum);
  }
};

AudioNode.connect = cnt;
Tone.AudioNode.connect = cnt;
