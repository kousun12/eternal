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

// const docstring = docs().join('\n');
// download(docstring);
// console.log(docstring);
