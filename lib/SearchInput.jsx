import React from 'react';
import { Input } from 'element-react';



export default class SearchInput extends Input {
  constructor(props) {
    super(props);

    this.state = {
      value: typeof props.value !== 'undefined' ? props.value : props.defaultValue || '',
      textareaStyle: { resize: props.resize }
    };
  }

  handleChange = (ev) => {
    this.setState({ value: ev.target.value });
  };

  handleFocus = super.handleFocus.bind(this);
  handleBlur = super.handleBlur.bind(this);

  handleKeyDown = (ev) => {
    const { onChange } = this.props;

    if (ev.keyCode === 13) {
      ev.preventDefault();
      if (onChange) {
        onChange(ev.target.value);
      }
    }
  };

  render() {
    const {
      type,
      size,
      prepend,
      append,
      icon,
      autoComplete,
      validating,
      rows,
      onMouseEnter,
      onMouseLeave,
      ...otherProps
    } = this.props;

    const classname = this.classNames(
      'el-input-search',
      type === 'textarea' ? 'el-textarea' : 'el-input',
      size && `el-input--${size}`, {
        'is-disabled': this.props.disabled,
        'el-input-group': prepend || append,
        'el-input-group--append': !!append,
        'el-input-group--prepend': !!prepend
      }
    );

    if ('value' in this.props) {
      otherProps.value = this.fixControlledValue(this.props.value);

      delete otherProps.defaultValue;
    }

    delete otherProps.resize;
    delete otherProps.style;
    delete otherProps.autosize;
    delete otherProps.onIconClick;

    if (type === 'textarea') {
      return super.render.call(this);
    }

    return (
      <div
        style={this.style()}
        className={this.className(classname)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        { prepend && <div className="el-input-group__prepend">{prepend}</div> }
        <input
          {...otherProps}
          ref={(ref) => { this.input = ref; }}
          type={type}
          value={this.state.value}
          className="el-input__inner"
          autoComplete={autoComplete}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onKeyDown={this.handleKeyDown}
        />
        { validating && <i className="el-input__icon el-icon-loading" /> }
        { append && <div className="el-input-group__append">{append}</div> }
      </div>
    );
  }
}
