import { observable, action, computed } from 'mobx';

import { pick, isObjectEqual } from './utils';



class ListStore {
  idKey = 'id';

  priorityKey = 'priority';

  priorityScopeKeys = [];

  orderParamKey = 'order';

  fields = [];

  filterFields = [];

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
    this.initialize(options);
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
  initialize(options) {
    Object.assign(this, options);
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
  replace(list = [], on = 'list') {
    this[on] = list;
  }

  // TODO: 'on' param not handled in paged data
  @action.bound
  paged({ rows = [], page, count }) {
    this.list = rows;
    this.page = page;
    this.total = count;
  }

  @action.bound
  setParams(params, {
    pagination = this.pagination,
    order = this.ordering.current || this.ordering.default
  } = {}) {
    const { page, ps } = params || {};
    const same = isObjectEqual(params, this.params) && this.ordering.current === order;
    if (params) {
      this.params = params;
    }
    if (pagination) {
      Object.assign(this, same ? { page } : { page: 1 });
      if (ps) {
        this.ps = ps;
      }
    }
    if (order) {
      this.ordering.current = order;
    }
  }

  @action.bound
  patchParams(params = {}, options) {
    this.setParams({ ...this.params, ...params }, options);
  }

  getParams(options = {}) {
    const { pagination = this.pagination } = options;
    const params = Object.assign({}, this.params, this.getOrderParam());

    // 追加页码参数
    if (pagination) {
      const { page, ps } = this;
      Object.assign(params, { page, ps });
    }

    return params;
  }

  getOrderParam() {
    const ret = {};
    const { current = this.ordering.default, forceHeads = [], forceTails = [] } = this.ordering;
    if (current) {
      // TODO: not considered unique column in all
      ret[this.orderParamKey] = Array.from(new Set([
        ...forceHeads,
        current.toString().split(','),
        ...forceTails
      ])).join();
    }

    return ret;
  }

  async create(data, options = {}) {
    const { url = this.apiPath } = options;

    this.setLoading(true);

    try {
      const response = await this.request.post(url, data);

      this.setLoading(false);

      return response.data;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async get(id = '', options = {}) {
    const { url = `${this.apiPath}/${id}` } = options;

    this.setLoading(true);

    try {
      const response = await this.request.get(url);

      this.setLoading(false);

      this.setItem(response.data);

      return this.item;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async getAll(p, options = {}) {
    const {
      pagination = this.pagination,
      on = 'list',
      url = this.apiPath
    } = options;

    this.setItem(null);

    this.setLoading(true);

    this.setParams(p, options);

    const params = this.getParams(options);

    try {
      const { data } = await this.request.get(url, { params });

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

  reload(query, options) {
    if (this.item) {
      return this.get(this.item[this.idKey]);
    }

    this.patchParams(query, options);

    return this.getAll(this.getParams(options), options);
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

  async remove(id, options = {}) {
    const { url = `${this.apiPath}/${id}` } = options;

    this.setLoading(true);

    try {
      const response = await this.request.delete(url);

      this.setLoading(false);

      return response;
    } catch (error) {
      this.setLoading(false);

      return Promise.reject(error);
    }
  }

  async sort(id, change, { page, ps, ...where } = this.params, options = {}) {
    const { method = 'put', url = `${this.apiPath}/${id}/${this.priorityKey}` } = options;

    this.setLoading(true);

    await this.request[method.toLowerCase()](url, { change }, {
      params: where
    });

    this.setLoading(false);
  }
}

export default ListStore;
