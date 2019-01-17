// @flow

export function uuid(): string {
  // noinspection SpellCheckingInspection
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function downloadObj(exportObj: Object, exportName: string) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', exportName + '.json');
  // $FlowIssue
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
