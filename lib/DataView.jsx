import React from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import {
  Table,
  Pagination,
  Button,
  Message,
  MessageBox,
  Dropdown,
  Switch
} from 'element-react';

import { pick } from './utils';
import DataForm from './DataForm';
import FormDialog from './FormDialog';

import './dataview.less';



function isOrderEqual(a, b) {
  if (!a && !b) {
    return true;
  }

  if ((!a && b) || (a && !b)) {
    return false;
  }

  return a.toString().split().sort().join() === b.toString().split().sort().join();
}

@observer
class DataView extends React.Component {
  static blockMap = {
    subTitle: 'Empty',
    description: 'Description',
    addButton: 'AddButton',
    sortSwitch: 'SortSwitch',
    operationBar: 'OperationBar',
    filterPanel: 'FilterPanel',
    table: 'Table',
    tableOperationColumn: 'OperationColumn',
    pagination: 'Pagination',
    form: 'Form'
  };

  static Empty = () => null;

  static SubTitle = observer(({ title, children = null }) => (
    <h4 className="sub-title">
      <strong>{title}</strong>
      {children}
    </h4>
  ));

  static Description = observer(({ description }) => (
    description ? <p className="description">{description}</p> : null
  ));

  static AddButton = observer(({
    type = 'primary',
    creatable,
    onCreate,
    addButtonText = '添加',
    children
  }) => (
    creatable ? <Button type={type} onClick={onCreate}>{addButtonText || children}</Button> : null
  ));

  static SortSwitch = observer(({
    panel,
    store,
    sortable,
    onSortStart
  }) => {
    if (!sortable) {
      return null;
    }

    const { sortEnabled } = panel.state;

    const { ordering, priorityKey } = store;

    const defaultPriorityOrder = ordering.default || [`-${priorityKey}`];

    return (
      <span className="sort-switch">
        手动排序
        <Switch
          onChange={onSortStart}
          value={sortEnabled && isOrderEqual(ordering.current, defaultPriorityOrder)}
        />
      </span>
    );
  });

  static OperationBar = observer((props) => {
    const AddButton = (props.component || {}).addButton
      || DataView.AddButton;

    return (
      <div className="operation-bar">
        <AddButton {...props} />
        <aside>
          <DataView.SortSwitch {...props} />
        </aside>
      </div>
    );
  });

  static FilterPanel = observer(({ store, filterTrigger = 'submit' }) => (
    store.filterFields && store.filterFields.length
      ? (
        <DataForm
          submitText="搜索"
          className="filter-panel"
          fields={store.filterFields}
          model={store.params}
          onSubmit={filterTrigger === 'submit' ? query => store.reload(query) : null}
          onChange={filterTrigger === 'change' ? query => store.reload(query) : null}
          renderOperations={filterTrigger === 'submit' ? undefined : () => null}
        />
      )
      : null
  ));

  static ModifyButton = observer(({
    modifiable,
    onModify,
    row,
    buttonType = 'text',
    buttonSize,
    modifyButtonText = '编辑',
    children
  }) => (
    modifiable
      ? (
        <Button
          type={buttonType}
          size={buttonSize}
          onClick={() => onModify(row)}
        >
          {modifyButtonText || children}
        </Button>
      )
      : null
  ));

  static DeleteButton = observer(({
    deletable,
    onDelete,
    row,
    buttonType = 'text',
    buttonSize,
    deleteButtonText = '删除',
    children
  }) => (
    deletable
      ? (
        <Button
          type={buttonType}
          size={buttonSize}
          onClick={() => onDelete(row)}
        >
          {children || deleteButtonText}
        </Button>
      )
      : null
  ));

  static SortDropdown = observer(({
    panel,
    store,
    sortable,
    onSortEnd,
    row
  }) => {
    const { sortEnabled } = panel.state;
    const { priorityKey, ordering } = store;

    if (!sortable
      || !sortEnabled
      || !ordering.current
      || !ordering.default
      || !isOrderEqual(ordering.current, ordering.default)) {
      return null;
    }

    const orderDirections = ['-', ''];
    const priorityOrder = ordering.current.find(item => item.includes(priorityKey));
    if (priorityOrder) {
      if (priorityOrder[0] === '-') {
        orderDirections.reverse();
      }
    }

    return (
      <Dropdown
        className="component-sort-dropdown"
        onCommand={change => onSortEnd(row, change)}
        menu={(
          <Dropdown.Menu>
            <Dropdown.Item command={`${orderDirections[0]}Infinity`}>最前</Dropdown.Item>
            <Dropdown.Item command={`${orderDirections[0]}1`}>上移</Dropdown.Item>
            <Dropdown.Item command={`${orderDirections[1]}1`} divided>下移</Dropdown.Item>
            <Dropdown.Item command={`${orderDirections[1]}Infinity`}>最后</Dropdown.Item>
          </Dropdown.Menu>
        )}
      >
        <span className="el-dropdown-link">
          排序
          <i className="el-icon-caret-bottom el-icon--right" />
        </span>
      </Dropdown>
    );
  });

  static OperationColumn = observer(props => (
    <React.Fragment>
      <DataView.ModifyButton {...props} />
      <DataView.DeleteButton {...props} />
      <DataView.SortDropdown {...props} />
    </React.Fragment>
  ));

  static Table = observer((props) => {
    const {
      component,
      store,
      tableOptions,
      modifiable,
      deletable,
      sortable,
      managable,
      operationColumn = {}
    } = props;

    const { default: defaultOrdering } = store.ordering;
    // console.log(store.list);
    return (
      <Table
        columns={[
          ...(store.fields.some(item => item.batchEditor) ? [{
            type: 'selection'
          }] : []),
          ...store.columns,
          ...(modifiable || deletable || sortable || managable
            ? [Object.assign({
              label: '操作',
              width: 180,
              className: 'column-type-operations',
              render: (row) => {
                const OperationColumn = (component || {}).tableOperationColumn
                  || DataView.OperationColumn;
                return (
                  <OperationColumn {...props} row={row} />
                );
              }
            }, operationColumn)]
            : []
          )
        ]}
        data={store.list}
        emptyText={store.loading ? '加载中' : '无数据'}
        border
        defaultSort={defaultOrdering && defaultOrdering.length && {
          prop: defaultOrdering[0].replace(/^-/, ''),
          order: defaultOrdering[0][0] === '-' ? 'descending' : 'ascending'
        }}
        {...tableOptions}
      />
    );
  });

  static Pagination = observer(({ store, onPageChange }) => (
    store.pagination && (
      <Pagination
        layout="total, prev, pager, next, jumper"
        total={store.total}
        pageSize={store.ps}
        currentPage={store.page}
        onCurrentChange={onPageChange}
      />
    )
  ));

  static Form = observer(({
    panel,
    title,
    size,
    dialogClass,
    store,
    onSubmit,
    onCancel,
    addButtonText = '添加',
    modifyButtonText = '编辑',
    ...formOptions
  }) => (
    <FormDialog
      ref={panel.form}
      title={`${panel.state.form && panel.state.form.id ? modifyButtonText : addButtonText}${title}`}
      size={size}
      customClass={dialogClass}
      fields={store.formFields}
      model={panel.state.form}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...formOptions}
    />
  ));

  static handleFormInvalidation({ current: form }, data) {
    const errors = {};

    Object.keys(data).forEach((key) => {
      errors[key] = (Array.isArray(data[key]) ? data[key] : [data[key]])
        .map((err) => {
          const field = form.props.fields.find(item => item.prop === key);
          return err.replace(/^"(.+)" /, (field && field.label) || '');
        })
        .join('；');
    });

    DataForm.setValidation(form, errors);
  }

  state = {
    form: null,
    // eslint-disable-next-line react/no-unused-state
    sortEnabled: false
  };

  form = React.createRef();

  componentDidMount() {
    const { defaultParams = {}, store } = this.props;
    store.getAll(Object.keys(store.params).length ? store.params : defaultParams);
  }

  componentWillUnmount() {
    const { store, preserveData = false } = this.props;
    if (!preserveData) {
      store.reset();
    }
  }

  onPageChange = (page) => {
    const { store } = this.props;
    store.getAll(Object.assign(store.params, { page }));
  };

  onCreate = () => {
    this.setState({
      form: {}
    });
  };

  onModify = (row) => {
    this.setState({
      form: toJS(row)
    });
  };

  onDelete = (row) => {
    const {
      store,
      title,
      onError,
      deleteButtonText
      = '删除'
    } = this.props;
    MessageBox.confirm(`${deleteButtonText}${title}不可恢复，是否继续？`, '提示', {
      type: 'warning'
    })
      .then(() => store.remove(row.id))
      .then(() => store.reload())
      .catch((err) => {
        if (err) {
          if (err.request && onError) {
            const { status, response } = err.request;
            const error = JSON.parse(response);
            onError({ status, error });
          } else {
            Message.error({ message: '操作失败' });
          }
        }
      });
  };

  onSubmit = (formData) => {
    const { store, onError } = this.props;
    const { form } = this.state;
    const { [store.idKey]: id } = form;
    let promise;

    if (id) {
      promise = store.update(id, formData);
    } else {
      promise = store.create(formData);
    }

    promise.then(() => {
      this.onCancel();
      Message.success({ message: '操作成功！' });
      store.reload();
    }, (request) => {
      const { status, data } = request.response;
      switch (status) {
        case 422:
          this.constructor.handleFormInvalidation(this.form, data.body);
          break;

        default:
          if (onError) {
            onError({ status, error: data });
          }
      }

      Message.error({ message: '操作失败' });
    });
  };

  onCancel = () => {
    this.setState({
      form: null
    });
  };

  onSortStart = (value) => {
    const { store } = this.props;
    const { params, ordering, priorityKey } = store;

    const defaultPriorityOrder = ordering.default || [priorityKey];

    if (value) {
      if (!isOrderEqual(ordering.current, defaultPriorityOrder)) {
        MessageBox.confirm('必须先恢复到人工排序顺序下才能继续，是否恢复？', '提示', {
          type: 'warning'
        })
          .then(() => store.getAll(params, { order: defaultPriorityOrder }))
          // eslint-disable-next-line react/no-unused-state
          .then(() => this.setState({ sortEnabled: true }))
          .catch(() => {});
      } else {
        // eslint-disable-next-line react/no-unused-state
        this.setState({ sortEnabled: true });
      }
    } else {
      if (!isOrderEqual(ordering.current, defaultPriorityOrder)) {
        store.getAll(params, { order: ordering.default });
      }
      // eslint-disable-next-line react/no-unused-state
      this.setState({ sortEnabled: false });
    }
  };

  onSortEnd = (row, change) => {
    const { store } = this.props;
    const { priorityScopeKeys } = store;
    const where = {};
    priorityScopeKeys.forEach((key) => {
      where[key] = row[key];
    });
    const number = Number(change);
    store.sort(row.id, Number.isFinite(number) ? number : change, where).then(() => {
      Message.success({ message: '操作成功！' });
      store.reload();
    }, (error) => {
      Message.error({ message: error });
    });
  };

  renderDefaultContent() {
    const { children, ...props } = this.props;
    const events = pick(this, [
      'onPageChange',
      'onCreate',
      'onModify',
      'onDelete',
      'onSubmit',
      'onCancel',
      'onSortStart',
      'onSortEnd'
    ]);

    const combinedProps = {
      panel: this,
      ...events,
      ...props
    };

    return (
      <React.Fragment>
        {[
          'subTitle',
          'description',
          'filterPanel',
          'operationBar',
          'table',
          'pagination',
          'form'
        ].map((key) => {
          const Component = (props.component && props.component[key])
            || this.constructor[this.constructor.blockMap[key]];
          return Component ? <Component key={key} {...combinedProps} /> : null;
        })}
      </React.Fragment>
    );
  }

  render() {
    const {
      className,
      children
    } = this.props;

    const content = children ? children(this) : this.renderDefaultContent();

    return (
      <section className={['block-dataview', ...((className || '').toString().split(/[, ]/))].join(' ')}>
        {content}
      </section>
    );
  }
}

export default DataView;
