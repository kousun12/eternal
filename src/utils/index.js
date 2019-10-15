// @flow

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
