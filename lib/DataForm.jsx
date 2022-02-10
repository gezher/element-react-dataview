import React, { useContext } from 'react';
import { findDOMNode } from 'react-dom';
import { observer } from 'mobx-react';
import {
  Form,
  Button
} from 'element-react';

import Fieldset from './Fieldset';
import {
  getByNamespace,
  setByNamespace,
  computeValue
} from './utils';



// hack into Form.Item to get value by namespace
Form.Item.prototype.fieldValue = function fieldValue() {
  const { model } = this.parent().props;
  if (!model || !this.props.prop) return undefined;
  return getByNamespace(model, this.props.prop);
};

@observer
class DataForm extends React.Component {
  // TODO(optimize):
  // @see https://zh-hans.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html
  static getDerivedStateFromProps({ model, onChange }, state) {
    return onChange ? model : (state || model);
  }

  static setValidation(instance, errors) {
    const { current } = instance;
    if (!current) {
      return;
    }
    const { current: form } = current.form;
    if (!form) {
      return;
    }
    const errorKeys = Object.keys(errors);
    errorKeys.forEach((name, index) => {
      const field = form.state.fields.find(f => f.props.prop === name);
      if (field) {
        field.setState({
          error: errors[name].map(error => error.replace(`"${name}"`, field.props.label)),
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
    const { current } = instance;
    if (!current) {
      return;
    }
    const { current: form } = current.form;
    if (!form) {
      return;
    }
    form.state.fields.forEach((field) => {
      field.setState({
        error: '',
        validating: false,
        valid: true
      });
    });
  }

  static focusErrorField(instance, errors) {
    const { current } = instance;
    if (!current) {
      return;
    }
    const { current: form } = current.form;
    if (!form) {
      return;
    }
    const errorKeys = Object.keys(errors);
    if (errorKeys.length) {
      const component = form.state.fields.find(field => errorKeys.includes(field.props.prop));
      if (component) {
        // eslint-disable-next-line
        const node = findDOMNode(component);
        node.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  }

  form = React.createRef();

  onChange = (data) => {
    const { onChange } = this.props;
    this.setState(data);
    if (typeof onChange === 'function') {
      onChange(data);
    }
  };

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

  renderOperations() {
    const { onCancel, submitText = '确定', disabled = false } = this.props;

    return (
      <p className="operation">
        <Button
          type="primary"
          nativeType="submit"
          disabled={computeValue(disabled, this.state, this)}
        >
          {submitText}
        </Button>
        {onCancel && <Button onClick={this.onCancel}>取消</Button>}
      </p>
    );
  }

  renderContent() {
    const { fields, renderOperations = this.renderOperations, labelWidth = 100 } = this.props;

    return (
      <React.Fragment>
        <Fieldset
          fields={fields}
          value={this.state}
          onChange={this.onChange}
          labelWidth={labelWidth}
          dataform={this}
        />
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
        <DataFormContext.Provider
          value={{
            model: this.state,
            form: this,
            labelWidth
          }}
        >
          {content}
        </DataFormContext.Provider>
      </Form>
    );
  }
}

export default DataForm;

export const DataFormContext = React.createContext();

export function useDataFormContext() {
  return useContext(DataFormContext);
}
