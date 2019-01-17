// @flow
import React from 'react';
import type { Node } from 'react';
import { get } from 'lodash';
import FuzzySearch from 'fuzzy-search';
import { Omnibar, ItemRenderer, type IOmnibarProps } from '@blueprintjs/select';
import Graph from 'models/Graph';
import { Menu, MenuItem } from '@blueprintjs/core';

import type { AnyNode } from 'models/NodeBase';

type T = AnyNode;

const titleMaxLen = 20;

const renderItem: ItemRenderer<T> = (node, { handleClick, modifiers, query }) => {
  return (
    <MenuItem
      className="bp3-dark"
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={node.id}
      onClick={handleClick}
      text={String(node.name()).substring(0, titleMaxLen)}
    />
  );
};

const noResults = <MenuItem disabled={true} text="No matching nodes" />;
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

const itemsPredicate = (q, searcher, all) => (Boolean(q) ? searcher.search(q) : all).slice(0, 12);

type P = {
  graph: Graph,
};
export default (p: IOmnibarProps<T> & P) => {
  const nodes = get(p.graph, 'nodes', []).map(n => n.node);
  const searcher = new FuzzySearch(nodes.map(n => ({ ...n, _name: n.name() })), [
    '_name',
    'constructor.displayName',
  ]);
  return (
    <Omnibar
      {...p}
      items={nodes}
      className="bp3-dark"
      itemListPredicate={q => itemsPredicate(q, searcher, nodes)}
      resetOnSelect={true}
      itemListRenderer={itemListRenderer}
      itemRenderer={renderItem}
      noResults={<MenuItem disabled={true} text="No matching nodes" />}
    />
  );
};
