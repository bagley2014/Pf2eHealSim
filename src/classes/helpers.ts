import fg from 'fast-glob';

export const getDataFilenames = () => fg.sync('**/classes/**/*.json');
