/* eslint-disable */
import ReactDOM from 'react-dom';
import { allNodes } from 'models/nodes';

const renderAttr = ([title, type]) => {
  const def = type.defaultValue && JSON.stringify(type.defaultValue);
  return `\`${title}\`: \`${type.name}\` _${type.type}_${def ? ` default: \`${def}\`` : ''}\n\n${
    type.description
  }`;
};

const docs = () =>
  allNodes.map(n => {
    let desc = '';
    if (n.description) {
      const r = ReactDOM.render(n.description, document.createElement('div'));
      desc = r.textContent;
    }
    return `
## ${n.displayName}

${desc}
  

##### inputs (${Object.keys(n.schema.input).length})

${Object.entries(n.schema.input)
  .map(renderAttr)
  .join('\n\n')}
  
##### outputs (${Object.keys(n.schema.output).length})

${Object.entries(n.schema.output)
  .map(renderAttr)
  .join('\n\n')}
  
`;
  });

export function download(str, exportName = 'docs') {
  const dataStr = 'data:text;charset=utf-8,' + encodeURIComponent(str);
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', exportName + '.md');
  // $FlowIssue
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

const md = () => {
  const nodes = docs();
  return `
# Node Docs

Here's a list of all ${nodes.length} current nodes, their descriptions, and i/o.

${nodes.join('\n\n')}    
`;
};
// const output = md();
// download(output);
// console.log(output);
