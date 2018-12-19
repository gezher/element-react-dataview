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
    state,
    store,
    sortable,
    onSortStart,
    children = '人工排序'
  }) => {
    if (!sortable) {
      return null;
    }

    const { sortEnabled } = state;

    const { ordering, priorityKey } = store;

    const defaultPriorityOrder = `-${priorityKey}`;

    return (
      <span className="sort-switch">
        {children}
        <Switch
          onChange={onSortStart}
          value={sortEnabled && ordering.current === defaultPriorityOrder}
        />
      </span>
    );
  });

  static OperationBar = observer((props) => {
    const AddButton = (props.context || {}).addButton
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
          onSubmit={filterTrigger === 'submit' ? query => store.getAll(query) : null}
          onChange={filterTrigger === 'change' ? query => store.getAll(query) : null}
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
    state,
    store,
    sortable,
    onSortEnd,
    row
  }) => {
    const { sortEnabled } = state;
    const {
      pagination,
      ps,
      ordering,
      priorityKey
    } = store;

    return sortable && sortEnabled && ordering.current === `-${priorityKey}` ? (
      <Dropdown
        className="component-sort-dropdown"
        onCommand={change => onSortEnd(row, change)}
        menu={(
          <Dropdown.Menu>
            <Dropdown.Item command="Infinity">置顶</Dropdown.Item>
            {pagination ? (
              <Dropdown.Item command={`${ps}`}>上移一页</Dropdown.Item>
            ) : null}
            <Dropdown.Item command="1">上移</Dropdown.Item>
            <Dropdown.Item command="-1" divided>下移</Dropdown.Item>
            {pagination ? (
              <Dropdown.Item command={`${-ps}`}>下移一页</Dropdown.Item>
            ) : null}
            <Dropdown.Item command="-Infinity">沉底</Dropdown.Item>
          </Dropdown.Menu>
        )}
      >
        <span className="el-dropdown-link">
          排序
          <i className="el-icon-caret-bottom el-icon--right" />
        </span>
      </Dropdown>
    ) : null;
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
      context,
      store,
      tableOptions,
      modifiable,
      deletable,
      sortable
    } = props;

    return (
      <Table
        columns={[
          ...(store.fields.some(item => item.batchEditor) ? [{
            type: 'selection'
          }] : []),
          ...store.columns,
          ...(modifiable || deletable || sortable
            ? [{
              label: '操作',
              width: 180,
              className: 'column-type-operations',
              render: (row) => {
                const OperationColumn = (context || {}).tableOperationColumn
                  || DataView.OperationColumn;
                return (
                  <OperationColumn {...props} row={row} />
                );
              }
            }]
            : []
          )
        ]}
        data={[...store.list]}
        emptyText={store.loading ? '加载中' : '无数据'}
        border
        defaultSort={store.ordering.default && {
          prop: store.ordering.default.replace(/^-/, ''),
          order: store.ordering.default[0] === '-' ? 'descending' : 'ascending'
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
    state,
    formRef,
    title,
    size,
    dialogClass,
    store,
    onSubmit,
    onCancel,
    addButtonText = '添加',
    modifyButtonText = '编辑'
  }) => (
    <FormDialog
      ref={formRef}
      title={`${state.form && state.form.id ? modifyButtonText : addButtonText}${title}`}
      size={size}
      customClass={dialogClass}
      fields={store.formFields}
      model={state.form}
      onSubmit={onSubmit}
      onCancel={onCancel}
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
    store.getAll(defaultParams);
  }

  onPageChange = (page) => {
    const { store } = this.props;
    store.getAll({ page });
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

    const defaultPriorityOrder = `-${priorityKey}`;

    if (value) {
      if (ordering.current !== defaultPriorityOrder) {
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
      if (ordering.current !== ordering.default) {
        store.getAll(params, { order: ordering.default });
      }
      // eslint-disable-next-line react/no-unused-state
      this.setState({ sortEnabled: false });
    }
  };

  onSortEnd = (row, change) => {
    const { store } = this.props;
    const number = Number(change);
    store.sort(row.id, Number.isFinite(number) ? number : change).then(() => {
      Message.success({ message: '操作成功！' });
      store.reload();
    }, (error) => {
      Message.error({ message: error });
    });
  };

  renderDefaultContent(context) {
    const { children, component, ...props } = this.props;
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
      context,
      ...events,
      ...props,
      state: this.state,
      formRef: this.form
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
          const Component = (context || {})[key]
            || this.constructor[this.constructor.blockMap[key]];
          return Component ? <Component key={key} {...combinedProps} /> : null;
        })}
      </React.Fragment>
    );
  }

  render() {
    const {
      className,
      component,
      children
    } = this.props;

    let content;

    switch (typeof children) {
      case 'function':
        content = children();
        break;
      case 'undefined':
        content = null;
        break;
      default:
        content = children;
        break;
    }

    if (!content) {
      switch (typeof component) {
        case 'function':
          content = component();
          break;
        case 'object':
          content = component;
          break;
        case 'undefined':
        default:
          content = null;
          break;
      }
    }

    return (
      <section className={['block-dataview', ...((className || '').toString().split(/[, ]/))].join(' ')}>
        {typeof content === 'object'
          ? this.renderDefaultContent(content)
          : content
        }
      </section>
    );
  }
}

export default DataView;
