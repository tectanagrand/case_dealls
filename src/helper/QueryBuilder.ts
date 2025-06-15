export const insertQuery = (
  table: string,
  values: any,
  returning: string | null = null,
): [string, string[]] => {
  let valuesArray: any[] = [];

  // Check if values is an array or a single object
  if (Array.isArray(values)) {
    valuesArray = values;
  } else if (typeof values === 'object' && values !== null) {
    valuesArray = [values]; // Wrap the single object in an array
  } else {
    throw new Error('Values should be an object or an array of objects.');
  }

  let columnArray: string[] = [];
  let payloadArray: string[] = [];
  let valueArray: string[] = [];

  // Assuming the first object in the array has all the columns we need
  Object.keys(valuesArray[0]).forEach((key) => {
    columnArray.push(key);
  });

  // Build the payload and value arrays for multiple rows
  valuesArray.forEach((valueObj, rowIndex) => {
    let rowPlaceholders: string[] = [];
    Object.keys(valueObj).forEach((key, colIndex) => {
      rowPlaceholders.push(`$${rowIndex * columnArray.length + colIndex + 1}`);
      valueArray.push(valueObj[key]);
    });
    payloadArray.push(`(${rowPlaceholders.join(', ')})`);
  });

  const columns = columnArray.join(', ');
  const valuesString = payloadArray.join(', ');
  let query = `INSERT INTO ${table} (${columns}) VALUES ${valuesString}`;
  if (returning != null) {
    query += ` RETURNING ${returning}`;
  } else {
    query += ';';
  }

  return [query, valueArray];
};

export const deleteQuery = (table: string, where: any): [string, string[]] => {
  let query = '';
  let valueArray: string[] = [];
  const whereArray = Object.keys(where).map((item, index) => {
    valueArray.push(where[item]);
    return `${item} = $${index + 1}`;
  });
  query = 'DELETE FROM ' + table + ' WHERE ' + whereArray.join(' AND ') + ';';
  return [query, valueArray];
};

export const updateQuery = (
  table: string,
  value: any,
  where: any,
  returning: string | null = null,
): [string, string[]] => {
  let valueArray: string[] = [];
  let setArray: string[] = [];
  let whereArray: string[] = [];
  Object.keys(value).forEach((key, ix) => {
    setArray.push(key + ` = $${ix + 1}`);
  });
  Object.values(value).forEach((v: any) => {
    valueArray.push(v);
  });
  Object.keys(where).forEach((key) => {
    whereArray.push(key + ` = '${where[key]}'`);
  });
  let whereString = whereArray.join(' AND ');
  const setString = setArray.join(', ');
  let query = `UPDATE ${table} SET ${setString} WHERE ${whereString}`;
  if (returning !== null) {
    query += ` RETURNING ${returning}`;
  } else {
    query += ' ;';
  }
  return [query, valueArray];
};
