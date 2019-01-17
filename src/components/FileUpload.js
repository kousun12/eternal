// @flow

import React, { Component } from 'react';
import { get } from 'lodash';
type P = { onFile: File => void };

class FileUpload extends Component<P> {
  fileInput: ?HTMLElement;

  openFileInput = () => {
    this.fileInput && this.fileInput.click();
  };

  _onFile = (event: SyntheticInputEvent<*>) => {
    const file = get(event, ['target', 'files', 0]);
    if (file) {
      this.props.onFile(file);
    }
  };

  render() {
    return (
      <input
        onChange={this._onFile}
        style={{ display: 'none' }}
        ref={input => (this.fileInput = input)}
        type="file"
      />
    );
  }
}

export default FileUpload;
