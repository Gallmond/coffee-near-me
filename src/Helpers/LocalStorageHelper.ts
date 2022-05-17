const save = (key: string, data:any): void => {
  console.log('save', key, data);
  if(!window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

const load = (key: string): any => {
  if(!window.localStorage) return;
  const data = window.localStorage.getItem(key);
  console.log('load', key, data);
  return JSON.parse(data);
}

export default {
  load,
  save,
}

