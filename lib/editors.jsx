import React from 'react';
import {
  Input,
  InputNumber,
  Select,
  Switch,
  Radio,
  Checkbox,
  Transfer
} from 'element-react';

import { useSelectableContext } from './utils';



export default {
  text: Input,
  number(props) {
    const { value } = props;
    return <InputNumber {...props} defaultValue={value} />;
  },
  password(props) {
    return <Input {...props} type="password" />;
  },
  switch: Switch,
  select(props) {
    const {
      selectValueKey: _selectValueKey,
      selectTextKey: _selectTextKey,
      optionRender,
      ...options
    } = props;
    const {
      selectableData,
      selected,
      multiple,
      selectValueKey,
      selectTextKey
    } = useSelectableContext(props);

    return (
      <Select {...options} multiple={multiple} value={selected}>
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
  },
  radio(props) {
    const {
      selectValueKey: _selectValueKey,
      selectTextKey: _selectTextKey,
      ...options
    } = props;
    const {
      selectableData,
      selected,
      selectValueKey,
      selectTextKey
    } = useSelectableContext(props);

    return (
      <Radio.Group {...options} value={selected}>
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
  },
  checkbox(props) {
    const {
      selectValueKey: _selectValueKey,
      selectTextKey: _selectTextKey,
      ...options
    } = props;
    const {
      selectableData,
      selected,
      selectValueKey,
      selectTextKey
    } = useSelectableContext({ ...props, multiple: true });

    return (
      <Checkbox.Group {...options} value={selected}>
        {(selectableData || [
          {
            [selectValueKey]: true,
            [selectTextKey]: '是'
          }
        ]).map(item => (
          <Checkbox
            key={item[selectValueKey]}
            value={item[selectValueKey]}
            checked={selected.indexOf(item[selectValueKey]) !== -1}
            disabled={item.disabled}
          >
            {item[selectTextKey]}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  },
  transfer(props) {
    const {
      selectValueKey: _selectValueKey,
      selectTextKey: _selectTextKey,
      ...options
    } = props;
    const {
      selectableData,
      selectValueKey,
      selectTextKey
    } = useSelectableContext(props);

    return (
      <Transfer
        {...options}
        data={selectableData.map(item => ({
          key: item[selectValueKey],
          label: item[selectTextKey]
        }))}
      />
    );
  }
};
