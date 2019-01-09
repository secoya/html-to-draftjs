/* @flow */

import { Entity } from 'draft-js';

const getEntityId = (node: HTMLElement, customInlineChunkGenerator: ?CustomChunkGenerator) => {
  let entityId = undefined;
  if (customInlineChunkGenerator) {
    const nodeName = node.nodeName.toLowerCase();
    const value = customInlineChunkGenerator(nodeName, node);
    if (value) {
      return Entity.__create(value.type, value.mutability, value.data || {});
    }
  }
  if (node instanceof HTMLAnchorElement) {
    const entityConfig = {};
    if (node.dataset && node.dataset.mention !== undefined) {
      entityConfig.url = node.href;
      entityConfig.text = node.innerHTML;
      entityConfig.value = node.dataset.value;
      entityId = Entity.__create('MENTION', 'IMMUTABLE', entityConfig);
    } else {
      entityConfig.url = node.getAttribute ? node.getAttribute('href') || node.href : node.href;
      entityConfig.title = node.innerHTML;
      entityConfig.targetOption = node.target;
      entityId = Entity.__create('LINK', 'MUTABLE', entityConfig);
    }
  }
  return entityId;
};

export default getEntityId;
