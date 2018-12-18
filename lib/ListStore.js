import { observable, action, computed } from 'mobx';

import { pick } from './utils';



class ListStore {
  idKey = 'id';

  priorityKey = 'priority';

  orderParamKey = 'order';

  fields = [];

  @observable
  loading = false;

  @observable.shallow
  item = null;

  @observable.shallow
  list = [];

  pagination = false;

  @observable
  total = 0;

  @observable
  page = 1;

  @observable
  ps = 10;

  @observable
  ordering = {};

  @observable
  params = {};

  constructor(options) {
    Object.assign(this, options);
  }

  @computed
  get columns() {
    return this.fields
      // when field.render is set to false, will not show that column
      .filter(field => typeof field.render !== 'boolean' || field.render)
      .map(field => pick(field, [
        // table columns could be use
        // 'type', // could be manual added when use
        'columnKey',
        'label',
        'prop',
        'width',
        'minWidth',
        'fixed',
        'render',
        'renderHeader',
        'sortable',
        'sortMethod',
        'resizable',
        'align',
        'headerAlign',
        'className',
        'labelClassName',
        'selectable',
        'reserveSelection',
        'filters',
        'filterPlacement',
        'filterMultiple',
        'filterMethod',
        'filteredValue'
      ]));
  }

  @computed
  get formFields() {
    return this.fields
      .filter(field => Boolean(field.editor))
      .map(field => pick(field, [
        'label',
        'prop',
        'editor', // 'text','select','radios','checkboxes'
        'disabled',
        'readOnly',
        'rules',
        'dataSource',
        'defaultValue',
        'onChange',
        'valueTransformer',
        'editable',
        'ignoreValue'
      ]));
  }

  @action.bound
  setLoading(status) {
    this.loading = status;
  }

  @action.bound
  setItem(item) {
    this.item = item;
  }

  @action.bound
  replace(list, on = 'list') {
    this[on] = list;
  }

  // TODO: 'on' param not handled in paged data
  @action.bound
  paged(data) {
    this.list = data.rows;
    this.page = data.page;
    this.total = data.count;
  }

  @action.bound
  setParams(params = {}, {
    pagination = this.pagination,
    order = this.ordering.current || this.ordering.default
  }) {
    this.params = params;
    if (pagination) {
      Object.assign(this, pick(params, ['page', 'ps']));
    }
    if (order) {
      this.ordering.current = order;
    }
  }

  getOrderParam() {
    const ret = {};
    const { current = this.ordering.default, additional = [] } = this.ordering;
    if (current) {
      ret[this.orderParamKey] = [current, ...additional].join();
    }

    return ret;
  }

  async create(data) {
    this.setLoading(true);

    try {
      const response = await this.request.post(this.apiPath, data);

      this.setLoading(false);

      return response.data;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async get(id = '') {
    this.setLoading(true);

    try {
      const response = await this.request.get(`${this.apiPath}/${id}`);

      this.setLoading(false);

      this.setItem(response.data);

      return this.item;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async getAll(p, options = {}) {
    const { pagination = this.pagination, on = 'list' } = options;

    this.setLoading(true);

    this.setParams(p, options);

    const params = Object.assign({}, this.params, this.getOrderParam());

    // 追加页码参数
    if (pagination) {
      const { page, ps } = this;
      Object.assign(params, { page, ps });
    }

    try {
      const { data } = await this.request.get(this.apiPath, { params });

      this.setLoading(false);

      if (pagination) {
        this.paged(data);
      } else {
        this.replace(data, on);
      }

      return this[on];
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async reload() {
    if (this.item) {
      return this.get(this.item[this.idKey]);
    }

    return this.getAll(this.params);
  }

  reset(on = 'list') {
    this.replace([], on);
    this.setParams({});
    this.ordering.current = this.ordering.default;
    this.page = 1;
    this.total = 0;
  }

  async update(id, data, options = {}) {
    const { method = 'patch', url = `${this.apiPath}/${id}` } = options;

    this.setLoading(true);

    try {
      const response = await this.request[method.toLowerCase()](url, data, options);

      this.setLoading(false);

      return response.data;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async remove(id) {
    this.setLoading(true);

    try {
      const response = await this.request.delete(`${this.apiPath}/${id}`);

      this.setLoading(false);

      return response;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async sort(id, change, where = {}) {
    this.setLoading(true);

    await this.request.put(`${this.apiPath}/${id}/${this.priorityKey}`, { change }, {
      params: where
    });

    this.setLoading(false);
  }
}

export default ListStore;
