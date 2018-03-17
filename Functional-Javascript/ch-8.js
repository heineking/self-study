// lazy chaining
// this is useful for APIs around the use of objects. It might not be all that 
// great of an approach with functional APIs

class LazyChain {
  constructor(target) {
    this._target = target;
    this._calls = [];
  }
  invoke(methodName, ...args) {
    this._calls.push(target => {
      let method = target[methodName];
      return method.apply(target, args);
    });
    return this;
  }
  tap(f) {
    this._calls.push(target => {
      f(target);
      return target;
    });
    return this;
  }
  run() {
    return this._calls.reduce((target, thunk) => thunk(target), this._target);
  }
}

new LazyChain([2,1,3]).invoke('sort')._calls;
//=> [function(target) {...}]

/*
 The wrapped function is a 'thunk.' A thunk is a function that has wrapped some
 behavior and is waiting to be called.
*/

let lazySort = new LazyChain([2,1,3]).invoke('sort');
let lazilySorted = lazySort.run();
//=> [1,2,3]

let lazier = new LazyChain([2,1,3])
  .invoke('concat', [8,5,7,6])
  .invoke('sort')
  .invoke('join', ' ');

let lazierResult = lazier.run();
//=> '1 2 3 4 5 6 7 8'

let revealingLazy = new LazyChain([2, 1, 3])
  .invoke('sort')
  // .tap(o => console.log(o)) //<= outputs to console.log
  .invoke('join', ' ')
  .run();

/*
  The lazy chain is challenging because it is is mutating a shared reference with
  each chained function. A better approach would be to use the pipe(...) which will
  pass foward the pipeline
*/

const pipe = (...fns) => fns.reduce((a,b) => (...args) => b(a(...args)));
const shouldBe8 = pipe(n => n+1, n => n*2)(3);
//=> 8

// some examples of using and composing with pipe(...)
const rest = ([head, ...tail]) => tail;
const first = ([head]) => head;

const fifth = pipe(
  rest,
  rest,
  rest,
  rest,
  first
);

let ex1 = fifth([1,2,3,4,5]);
//=> 5

const negativeFifth = pipe(fifth, n => -n);
const ex2 = negativeFifth([1,2,3,4,5]);
//=> -5

/*
  Let's use this new utility to create a functional API for our table data example
  from chapter 2 
*/

function curryN(length, received, fn) {
  return (...args) => {
    const combined = [...received, ...args];
    const left = length - combined.length;
    return left <= 0
      ? fn.apply(this, combined)
      : curryN(length, combined, fn);
  }
}

function curry(fn) {
 return curryN(fn.length, [], fn);
}

//:: [string] -> object -> object
const pick = curry((xs, obj) =>
  Object.keys(obj)
    .reduce((acc, key) =>
      xs.includes(key)
      ? Object.assign(acc, { [key]: obj[key] })
      : acc,
      {}
    )
  );

//:: [string] -> object -> object
const omit = curry((xs, obj) =>
  Object.keys(obj)
    .filter(key => !xs.includes(key))
    .reduce((acc, key) =>
      Object.assign(acc, { [key]: obj[key]}),
      {}
    )
  );

//:: [object] -> object -> object
const rename = curry((renames, obj) =>
  Object.keys(obj)
    .reduce((acc, key) =>
      renames[key]
      ? Object.assign(acc, { [renames[key]]: obj[key] })
      : acc,
      omit(Object.keys(renames), obj)
    )
  );

//:: [string] -> [object] -> [object]
const project = curry((xs, table) => table.map(row => pick(xs, row)));

//:: object -> [object] -> [object]
const columnAs = curry((x, table) => table.map(row => rename(x, row)));

//:: (a -> boolean) -> a -> [a]
const where = curry((pred, xs) => xs.filter(pred));

//:: [string] -> [object] -> [b]
const pluck = curry((x, ys) => ys.map(y => y[x]));

// examples
const book = (title, isbn, ed, pages) => ({ isbn, title, ed, pages });

const table = [
  book('Don Quixote', '123-457-890', 1, 300),
  book('Hamlet', '444-222-111', 2, 200),
  book('Moby Dick', '777-282-999', 5, 600)
];

const getFirstEditions = pipe(
  columnAs({ ed: 'edition' }),
  project(['title', 'edition', 'isbn']),
  where(book => book.edition === 1)
);

const getBooksLongerThanPage = n => pipe(
  project(['title', 'pages', 'ed']),
  where(book => book.pages > n)
)

const firstEds = getFirstEditions(table);
//=> Don Quixote

const over200 = getBooksLongerThanPage(200);
const booksOver200 = over200(table);
//=> Don Quixote, Moby Dick

const findOver200AndFirstEds = pipe(over200, getFirstEditions);
const firstEdsOver200 = findOver200AndFirstEds(table);
//=> Don Quixote
