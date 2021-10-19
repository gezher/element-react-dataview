import React from 'react';
import { Form } from 'element-react';

import { useDataFormContext } from './DataForm';
import { useFieldsetContext } from './Fieldset';
import Wrapper from './Wrapper';

import {
  getByNamespace,
  computeValue
} from './utils';

function Field(props) {
  const formContext = useDataFormContext();
  const {
    Editor,
    label = '',
    labelWidth = formContext.labelWidth,
    prop,
    onChange,
    placeholder,
    disabled,
    readOnly,
    valueTransformer = {},
    className,
    rules,
    ...options
  } = props;
  if (!Editor) {
    return null;
  }

  const { data } = useFieldsetContext();

  const fieldsetValue = getByNamespace(data, prop);
  const {
    value = typeof fieldsetValue !== 'undefined'
      ? fieldsetValue
      : computeValue(options.defaultValue, data, formContext.model)
  } = options;

  const computedProps = {
    ...options,
    value: typeof valueTransformer.in === 'function'
      ? valueTransformer.in.call(this, value, data, formContext.model)
      : value,
    onChange,
    placeholder: computeValue(placeholder, data, formContext.model),
    disabled: computeValue(disabled, data, formContext.model),
    readOnly: computeValue(readOnly, data, formContext.model)
  };

  const wrapperComponent = label !== null ? Form.Item : React.Fragment;

  return (
    <Wrapper
      Component={wrapperComponent}
      {...{
        label,
        labelWidth,
        className,
        rules
      }}
    >
      <Editor {...computedProps} />
    </Wrapper>
  );
}

export default Field;
