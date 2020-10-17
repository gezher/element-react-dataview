import React from 'react';
import { findDOMNode } from 'react-dom';
import { observer } from 'mobx-react';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Switch,
  Radio,
  Checkbox,
  Transfer
} from 'element-react';

import {
  isPlainObject,
  omit,
  getByNamespace,
  setByNamespace,
  computeValue,
  getPropertyOrValue
} from './utils';



// hack into Form.Item to get value by namespace
Form.Item.prototype.fieldValue = function fieldValue() {
  const { model } = this.parent().props;
  if (!model || !this.props.prop) return undefined;
  return getByNamespace(model, this.props.prop);
};

@observer
class DataForm extends React.Component {
  static nativeMap = {
    text: Input,
    number: InputNumber,
    password: Input,
    select: Select
  };

  static Field({
    // label,
    prop: name,
    type,
    onChange,
    placeholder,
    disabled,
    readOnly,
    valueTransformer = {},
    model,
    dataform,
    ...options
  }) {
    if (!type) {
      return null;
    }

    const formValue = getByNamespace(model, name);
    const {
      value = typeof formValue !== 'undefined'
        ? formValue
        : computeValue(options.defaultValue, model)
    } = options;

    const computedProps = {
      name,
      value: typeof valueTransformer.in === 'function'
        ? valueTransformer.in.call(this, value, model)
        : value,
      onChange: onChange || DataForm.createChangeHandler(dataform, name),
      placeholder: computeValue(placeholder, model),
      disabled: computeValue(disabled, model),
      readOnly: computeValue(readOnly, model),
      ...options,
      model,
      dataform
    };

    const Editor = typeof type === 'string' ? this.nativeMap[type] : type;

    return <Editor {...computedProps} />;
  }

  static FieldSet({
    fields = [],
    model,
    dataform,
    labelWidth = 100
  }) {
    return fields
      .filter(field => computeValue(field.editable, model, field) !== false)
      .map((field, index) => {
        const { prop: name } = field;
        const fieldKey = typeof field.getKey === 'function'
          ? field.getKey(index)
          : `${index}_${name}`;

        const component = <DataForm.Field {...{ ...field, model, dataform }} />;

        return labelWidth
          ? (
            <Form.Item
              label={field.label}
              key={fieldKey}
              prop={name}
            >
              {component}
            </Form.Item>
          )
          : <React.Fragment key={fieldKey}>{component}</React.Fragment>;
      });
  }

  static createChangeHandler(form, key) {
    return (value) => {
      const state = setByNamespace(form.state, key, value);
      form.setState(state);
    };
  }

  static getDerivedStateFromProps({ model, onChange }, state) {
    return onChange ? model : (state || model);
  }

  static setValidation(instance, errors) {
    const { current } = instance.form;
    if (!current) {
      return;
    }
    const errorKeys = Object.keys(errors);
    errorKeys.forEach((name, index) => {
      const field = current.state.fields.find(f => f.props.prop === name);
      if (field) {
        field.setState({
          error: errors[name],
          validating: false,
          valid: true
        }, () => {
          if (index === errorKeys.length - 1) {
            DataForm.focusErrorField(instance, errors);
          }
        });
      }
    });
  }

  static resetValidation(instance) {
    const { current } = instance.form;
    if (!current) {
      return;
    }
    current.state.fields.forEach((field) => {
      field.setState({
        error: '',
        validating: false,
        valid: true
      });
    });
  }

  static focusErrorField(instance, errors) {
    const { current } = instance.form;
    if (!current) {
      return;
    }
    const errorKeys = Object.keys(errors);
    if (errorKeys.length) {
      const component = current.state.fields.find(field => field.props.prop === errorKeys[0]);
      if (component) {
        // eslint-disable-next-line
        findDOMNode(component).scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  }

  form = React.createRef();

  onFieldChange(data) {
    const { fields, onChange } = this.props;
    const state = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const field = fields.find(f => f.prop === key);
      Object.assign(state, setByNamespace(
        this.state,
        key,
        field.valueTransformer && field.valueTransformer.out
          ? field.valueTransformer.out.call(field, value, this.state)
          : value
      ));
    });
    this.setState(state);
    if (typeof onChange === 'function') {
      onChange(this.getFormData(state));
    }
  }

  onSubmit = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    const { onSubmit } = this.props;

    this
      .validate()
      .then(() => {
        if (typeof onSubmit === 'function') {
          onSubmit(this.getFormData());
        }
      })
      .catch((errors) => {
        this.constructor.focusErrorField(this, errors);
      });
  };

  onCancel = () => {
    const { onCancel } = this.props;
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  getFormData(state = this.state) {
    const data = {};
    const { fields } = this.props;
    fields.forEach((field) => {
      // 当表单域不可编辑或被禁用时，跳过
      if (computeValue(field.disabled, state, field)
        || computeValue(field.editable, state, field) === false
        || field.ignoreValue) return;
      const name = field.prop;
      const value = getByNamespace(state, name);
      setByNamespace(data, name, value);
    });

    return data;
  }

  validate() {
    const { current } = this.form;
    if (!current) {
      return Promise.resolve(true);
    }
    // hack into Form of element-react
    const { fields } = current.state;
    if (!fields.length) {
      return Promise.resolve(true);
    }

    const errors = {};

    return new Promise((resolve, reject) => {
      let count = 0;
      fields.forEach((field) => {
        field.validate('', (error) => {
          count += 1;
          if (error) {
            errors[field.props.prop] = error;
          }

          if (count === fields.length) {
            if (!Object.keys(errors).length) {
              resolve(true);
              return;
            }
            reject(errors);
          }
        });
      });
    });
  }

  createChangeHandler(key, fieldOnChange) {
    const form = this;
    const { fields } = this.props;
    return function onChange(value) {
      if (!fieldOnChange
        || fieldOnChange.call(fields.find(f => f.prop === key), value, form) !== false) {
        form.onFieldChange({ [key]: value });
      }
    };
  }

  renderField(field, Editor, options = {}) {
    if (!Editor) {
      return null;
    }

    const {
      prop: name,
      disabled,
      readOnly,
      dataSource = [],
      onChange: fieldOnChange,
      valueTransformer = {}
    } = field;
    const {
      formdata = this.state,
      onChange = this.createChangeHandler(name, fieldOnChange),
      placeholder
    } = options;

    const formValue = getByNamespace(formdata, name);
    const {
      value = typeof formValue !== 'undefined'
        ? formValue
        : computeValue(field.defaultValue, formdata, field)
    } = options;

    const props = {
      name,
      value: typeof valueTransformer.in === 'function'
        ? valueTransformer.in.call(field, value, formdata)
        : value,
      onChange,
      placeholder: computeValue(placeholder, formdata, field),
      disabled: computeValue(disabled, formdata, field),
      readOnly: computeValue(readOnly, formdata, field),
      formdata,
      // use `dataform` not `form` because Input component not allows
      dataform: this
    };

    const selectableData = computeValue(dataSource, formdata, field);
    const { selectValueKey = 'id', selectTextKey = 'name', optionRender } = options;
    const multiple = computeValue(options.multiple, formdata, field);
    let valueArray = [];
    if (typeof props.value !== 'undefined') {
      valueArray = Array.isArray(props.value) ? props.value : [props.value];
    }
    const selected = multiple || Editor === 'checkbox'
      ? valueArray.map(item => getPropertyOrValue(item, selectValueKey))
        .filter(v => typeof selectableData.find(item => v === item[selectValueKey]) !== 'undefined')
      : getPropertyOrValue(props.value, selectValueKey);

    const typeOfEditor = typeof Editor;

    if (typeOfEditor === 'string') {
      switch (Editor) {
        case 'text':
          return (
            <Input {...options} {...props} />
          );

        case 'password':
          return (
            <Input {...options} {...props} type="password" />
          );

        case 'number':
          return (
            <InputNumber {...options} {...props} defaultValue={props.value} />
          );

        case 'select':
          return (
            <Select {...options} {...props} value={selected}>
              {selectableData.map((item, index) => (
                <Select.Option
                  key={item[selectValueKey]}
                  value={item[selectValueKey]}
                  label={item[selectTextKey]}
                  disabled={item.disabled}
                >
                  {optionRender ? optionRender.call(this, item, index, selected) : null}
                </Select.Option>
              ))}
            </Select>
          );

        case 'radio':
          return (
            <Radio.Group {...options} {...props} value={selected}>
              {(selectableData || [
                {
                  [selectValueKey]: 1,
                  [selectTextKey]: '是'
                },
                {
                  [selectValueKey]: 0,
                  [selectTextKey]: '否'
                }
              ]).map(item => (
                <Radio
                  key={item[selectValueKey]}
                  value={item[selectValueKey]}
                  disabled={item.disabled}
                >
                  {item[selectTextKey]}
                </Radio>
              ))}
            </Radio.Group>
          );

        case 'checkbox':
          return (
            <Checkbox.Group {...options} {...props} value={selected}>
              {(selectableData || [
                {
                  [selectValueKey]: true,
                  [selectTextKey]: '是'
                }
              ]).map(item => (
                <Checkbox
                  key={item[selectValueKey]}
                  value={item[selectValueKey]}
                  checked={valueArray.indexOf(item[selectValueKey]) !== -1}
                  disabled={item.disabled}
                >
                  {item[selectTextKey]}
                </Checkbox>
              ))}
            </Checkbox.Group>
          );

        case 'switch':
          return (
            <Switch {...options} {...props} />
          );

        case 'transfer':
          return (
            <Transfer
              data={selectableData.map(item => ({
                key: item[selectValueKey],
                label: item[selectTextKey]
              }))}
              {...options}
              {...props}
            />
          );

        default:
          break;
      }
    } else if (typeOfEditor === 'function') {
      return (
        <Editor {...options} {...props} />
      );
    } else if (isPlainObject(Editor)) {
      // for any other component call this function with this
      return DataForm.prototype.renderField.call(
        this,
        field,
        Editor.component,
        Object.assign({}, Editor.options, options)
      );
    } else if (Array.isArray(Editor)) {
      const editor = Editor.find(item => computeValue(item.editable, formdata, item));
      if (!editor) {
        return null;
      }

      return DataForm.prototype.renderField.call(
        this,
        Object.assign({}, omit(field, ['editor']), editor),
        editor.editor,
        options
      );
    }

    return null;
  }

  renderFields(fields) {
    return fields
      .filter(field => computeValue(field.editable, this.state, field) !== false)
      .map((field, index) => {
        const { prop: name } = field;
        const fieldKey = typeof field.getKey === 'function'
          ? field.getKey(index)
          : `${index}_${name}`;

        return (
          <Form.Item
            label={field.label}
            key={fieldKey}
            prop={name}
          >
            {this.renderField(field, field.editor)}
          </Form.Item>
        );
      });
  }

  renderOperations() {
    const { onCancel, submitText = '确定' } = this.props;

    return (
      <p className="operation">
        <Button type="primary" nativeType="submit">{submitText}</Button>
        {onCancel && <Button onClick={this.onCancel}>取消</Button>}
      </p>
    );
  }

  renderContent() {
    const { fields, renderOperations = this.renderOperations } = this.props;

    return (
      <React.Fragment>
        {this.renderFields(fields)}
        {renderOperations.call(this)}
      </React.Fragment>
    );
  }

  render() {
    const {
      labelPosition = 'right',
      labelWidth = 100,
      fields,
      children,
      ...props
    } = this.props;

    const rules = {};

    fields.forEach((field) => {
      if (field.rules) {
        rules[field.prop] = field.rules;
      }
    });

    let content;

    switch (typeof children) {
      case 'function':
        content = children(this);
        break;
      case 'undefined':
        content = this.renderContent();
        break;
      default:
        content = children;
        break;
    }

    return (
      <Form
        ref={this.form}
        {...props}
        model={this.state}
        onSubmit={this.onSubmit}
        onCancel={this.onCancel}
        labelPosition={labelPosition}
        labelWidth={labelWidth}
        rules={rules}
      >
        {content}
      </Form>
    );
  }
}

export default DataForm;
