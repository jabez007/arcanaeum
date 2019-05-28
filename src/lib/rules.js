function required(value) {
  return !!value || value === 0 || 'A value is required';
}

function integer(value) {
  return Number.isInteger(Number(value)) || 'The value must be an integer';
}

function word(value) {
  return !(value || '').replace(/[a-zA-Z]/g, '') || 'The value must be a word';
}

function exactLength(length) {
  return value => (value || '').length === length || `The value must have a length of exactly ${length}`;
}

function positive(value) {
  return (!!value && value > 0) || 'The value must be positive';
}

function minLength(length) {
  return value => (value || '').length >= length || `The value must have a length of at least ${length}`;
}

export default {
  required,
  integer,
  word,
  exactLength,
  positive,
  minLength,
};
