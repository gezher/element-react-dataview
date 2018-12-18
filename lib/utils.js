export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
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



export function computeValue(value, dataSet, thisObj) {
  return typeof value === 'function' ? value.call(thisObj, dataSet) : value;
}



export function getPropertyOrValue(item, valueKey) {
  return isPlainObject(item) ? item[valueKey] : item;
}
