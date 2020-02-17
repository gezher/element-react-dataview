import React from 'react';
import { Form } from 'element-react';

import DataForm from './DataForm';
import { setByNamespace } from './utils';



function computeValue(value, row, formdata, scope) {
  return typeof value === 'function' ? value.call(scope, row, formdata) : value;
}



class Fieldset extends React.Component {
  createChangeHandler(name, fieldOnChange) {
    return (v) => {
      const {
        value = {},
        fields,
        dataform,
        onChange
      } = this.props;

      const field = fields.find(f => f.prop === name);

      if (fieldOnChange && fieldOnChange.call(field, v, dataform, this) === false) {
        return;
      }

      const { valueTransformer } = field;
      setByNamespace(value, name, valueTransformer && typeof valueTransformer.out === 'function'
        ? valueTransformer.out(v, value)
        : v);

      onChange(value);
    };
  }

  render() {
    const {
      value: data,
      className,
      fields,
      formdata,
      dataform
    } = this.props;

    return (
      <fieldset className={['component-fieldset', ...((className || '').toString().split(/[, ]/))].join(' ')}>
        {fields
          .filter(field => computeValue(
            field.editable,
            data[field.prop],
            formdata,
            field
          ) !== false)
          .map((field) => {
            const { editor, prop: name, onChange: fieldOnChange } = field;
            const { placeholder } = editor.options || {};
            const fieldOptions = {};
            ['disabled', 'readOnly', 'dataSource', 'editable'].forEach((key) => {
              const computed = computeValue(field[key], data, formdata, field);
              if (typeof computed !== 'undefined') {
                fieldOptions[key] = computed;
              }
            });
            const argumentList = [{ ...field, ...fieldOptions }];
            const value = data[name];
            const defaultValue = (
              computeValue(field.defaultValue, data, formdata, field)
            );
            const finalDefaultValue = typeof defaultValue !== 'undefined' ? defaultValue : null;
            const options = {
              value: typeof value !== 'undefined' ? value : finalDefaultValue,
              onChange: this.createChangeHandler(name, fieldOnChange),
              rowdata: data
              // pass `formdata` to sub-component will cause
              // value becomes default to formdata in same name.
              // formdata
            };
            if (typeof placeholder !== 'undefined') {
              options.placeholder = computeValue(placeholder, data, formdata, field);
            }

            if (editor.component) {
              argumentList.push(
                editor.component,
                Object.assign({}, editor.options, options)
              );
            } else {
              argumentList.push(editor, options);
            }

            return (
              <Form.Item
                label={field.label}
                key={field.prop}
                prop={name}
              >
                {DataForm.prototype.renderField.apply(dataform, argumentList)}
              </Form.Item>
            );
          })
        }
      </fieldset>
    );
  }
}

export default Fieldset;
