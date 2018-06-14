import React from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Table, Pagination, Button, Message, MessageBox, Dropdown, Switch } from 'element-react';

import { pick, omit } from './utils';
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
    description ?
      <p className="description">{description}</p> :
      null
  ));

  static AddButton = observer(({ type = 'primary', creatable, onCreate, children = '添加' }) => (
    creatable ? <Button type={type} onClick={onCreate}>{children}</Button> : null
  ));

  static SortSwitch = observer(({ state, store, sortable, onSortStart, children = '人工排序' }) => {
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
    const AddButton = (props.context || {}).addButton ||
      DataView.AddButton;

    return (
      <div className="operation-bar">
        <AddButton {...props} />
        <aside>
          <DataView.SortSwitch {...props} />
        </aside>
      </div>
    );
  });

  static FilterPanel = observer(({ store }) => (
    store.filterFields ?
      <DataForm
        submitText="搜索"
        fields={store.filterFields}
        model={store.params}
        onSubmit={query => store.getAll(query)}
      /> :
      null
  ));

  static ModifyButton = observer(({
    modifiable,
    onModify,
    row,
    buttonType = 'text',
    buttonSize,
    children = '编辑'
  }) => (
    modifiable ?
      <Button
        type={buttonType}
        size={buttonSize}
        onClick={() => onModify(row)}
      >{children}</Button> :
      null
  ));

  static DeleteButton = observer(({
    deletable,
    onDelete,
    row,
    buttonType = 'text',
    buttonSize,
    children = '删除'
  }) => (
    deletable ?
      <Button
        type={buttonType}
        size={buttonSize}
        onClick={() => onDelete(row)}
      >{children}</Button> :
      null
  ));

  static SortDropdown = observer(({ state, store, sortable, onSortEnd, row }) => {
    const { sortEnabled } = state;
    const { pagination, ps, ordering, priorityKey } = store;

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
    const { context, store, tableOptions, modifiable, deletable, sortable } = props;

    return (
      <Table
        columns={[
          ...(store.fields.some(item => item.batchEditor) ? [{
            type: 'selection'
          }] : []),
          ...store.columns,
          ...(modifiable || deletable || sortable ?
            [{
              label: '操作',
              width: 280,
              className: 'column-type-operations',
              render: (row) => {
                const OperationColumn = (context || {}).tableOperationColumn ||
                  DataView.OperationColumn;
                return (
                  <OperationColumn {...omit(props, ['key'])} row={row} />
                );
              }
            }] :
            []
          )
        ]}
        data={[...store.list]}
        emptyText="还没有数据"
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
    store.pagination && <Pagination
      layout="total, prev, pager, next, jumper"
      total={store.total}
      pageSize={store.ps}
      currentPage={store.page}
      onCurrentChange={onPageChange}
    />
  ));

  static Form = observer(({
    state,
    formRef,
    title,
    size,
    dialogClass,
    store,
    onSubmit,
    onCancel
  }) => (
    <FormDialog
      ref={formRef}
      title={`${state.form && state.form.id ? '编辑' : '添加'}${title}`}
      size={size}
      customClass={dialogClass}
      fields={store.formFields}
      model={state.form}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  ));

  state = {
    form: null,
    sortEnabled: false
  };

  componentDidMount() {
    const { defaultParams = {} } = this.props;
    this.props.store.getAll(defaultParams);
  }

  onPageChange = (page) => {
    this.props.store.getAll({ page });
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
    const { store, title, onError } = this.props;
    MessageBox.confirm(`删除${title}不可恢复，是否继续？`, '提示', {
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
      const errors = {};
      switch (status) {
        case 422:
          Object.keys(data.body).forEach((key) => {
            errors[key] = data.body[key].map(err => err.replace(/^".+" /, '')).join('；');
          });
          if (this.form) {
            this.form.setValidation(errors);
          }
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
    const { params, ordering, priorityKey } = this.props.store;

    const defaultPriorityOrder = `-${priorityKey}`;

    if (value) {
      if (ordering.current !== defaultPriorityOrder) {
        MessageBox.confirm('必须先恢复到人工排序顺序下才能继续，是否恢复？', '提示', {
          type: 'warning'
        })
          .then(() => this.props.store.getAll(params, { order: defaultPriorityOrder }))
          .then(() => this.setState({ sortEnabled: true }))
          .catch(() => {});
      } else {
        this.setState({ sortEnabled: true });
      }
    } else {
      if (ordering.current !== ordering.default) {
        this.props.store.getAll(params, { order: ordering.default });
      }
      this.setState({ sortEnabled: false });
    }
  };

  onSortEnd = (row, change) => {
    const number = Number(change);
    this.props.store.sort(row.id, isFinite(number) ? number : change).then(() => {
      Message.success({ message: '操作成功！' });
      this.props.store.reload();
    }, (error) => {
      Message.error({ message: error });
    });
  };

  form = React.createRef();

  renderDefaultContent(context) {
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

    const props = {
      context,
      ...omit(this.props, ['children', 'component']),
      ...events,
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
          const Component = (context || {})[key] ||
            this.constructor[this.constructor.blockMap[key]];
          return Component ? <Component key={key} {...props} /> : null;
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
        {typeof content === 'object' ?
          this.renderDefaultContent(content) :
          content
        }
      </section>
    );
  }
}

export default DataView;
