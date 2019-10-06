// @flow

import React from 'react';
import { Button, Classes, Dialog } from '@blueprintjs/core';

type P = { title: string, onClose: () => void, load: () => void };
const btnTxt = '👾 ok computer';
export default ({ title, onClose, load }: P) => (
  <Dialog
    canOutsideClickClose={false}
    isOpen={Boolean(title)}
    className="bp3-dark"
    title="Load..."
    onClose={onClose}
  >
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_BODY}>
        <p>you are about to load the example</p>
        <p>~{title}~</p>
      </div>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button onClick={load}>{btnTxt}</Button>
      </div>
    </div>
  </Dialog>
);
