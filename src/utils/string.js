// @flow

export const truncate = (string: string, len: number = 100) => {
  if (string.length > len) return string.substring(0, len) + '...';
  else return string;
};

export function uuid(): string {
  // noinspection SpellCheckingInspection
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
