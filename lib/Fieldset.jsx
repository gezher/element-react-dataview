import React, { useContext } from 'react';

import Field from './Field';
import { useDataFormContext } from './DataForm';
import Wrapper from './Wrapper';
import { getByNamespace, setByNamespace, getEditorOptions } from './utils';



function computeValue(value, context, formdata, scope) {
  return typeof value === 'function' ? value.call(scope, context, formdata) : value;
}



function createChangeHandler(props, { name, onChange: fieldOnChange }) {
  return function onChangeHandler(v) {
    const {
      // avoid original `props.value` being frozen and can set new value
      value: { ...value } = {},
      fields,
      dataform,
      onChange
    } = props;

    const field = fields.find(f => f.prop === name);

    if (fieldOnChange && fieldOnChange.call(field, v, value, dataform) === false) {
      return;
    }

    const { valueTransformer } = field;
    setByNamespace(value, name, valueTransformer && typeof valueTransformer.out === 'function'
      ? valueTransformer.out(v, value)
      : v);

    onChange(value);
  };
}



export default function Fieldset(props) {
  const { model } = useDataFormContext();
  const {
    value: data = {},
    fields,
    fieldWrapperProps: {
      Component = React.Fragment
    } = {}
  } = props;

  return (
    <FieldsetContext.Provider
      value={{ data }}
    >
      {fields
        .map(({
          getKey,
          ...field
        }, index) => {
          const { editable, ...options } = getEditorOptions(field);
          if (computeValue(editable, data, model, field) === false) {
            return null;
          }

          const fieldKey = typeof getKey === 'function'
            ? getKey(index)
            : `${index}_${options.name}`;

          return (
            <Wrapper
              key={fieldKey}
              Component={Component}
              className={`field-wrapper-${options.name}`}
            >
              <Field
                label={field.label}
                prop={options.name}
                {...options}
                value={getByNamespace(data, options.name)}
                onChange={createChangeHandler(props, options)}
              />
            </Wrapper>
          );
        })
      }
    </FieldsetContext.Provider>
  );
}

export const FieldsetContext = React.createContext();

export function useFieldsetContext() {
  return useContext(FieldsetContext);
}
