// @flow
import React from 'react';
import type { Node } from 'react';
import FuzzySearch from 'fuzzy-search';
import { Omnibar, ItemRenderer, type IOmnibarProps } from '@blueprintjs/select';
import { Menu, MenuItem } from '@blueprintjs/core';
import type { AnyNode } from 'models/NodeBase';
import { signatureFor } from 'components/util';

const allNodes = window.allNodes;
type T = Class<AnyNode>;

const titleMaxLen = 20;
const sigMaxLen = 12;

const renderItem: ItemRenderer<T> = (node, { handleClick, modifiers, query }) => {
  return (
    <MenuItem
      className="bp3-dark"
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={signatureFor(node, sigMaxLen)}
      key={node.displayName}
      onClick={handleClick}
      text={node.displayName.substring(0, titleMaxLen)}
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

const searcher = new FuzzySearch(allNodes, ['displayName']);
const itemsPredicate = q => (Boolean(q) ? searcher.search(q) : allNodes).slice(0, 12);

export default (p: IOmnibarProps<T>) => (
  <Omnibar
    {...p}
    items={allNodes}
    className="bp3-dark"
    itemListPredicate={itemsPredicate}
    resetOnSelect={true}
    itemListRenderer={itemListRenderer}
    itemRenderer={renderItem}
    noResults={noResults}
  />
);
