import { expect } from 'chai';
import { getCharFrequencies, createTree, invertTree, encode, convertToArray } from './index';

describe('test suite', () => {
  it('should have a working test suite', () => {
    expect(true).to.equal(true);
  });
});

describe('getCharFrequencies()', () => {
  it('should count character frequencies', () => {
    const xs = 'foo'.split('');
    expect(getCharFrequencies(xs)).to.eql({ f: 1, o: 2 });
  });
});

describe('createTree()', () => {
  it('should create a tree from frequency table', () => {
    const freq = {
      'a': 1,
      'b': 2,
      'c': 3
    };
    expect(createTree(Object.entries(freq))).to.eql({
      '0': 'c',
      '1': {
        '0': 'a',
        '1': 'b'
      },
    });
  });
});

describe('invertTree()', () => {
  it('should invert the encoding tree', () => {
    const tree = {
      '0': {
        '0': 'a',
      },
      '1': {
        '0': 'b',
        '1': 'c',
      },
    };
    expect(invertTree(tree)).to.eql({ 'a': '00', 'b': '10', 'c': '11' });
  });
});

describe('convertToArray()', () => {
  it('should convert a node tree to an array', () => {
    const tree = {
      '0': {
        '0': 'a',
      },
      '1': {
        '0': 'b',
        '1': 'c',
      },
    };
    expect(convertToArray(tree)).to.eql([['a'],['b','c']]);
  });
});

describe('encode()', () => {
  it('should encode a string', () => {
    const encoded = encode('foo');
    expect(encoded.split(';')[1]).to.equal('011');
  });
});
