import React from 'react';
import { Button } from 'element-react';

import Fieldset from './Fieldset';
import { getByNamespace, setByNamespace } from './utils';

import './groupeditor.less';



function computeValue(value, row, formdata, index, scope) {
  return typeof value === 'function' ? value.call(scope, row, formdata, index) : value;
}



class GroupEditor extends React.Component {
  onAdd = () => {
    const { fields, onChange } = this.props;
    const item = {};
    fields.forEach((field) => {
      setByNamespace(item, field.prop, field.defaultValue);
    });
    const { value = [] } = this.props;
    value.push(item);
    onChange(value);
  };

  onRemove(index) {
    const { value, onChange } = this.props;
    value.splice(index, 1);
    onChange(value);
  }

  createRowChangeHandler(index) {
    return (v) => {
      const {
        value = [],
        min,
        onChange
      } = this.props;

      const count = value.length;
      const buffer = count < min ? [
        ...value,
        // here fill null then map because only fill new object will be only one reference
        ...Array(min - count).fill(null).map(() => ({}))
      ] : value;

      buffer.splice(index, 1, v);

      onChange(buffer);
    };
  }

  renderFieldsRow(row, index) {
    const { fields } = this.props;
    const rowKey = row.id ? `data_${row.id}` : `temp_${index}`;
    return (
      <tr key={rowKey}>
        <Fieldset
          fields={fields.map(f => ({ labelWidth: 0, ...f }))}
          value={row}
          onChange={this.createRowChangeHandler(index)}
          fieldWrapperProps={{
            Component: 'td'
          }}
        />
        {this.renderRemoveButton(row, index)}
      </tr>
    );
  }

  renderAddButton(buffer) {
    const {
      fields,
      creatable,
      max = Infinity,
      formdata
    } = this.props;

    // 数量限制
    if (max >= 0 && buffer.length >= max) {
      return null;
    }

    // 末行不为空
    if (buffer.length) {
      const lastRow = buffer[buffer.length - 1];
      const lastEmpty = fields
        .filter((field, index) => (
          computeValue(field.editable, lastRow, formdata, index, field) !== false
        ))
        .every((field) => {
          const v = getByNamespace(lastRow, field.prop);
          return v === '' || v == null || v === field.defaultValue;
        });

      if (lastEmpty) {
        return null;
      }
    }

    const creatableType = typeof creatable;

    let willRender = true;

    switch (creatableType) {
      case 'boolean':
        willRender = creatable;
        break;

      case 'function':
        willRender = creatable(buffer);
        break;

      default:
        break;
    }

    return willRender
      ? <p><Button onClick={this.onAdd}>＋</Button></p>
      : null;
  }

  renderRemoveButton(row, index) {
    const { value = [], deletable, min = 0 } = this.props;
    const removableType = typeof deletable;

    if (min >= value.length) {
      return null;
    }

    let willRender = true;

    switch (removableType) {
      case 'boolean':
        willRender = deletable;
        break;

      case 'function':
        willRender = deletable(row, index);
        break;

      default:
        break;
    }

    return willRender
      ? (
        <td className="column-operation">
          <Button onClick={() => this.onRemove(index)}>－</Button>
        </td>
      )
      : null;
  }

  render() {
    const {
      value = [],
      fields,
      className,
      showLabel = true,
      min
    } = this.props;
    const count = value.length;
    const buffer = count < min ? [
      ...value,
      ...Array(min - count).fill(null).map(() => ({}))
    ] : value;

    return (
      <fieldset className={['component-group-fields', ...((className || '').toString().split(/[, ]/))].join(' ')}>
        {buffer.length
          ? (
            <table>
              {showLabel
                ? (
                  <thead>
                    <tr>
                      {fields.map((field) => {
                        const fieldKey = typeof field.getKey === 'function'
                          ? field.getKey('header')
                          : `header_${field.prop}`;

                        return (
                          <th key={fieldKey} className={`column-${field.prop.replace(/\./g, '-')}`}>{field.label}</th>
                        );
                      })}
                    </tr>
                  </thead>
                )
                : null
              }
              <tbody>
                {buffer.map((row, index) => this.renderFieldsRow(row, index))}
              </tbody>
            </table>
          )
          : null
        }
        {this.renderAddButton(buffer)}
      </fieldset>
    );
  }
}

export default GroupEditor;
