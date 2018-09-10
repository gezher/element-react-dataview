import React from 'react';
import { Button } from 'element-react';

import { computeValue, getPropertyOrValue } from './utils';

import './tagselect.less';



export default class TagSelect extends React.Component {
  onChange = (v) => {
    const { value, onChange, rowdata } = this.props;
    const multiple = computeValue(this.props.multiple, rowdata);
    if (multiple) {
      // TODO: bug here when add button for <ALL> value
      onChange(value.find(vItem => vItem === v) ?
        value.concat([v]) :
        value.filter(vItem => vItem !== v)
      );
    } else {
      onChange(v);
    }
  };

  render() {
    const {
      value,
      disabled,
      size = 'small',
      selectValueKey = 'id',
      selectTextKey = 'name',
      dataSource,
      rowdata
    } = this.props;

    const multiple = computeValue(this.props.multiple, rowdata);

    const selectableData = computeValue(dataSource, rowdata);
    const selected = multiple ?
      value
        .map(item => getPropertyOrValue(item, selectValueKey))
        .filter(v => typeof selectableData.find(item => v === item[selectValueKey]) !== 'undefined') :
      getPropertyOrValue(value, selectValueKey);

    return (
      <ul className="component-tag-select">
        {selectableData.map((item) => {
          const id = item[selectValueKey];
          const itemSelected = multiple ?
            selected.includes(id) :
            selected === id;

          return (
            <li key={typeof id !== 'undefined' ? id : ''}>
              <Button
                type={itemSelected ? 'primary' : 'text'}
                size={size}
                disabled={disabled || item.disabled}
                onClick={() => this.onChange(id)}
              >{item[selectTextKey]}</Button>
            </li>
          );
        })}
      </ul>
    );
  }
}
