module.exports = {
  '**/*.(t|j)s?(x)': [() => 'npm run typecheck', 'npm run lint:fix'],
};
