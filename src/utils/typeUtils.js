// @flow
import React from 'react';
import type { AttributeType } from 'models/AttributeType';

export const arrayOf = (type: AttributeType) =>
  window.Types.any.aliased(
    `${type.name}[]`,
    <div>
      <p>An array of {type.name}s</p>
      <p>{type.typeDescription}</p>
    </div>
  );
