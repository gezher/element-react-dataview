import React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'element-react';

import { computeValue, getPropertyOrValue } from './utils';
import { FieldsetContext } from './Fieldset';

import './tagselect.less';



@observer
class TagSelect extends React.Component {
  onChange = (v) => {
    const {
      value,
      onChange,
      formdata,
      multiple: multipleRaw
    } = this.props;
    const multiple = computeValue(multipleRaw, formdata);
    if (multiple) {
      // TODO: bug here when add button for <ALL> value
      onChange(value.find(vItem => vItem === v)
        ? value.concat([v])
        : value.filter(vItem => vItem !== v));
    } else if (v !== value) {
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
      multiple: multipleRaw
    } = this.props;

    return (
      <FieldsetContext.Consumer>
        {({ data }) => {
          const multiple = computeValue(multipleRaw, data);

          const selectableData = computeValue(dataSource, data);
          const selected = multiple
            ? value
              .map(item => getPropertyOrValue(item, selectValueKey))
              .filter(v => typeof selectableData.find(item => v === item[selectValueKey]) !== 'undefined')
            : getPropertyOrValue(value, selectValueKey);

          return (
            <ul className="component-tag-select">
              {selectableData.map((item) => {
                const id = item[selectValueKey];
                const itemSelected = multiple
                  ? selected.includes(id)
                  : selected === id;

                return (
                  <li key={id != null ? id : ''}>
                    <Button
                      type={itemSelected ? 'primary' : 'text'}
                      size={size}
                      disabled={disabled || item.disabled}
                      onClick={() => this.onChange(id)}
                    >
                      {item[selectTextKey]}
                    </Button>
                  </li>
                );
              })}
            </ul>
          );
        }}
      </FieldsetContext.Consumer>
    );
  }
}

export default TagSelect;
