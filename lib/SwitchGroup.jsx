import React from 'react';
import { Switch } from 'element-react';

import { computeValue, getPropertyOrValue } from './utils';

import './switchgroup.less';



export default class SwitchGroup extends React.Component {
  createChangeHandler(id) {
    return (v) => {
      const {
        value,
        onChange,
        rowdata,
        multiple: multipleRaw
      } = this.props;
      const multiple = computeValue(multipleRaw, rowdata);
      if (multiple) {
        onChange(v ? value.concat([v]) : value.filter(vItem => vItem !== id));
      } else {
        onChange(v);
      }
    };
  }

  render() {
    const {
      value,
      disabled,
      selectValueKey = 'id',
      selectTextKey = 'name',
      onText,
      offText,
      dataSource,
      rowdata,
      multiple: multipleRaw
    } = this.props;

    const multiple = computeValue(multipleRaw, rowdata);

    const selectableData = computeValue(dataSource, rowdata);
    const selected = multiple
      ? value
        .map(item => getPropertyOrValue(item, selectValueKey))
        .filter(v => typeof selectableData.find(item => v === item[selectValueKey]) !== 'undefined')
      : getPropertyOrValue(value, selectValueKey);

    return (
      <ul className="component-switch-group">
        {selectableData.map((item) => {
          let itemValue;
          if (multiple) {
            itemValue = selected.find(id => id === item[selectValueKey]);
          } else {
            itemValue = selected === item[selectValueKey] ? selected : null;
          }
          return (
            <li key={item[selectValueKey]}>
              <Switch
                value={itemValue}
                disabled={disabled}
                onText={onText}
                offText={offText}
                onValue={item[selectValueKey]}
                offValue={null}
                onChange={this.createChangeHandler(item[selectValueKey])}
              />
              <span>{item[selectTextKey]}</span>
            </li>
          );
        })}
      </ul>
    );
  }
}
