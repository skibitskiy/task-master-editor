export const isNil = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};
