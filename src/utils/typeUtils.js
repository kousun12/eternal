// @flow
import type { AttributeType } from 'models/AttributeType';

export const arrayOf = (type: AttributeType) =>
  window.Types.any.aliased(`${type.name}[]`, `An array of ${type.name}s`);
