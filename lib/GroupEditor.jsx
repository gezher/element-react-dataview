import React from 'react';
import { Button } from 'element-react';

import DataForm from './DataForm';
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

  createChangeHandler(name, index, fieldOnChange) {
    return (v) => {
      const {
        value = [],
        min,
        fields,
        dataform,
        onChange
      } = this.props;

      const field = fields.find(f => f.prop === name);

      if (fieldOnChange && fieldOnChange.call(field, v, dataform, this, index) === false) {
        return;
      }

      const count = value.length;
      const buffer = count < min ? [
        ...value,
        // here fill null then map because only fill new object will be only one reference
        ...Array(min - count).fill(null).map(() => ({}))
      ] : value;

      const { valueTransformer } = field;
      setByNamespace(buffer[index], name, valueTransformer && typeof valueTransformer.out === 'function'
        ? valueTransformer.out(v, buffer[index])
        : v);

      const result = buffer.map((row) => {
        const data = Object.assign({}, row);
        fields.forEach((f) => {
          const { prop } = f;
          setByNamespace(data, prop, getByNamespace(row, prop));
        });

        return data;
      });

      onChange(result);
    };
  }

  renderFieldsRow(row, index) {
    const { fields, formdata, dataform } = this.props;
    const rowKey = row.id ? `data_${row.id}` : `temp_${index}`;

    return (
      <tr key={rowKey}>
        {fields
          .filter(field => computeValue(field.editable, row, formdata, index, field) !== false)
          .map((field) => {
            const { editor, prop: name, onChange: fieldOnChange } = field;
            const { placeholder } = editor.options || {};
            const fieldOptions = {};
            ['disabled', 'readOnly', 'dataSource', 'editable'].forEach((key) => {
              const computed = computeValue(field[key], row, formdata, index, field);
              if (typeof computed !== 'undefined') {
                fieldOptions[key] = computed;
              }
            });
            const argumentList = [Object.assign({}, field, fieldOptions)];
            const value = getByNamespace(row, name);
            const defaultValue = (
              computeValue(field.defaultValue, row, formdata, index, field)
            );
            const finalDefaultValue = typeof defaultValue !== 'undefined' ? defaultValue : null;
            const options = {
              value: typeof value !== 'undefined' ? value : finalDefaultValue,
              onChange: this.createChangeHandler(name, index, fieldOnChange),
              rowdata: row
              // pass `formdata` to sub-component will cause value default to formdata in same name
              // formdata
            };
            if (typeof placeholder !== 'undefined') {
              options.placeholder = computeValue(placeholder, row, formdata, index, field);
            }

            if (editor.component) {
              argumentList.push(
                editor.component,
                Object.assign({}, editor.options, options)
              );
            } else {
              argumentList.push(editor, options);
            }

            const fieldKey = `${rowKey}_${name}`;

            return (
              <td key={fieldKey} className={`column-${field.prop.replace(/\./g, '-')}`}>
                {DataForm.prototype.renderField.apply(dataform, argumentList)}
              </td>
            );
          })
        }
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
