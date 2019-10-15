/* eslint-disable */
import ReactDOM from 'react-dom';
import { allNodes } from 'models/nodes';

const textFrom = maybeJsx => ReactDOM.render(maybeJsx, document.createElement('div')).textContent;

const renderAttr = ([title, type]) => {
  const def = type.defaultValue && JSON.stringify(type.defaultValue).replace(/"/g, '');
  const defaultString = def ? ` default: \`${def}\`` : '';
  const attrDesc = type.description ? `${textFrom(type.description)}\n` : '';
  const typeInfo =
    type.isPrimitive() || !type.typeDescription
      ? ''
      : `\<details\>
\<summary\>${type.name}\<\/summary\>
${textFrom(type.typeDescription)}
${defaultString}
\<\/details\>`;
  return `\`${title}\`: \`${type.name}\`
${attrDesc}${typeInfo}`;
};

const docs = () =>
  allNodes.map(n => {
    return `
## ${n.displayName}

${n.description ? textFrom(n.description) : ''}
  

#### inputs

${Object.entries(n.schema.input)
  .map(renderAttr)
  .join('\n\n')}
  
#### outputs

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
