// @flow

import React from 'react';
import { get } from 'lodash';
import { Dialog, Classes, Intent, Button, Label } from '@blueprintjs/core';

type P = { isOpen: boolean, handleClose: () => void, saveFile: string => void, initial: ?string };
type S = { name: string };

export default class SaveDialog extends React.Component<P, S> {
  constructor(props: P) {
    super(props);
    this.state = { name: props.initial || '' };
  }

  _onChange = (e: SyntheticInputEvent<*>) => {
    this.setState({ name: e.target.value });
  };

  _onInputKeyUp = (e: SyntheticInputEvent<*>) => {
    if (get(e, 'key') === 'Enter') {
      this._onSave();
    }
  };

  _onSave = () => {
    this.props.saveFile(this.state.name);
  };

  render() {
    const { handleClose, isOpen } = this.props;
    const { name } = this.state;
    return (
      <Dialog
        className="bp3-dark"
        onClose={handleClose}
        title="Export Graph"
        isOpen={isOpen}
        icon="download"
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Save a serialized version of this graph</p>
          <Label>
            Save As...
            <input
              style={styles.input}
              onKeyUp={this._onInputKeyUp}
              autoFocus
              className={Classes.INPUT}
              type="text"
              placeholder="project1"
              dir="auto"
              onChange={this._onChange}
              value={name}
            />
          </Label>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={handleClose} minimal>
              Cancel
            </Button>
            <Button intent={Intent.PRIMARY} onClick={this._onSave} minimal>
              Download
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }
}

const styles = {
  input: { marginTop: 18 },
};
