// @flow

export const truncate = (string: string, len: number = 100) => {
  if (string.length > len) return string.substring(0, len) + '...';
  else return string;
};
