export enum StyleType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ACCENT = 'accent',
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

interface StyleOptions {
  darken?: number;
  lighten?: number;
  text?: boolean;
}

export const makeLookup = <T>(items: T[], getter: (item: T) => string) => {
  const lookup: {[key: string]: T} = {};
  items.forEach((item) => {
    lookup[getter(item)] = item;
  });
  return lookup;
};

export const makeStyle = (type: StyleType, options?: StyleOptions) => {
  options = options || {};

  if (options.darken !== undefined && options.lighten !== undefined) {
      throw Error('both `darken` and `lighten` cannot be given');
    }

  const validate = (v?: number) => {
      if (v === undefined) { return; }
      if (v >= 0 && v <= 4) { return; }
      throw Error('`darken` or `lighten` must be >= 0 and <= 4, not ' + v);
    };

  validate(options.darken);
  validate(options.lighten);

  let str = `${type}`;

  if (options.lighten !== undefined && options.lighten !== 0) {
      str += `-lighten-${options.lighten}`;
    } else if (options.darken !== undefined && options.darken !== 0) {
      str += `-darken-${options.darken}`;
    }

  if (options.text !== undefined) {
      str += '--text';
    }

  return str;
};

type Color = 'black' | 'white';

export const range = (a: number, b = 0, interval = 1) => {
  let start;
  let end;
  if (a > b) {
    start = 0; end = a;
  } else {
    start = a; end = b;
  }
  const rge = [];
  for (let i = start; i < end; i += interval) {
    rge.push(i);
  }
  return rge;
};

interface OctaveKey {
  value: string;
  color: Color;
  id: number;
}

const octaveKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].reverse();
export const allKeys: OctaveKey[] = [];
let noteNumber = -octaveKeys.length + 1;  // A bit hacky but we want to start at C8 and end at A0
range(0, 9).reverse().forEach((value) => {
  octaveKeys.forEach((key) => {
    if (noteNumber >= 0 && noteNumber < 88) {
      allKeys.push({
        value: `${key}${value}`,
        color: key.endsWith('#') ? 'black' : 'white',
        id: noteNumber,
      });
    }
    noteNumber += 1;
  });
});
