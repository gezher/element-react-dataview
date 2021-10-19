import editors from './editors';
import { useDataFormContext } from './DataForm';
import { useFieldsetContext } from './Fieldset';



export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}



export function isObjectEqual(a, b) {
  return (Boolean(a) && Boolean(b))
    && Object.keys(a).sort().join() === Object.keys(b).sort().join()
    && Object.values(a).sort().join() === Object.values(b).sort().join();
}



export function pick(obj, keys) {
  const result = {};
  keys.forEach((key) => {
    if (key in Object(obj)) {
      result[key] = obj[key];
    }
  });

  return result;
}



export function omit(obj, keys) {
  const allKeys = new Set(Object.keys(obj));
  keys.forEach((key) => {
    allKeys.delete(key);
  });
  return pick(obj, [...allKeys]);
}



export function getByNamespace(data, path) {
  if (data == null) {
    return data;
  }

  const paths = path.split('.');
  let result = data;
  for (let i = 0; i < paths.length; i += 1) {
    result = result[paths[i]];
    if (result == null) {
      break;
    }
  }

  return result;
}



export function setByNamespace(data, path, value) {
  const paths = path.split('.');
  let operand = data;
  for (let i = 0; i < paths.length; i += 1) {
    if (i < paths.length - 1) {
      if (operand[paths[i]] == null) {
        operand[paths[i]] = Number.isNaN(parseInt(paths[i + 1], 10)) ? {} : [];
      }
      operand = operand[paths[i]];
    } else {
      operand[paths[i]] = value;
    }
  }

  return data;
}



export function computeValue(value, dataSet, model, thisObj) {
  return typeof value === 'function' ? value.call(thisObj, dataSet, model) : value;
}



export function getPropertyOrValue(item, valueKey) {
  return isPlainObject(item) ? item[valueKey] : item;
}



// for legacy API
export function getEditorOptions({ editor, ...options }) {
  const name = options.name || options.prop;
  Object.assign(options, { name });
  if (typeof editor === 'string') {
    return { ...options, Editor: editors[editor] || editors.text };
  }

  if (isPlainObject(editor)) {
    return getEditorOptions({ ...options, ...(editor.options || {}), editor: editor.component });
  }

  return { ...options, Editor: editor };
}


export function useSelectableContext(props) {
  const { data } = useFieldsetContext();
  const { model } = useDataFormContext();
  const {
    value,
    dataSource,
    selectValueKey = 'id',
    selectTextKey = 'name',
    multiple: propsMutiple
  } = props;

  const selectableData = computeValue(dataSource, data, model);
  const multiple = computeValue(propsMutiple, data, model);
  let valueArray = [];
  if (typeof value !== 'undefined') {
    valueArray = Array.isArray(value) ? value : [value];
  }
  const selected = multiple
    ? valueArray.map(item => getPropertyOrValue(item, selectValueKey))
      .filter(v => typeof selectableData.find(item => v === item[selectValueKey]) !== 'undefined')
    : getPropertyOrValue(value, selectValueKey);

  return {
    selectableData,
    selected,
    multiple,
    selectValueKey,
    selectTextKey
  };
}
