// @flow
import React from 'react';
import type { Node } from 'react';
import FuzzySearch from 'fuzzy-search';
import { Omnibar, ItemRenderer, type IOmnibarProps } from '@blueprintjs/select';
import { Menu, MenuItem } from '@blueprintjs/core';
import type { GraphSerialization } from 'models/Graph';
import { uuid } from 'helpers';

type T = GraphSerialization;

export const examples = [
  require('models/examples/nude, eternally.json'),
  require('models/examples/in the gardens of eden.json'),
  require('models/examples/platonic plague.json'),
  require('models/examples/the music while the music lasts.json'),
  require('models/examples/stephen wolfram.json'),
  require('models/examples/shaders.json'),
  require('models/examples/wolfram gpu.json'),
  require('models/examples/percept nets.json'),
  require('models/examples/soundfont-midi.json'),
  require('models/examples/soundfont-tone.json'),
  require('models/examples/gpgpu.json'),
  require('models/examples/midi-in.json'),
];

const titleMaxLen = 40;

const renderItem: ItemRenderer<T> = (graph, { handleClick, modifiers }) => {
  return (
    <MenuItem
      className="bp3-dark"
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={graph.description || `${graph.nodes.length} nodes`}
      key={graph.name || uuid()}
      onClick={handleClick}
      text={(graph.name || 'untitled').substring(0, titleMaxLen)}
    />
  );
};

const noResults = <MenuItem disabled={true} text="No matching examples" />;

const itemListRenderer = (o: {
  activeItem: T | null,
  filteredItems: T[],
  items: T[],
  query: string,
  itemsParentRef: (ref: HTMLElement | null) => void,
  renderItem: (item: T, index: number) => Node,
}): Node => {
  const items = o.filteredItems.map(o.renderItem).filter(item => item != null);
  const content = items.length > 0 ? items : noResults;
  return <Menu ulRef={o.itemsParentRef}>{content}</Menu>;
};

const searcher = new FuzzySearch(examples, ['name']);
const itemsPredicate = q => (Boolean(q) ? searcher.search(q) : examples).slice(0, 12);

export default (p: IOmnibarProps<T>) => (
  <Omnibar
    {...p}
    items={examples}
    className="bp3-dark"
    itemListPredicate={itemsPredicate}
    resetOnSelect={true}
    itemListRenderer={itemListRenderer}
    itemRenderer={renderItem}
    noResults={noResults}
    inputProps={{ placeholder: 'Examples...' }}
  />
);
