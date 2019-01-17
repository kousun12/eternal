import React from 'react';
import { polyfill } from 'react-lifecycles-compat';
import { toType } from './../../helpers/util';
//data type components
import { JsonObject } from './DataTypes';

import VariableEditor from './../VariableEditor';
import VariableMeta from './../VariableMeta';
import ArrayGroup from './../ArrayGroup';
import ObjectName from './../ObjectName';
//attribute store
//icons
import { CollapsedIcon, ExpandedIcon } from './../ToggleIcons';
//theme
import Theme from './../../themes/getStyle';
import AttributeStore from 'components/JsonTree/js/stores/ObjectAttributes';

//increment 1 with each nested object & array
const DEPTH_INCREMENT = 1;
//single indent is 5px
const SINGLE_INDENT = 5;

class RjvObject extends React.PureComponent {
  constructor(props) {
    super(props);
    const state = RjvObject.getState(props);
    this.state = {
      ...state,
      prevProps: {},
    };
  }

  static getState = props => {
    const size = Object.keys(props.src).length;
    const expanded =
      size < 5 &&
      (props.collapsed === false || (props.collapsed !== true && props.collapsed > props.depth)) &&
      (!props.shouldCollapse ||
        props.shouldCollapse({
          name: props.name,
          src: props.src,
          type: toType(props.src),
          namespace: props.namespace,
        }) === false) &&
      //initialize closed if object has no items
      size !== 0;
    return {
      expanded: AttributeStore.get(props.rjvId, props.namespace, 'expanded', expanded),
      object_type: props.type === 'array' ? 'array' : 'object',
      parent_type: props.type === 'array' ? 'array' : 'object',
      size,
    };
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { prevProps } = prevState;
    if (
      nextProps.src !== prevProps.src ||
      nextProps.collapsed !== prevProps.collapsed ||
      nextProps.name !== prevProps.name ||
      nextProps.namespace !== prevProps.namespace ||
      nextProps.rjvId !== prevProps.rjvId
    ) {
      const newState = RjvObject.getState(nextProps);
      return {
        ...newState,
        prevProps: nextProps,
      };
    }
    return null;
  }

  toggleCollapsed = () => {
    this.setState(
      {
        expanded: !this.state.expanded,
      },
      () => {
        AttributeStore.set(this.props.rjvId, this.props.namespace, 'expanded', this.state.expanded);
      }
    );
  };

  getObjectContent = (depth, src, props) => {
    const overrideStyle = props.isPrimitive ? { marginLeft: 0 } : {};
    return (
      <div className="pushed-content object-container">
        <div
          className="object-content"
          {...Theme(this.props.theme, 'pushed-content', overrideStyle)}>
          {this.renderObjectContents(src, props)}
        </div>
      </div>
    );
  };

  getEllipsis = () => {
    const { size } = this.state;

    if (size === 0) {
      return null;
    } else {
      return (
        <div
          {...Theme(this.props.theme, 'ellipsis')}
          className="node-ellipsis"
          onClick={this.toggleCollapsed}>
          ...
        </div>
      );
    }
  };

  getObjectMetaData = () => {
    const { size } = this.state;
    return <VariableMeta size={size} {...this.props} />;
  };

  getBraceStart(object_type, expanded) {
    const { attrType, theme, iconStyle, parent_type } = this.props;

    if (parent_type === 'array_group') {
      return (
        <span>
          <span {...Theme(theme, 'brace')}>{object_type === 'array' ? '[' : '{'}</span>
          {expanded ? this.getObjectMetaData() : null}
        </span>
      );
    }

    if (attrType.type === 'primitive') {
      return null;
    }
    const IconComponent = expanded ? ExpandedIcon : CollapsedIcon;

    return (
      <span>
        <span onClick={this.toggleCollapsed} {...Theme(theme, 'brace-row')}>
          <div className="icon-container" {...Theme(theme, 'icon-container')}>
            <IconComponent {...{ theme, iconStyle }} />
          </div>
          <ObjectName {...this.props} />
          <span {...Theme(theme, 'brace')}>{object_type === 'array' ? '[' : '{'}</span>
        </span>
        {expanded ? this.getObjectMetaData() : null}
      </span>
    );
  }

  getBraceEnd = () => {
    const { theme, attrType } = this.props;
    const { object_type, expanded } = this.state;
    if (attrType.type === 'primitive') {
      return null;
    }
    return (
      <span className="brace-row">
        <span
          style={{
            ...Theme(theme, 'brace').style,
            paddingLeft: expanded ? '3px' : '0px',
          }}>
          {object_type === 'array' ? ']' : '}'}
        </span>
        {expanded ? null : this.getObjectMetaData()}
      </span>
    );
  };

  render() {
    const {
      depth,
      src,
      namespace,
      name,
      type,
      parent_type,
      theme,
      jsvRoot,
      iconStyle,
      ...rest
    } = this.props;

    const { object_type, expanded } = this.state;

    let styles = {};
    if (!jsvRoot && parent_type !== 'array_group') {
      styles.paddingLeft = this.props.indentWidth * SINGLE_INDENT;
    } else if (parent_type === 'array_group') {
      styles.borderLeft = 0;
      styles.display = 'inline';
    }

    return (
      <div
        className="object-key-val"
        {...Theme(theme, jsvRoot ? 'jsv-root' : 'objectKeyVal', styles)}>
        {this.getBraceStart(object_type, expanded)}
        {expanded
          ? this.getObjectContent(depth, src, {
              theme,
              iconStyle,
              ...rest,
            })
          : this.getEllipsis()}
        {this.getBraceEnd()}
      </div>
    );
  }

  renderObjectContents = (variables, props) => {
    const {
      depth,
      parent_type,
      index_offset,
      groupArraysAfterLength,
      namespace,
      rejectMatching,
    } = this.props;
    const { object_type } = this.state;
    let elements = [],
      variable;
    let keys = Object.keys(variables || {});
    if (this.props.sortKeys) {
      keys = keys.sort();
    }
    keys.forEach((name, i) => {
      variable = new JsonVariable(name, variables[name]);
      if (parent_type === 'array_group' && index_offset) {
        variable.name = parseInt(variable.name) + index_offset;
      }
      if (!variables.hasOwnProperty(name)) {
        return null;
      } else if (rejectMatching && name.match(rejectMatching)) {
        return null;
      } else if (variable.type === 'object') {
        elements.push(
          <JsonObject
            key={variable.name}
            depth={depth + DEPTH_INCREMENT}
            name={variable.name}
            src={variable.value}
            namespace={namespace.concat(variable.name)}
            parent_type={object_type}
            {...props}
            editOnHotkey={false}
          />
        );
      } else if (variable.type === 'array') {
        let ObjectComponent = JsonObject;
        if (groupArraysAfterLength && variable.value.length > groupArraysAfterLength) {
          ObjectComponent = ArrayGroup;
        }
        elements.push(
          <ObjectComponent
            key={variable.name}
            depth={depth + DEPTH_INCREMENT}
            name={variable.name}
            src={variable.value}
            namespace={namespace.concat(variable.name)}
            type="array"
            parent_type={object_type}
            editOnHotkey={false}
            {...props}
          />
        );
      } else {
        elements.push(
          <VariableEditor
            key={variable.name + '_' + namespace}
            variable={variable}
            singleIndent={SINGLE_INDENT}
            namespace={namespace}
            type={this.props.type}
            {...props}
          />
        );
      }
    });
    return elements;
  };
}

//just store name, value and type with a variable
class JsonVariable {
  constructor(name, value) {
    this.name = name;
    this.value = value;
    this.type = toType(value);
  }
}

polyfill(RjvObject);

//export component
export default RjvObject;
