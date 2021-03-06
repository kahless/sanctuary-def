/* global define, self */

;(function(f) {

  'use strict';

  /* istanbul ignore else */
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = f();
  } else if (typeof define === 'function' && define.amd != null) {
    define([], f);
  } else {
    self.sanctuaryDef = f();
  }

}(function() {

  'use strict';

  var $ = {};

  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;

  var LEFT_SINGLE_QUOTATION_MARK = '\u2018';
  var RIGHT_SINGLE_QUOTATION_MARK = '\u2019';

  var push              = Array.prototype.push;
  var hasOwnProperty    = Object.prototype.hasOwnProperty;
  var toString          = Object.prototype.toString;

  //  K :: a -> b -> a
  var K = function(x) { return function(y) { return x; }; };

  //  all :: ([a], (a -> Boolean)) -> Boolean
  var all = function(xs, pred) {
    for (var idx = 0; idx < xs.length; idx += 1) {
      if (!pred(xs[idx])) return false;
    }
    return true;
  };

  //  always :: a -> (-> a)
  var always = function(x) { return function() { return x; }; };

  //  any :: ([a], (a -> Boolean)) -> Boolean
  var any = function(xs, pred) {
    for (var idx = 0; idx < xs.length; idx += 1) {
      if (pred(xs[idx])) return true;
    }
    return false;
  };

  //  chain :: ([a], (a -> [b])) -> [b]
  var chain = function(xs, f) {
    var result = [];
    for (var idx = 0; idx < xs.length; idx += 1) {
      push.apply(result, f(xs[idx]));
    }
    return result;
  };

  //  eqProps :: String -> Object -> Object -> Boolean
  var eqProps = function(key) {
    return function(o1) {
      return function(o2) {
        return o1[key] === o2[key];
      };
    };
  };

  //  filter :: ([a], (a -> Boolean)) -> [a]
  var filter = function(xs, pred) {
    var result = [];
    for (var idx = 0; idx < xs.length; idx += 1) {
      if (pred(xs[idx])) {
        result.push(xs[idx]);
      }
    }
    return result;
  };

  //  has :: (String, Object) -> Boolean
  var has = function(key, obj) { return hasOwnProperty.call(obj, key); };

  //  id :: a -> a
  var id = function(x) { return x; };

  //  isEmpty :: [a] -> Boolean
  var isEmpty = function(xs) { return xs.length === 0; };

  //  keys :: Object -> [String]
  var keys = function(obj) {
    var result = [];
    for (var key in obj) if (has(key, obj)) result.push(key);
    return result.sort();
  };

  //  map :: ([a], (a -> b)) -> [b]
  var map = function(xs, f) {
    var result = [];
    for (var idx = 0; idx < xs.length; idx += 1) result.push(f(xs[idx]));
    return result;
  };

  //  or :: ([a], [a]) -> [a]
  var or = function(xs, ys) { return isEmpty(xs) ? ys : xs; };

  //  prefix :: String -> String -> String
  var prefix = function(x) {
    return function(y) {
      return x + y;
    };
  };

  //  quote :: String -> String
  var quote = function(s) {
    var escaped = s
      .replace(/\\/g, '\\\\')
      // \b matches word boundary; [\b] matches backspace
      .replace(/[\b]/g, '\\b')
      .replace(/\f/g, '\\f')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0');

    return '"' + escaped.replace(/"/g, '\\"') + '"';
  };

  //  range :: (Number, Number) -> [Number]
  var range = function(start, stop) {
    var result = [];
    for (var n = start; n < stop; n += 1) result.push(n);
    return result;
  };

  //  strRepeat :: (String, Integer) -> String
  var strRepeat = function(s, times) {
    return Array(times + 1).join(s);
  };

  //  r :: Char -> String -> String
  var r = function(c) {
    return function(s) {
      return strRepeat(c, s.length);
    };
  };

  //  _ :: String -> String
  var _ = r(' ');

  //  toPairs :: StrMap a -> [Pair String a]
  var toPairs = function(obj) {
    return map(keys(obj), function(k) { return [k, obj[k]]; });
  };

  //  trimTrailingSpaces :: String -> String
  var trimTrailingSpaces = function(s) {
    return s.replace(/[ ]+$/, '');
  };

  //  unlines :: [String] -> String
  var unlines = function(lines) {
    var s = '';
    for (var idx = 0; idx < lines.length; idx += 1) s += lines[idx] + '\n';
    return s;
  };

  //  when :: (Boolean, (a -> a), a) -> a
  var when = function(bool, f, x) {
    return bool ? f(x) : x;
  };

  //  stripNamespace :: String -> String
  var stripNamespace = function(s) { return s.slice(s.indexOf('/') + 1); };

  //  typeOf :: a -> String
  var typeOf = function(x) {
    return toString.call(x).slice('[object '.length, -']'.length);
  };

  var _show = function show(x, seen) {
    var recur = function(y) {
      var xs = seen.concat([x]);
      return xs.indexOf(y) >= 0 ? '<Circular>' : show(y, xs);
    };

    //  formatKeyVal :: Object -> String -> String
    var formatKeyVal = function(obj) {
      return function(key) {
        return quote(key) + ': ' + recur(obj[key]);
      };
    };

    switch (typeOf(x)) {
      case 'Arguments':
        return '(function() { return arguments; }(' +
               map(x, recur).join(', ') + '))';
      case 'Array':
        var reprs = map(x, recur).concat(chain(keys(x), function(k) {
          return /^\d+$/.test(k) ? [] : [formatKeyVal(x)(k)];
        }));
        return '[' + reprs.join(', ') + ']';
      case 'Boolean':
        return typeof x === 'object' ?
          'new Boolean(' + recur(x.valueOf()) + ')' :
          x.toString();
      case 'Date':
        return 'new Date(' +
               (isNaN(x.valueOf()) ? recur(NaN) : quote(x.toISOString())) +
               ')';
      case 'Null':
        return 'null';
      case 'Number':
        return typeof x === 'object' ?
          'new Number(' + recur(x.valueOf()) + ')' :
          1 / x === -Infinity ? '-0' : x.toString(10);
      case 'String':
        return typeof x === 'object' ?
          'new String(' + recur(x.valueOf()) + ')' :
          quote(x);
      case 'Undefined':
        return 'undefined';
      default:
        if (typeof x.toString === 'function') {
          var repr = x.toString();
          if (repr !== '[object Object]') return repr;
        }
        return '{' + map(keys(x), formatKeyVal(x)).join(', ') + '}';
    }
  };

  //  show :: a -> String
  var show = function(x) { return _show(x, []); };

  //  TypeClass :: (String, (a -> Boolean)) -> TypeClass
  $.TypeClass = function(name, test) {
    return {
      name: name,
      test: test,
      toString: always(stripNamespace(name))
    };
  };

  //  Any :: Type
  var Any = {
    '@@type': 'sanctuary-def/Type',
    type: 'ANY',
    test: K(true),
    toString: always('Any')
  };

  //  Unknown :: Type
  var Unknown = {
    '@@type': 'sanctuary-def/Type',
    type: 'UNKNOWN',
    test: K(true),
    toString: always('???')
  };

  //  Inconsistent :: Type
  var Inconsistent = {
    '@@type': 'sanctuary-def/Inconsistent',
    type: 'INCONSISTENT',
    test: K(false),
    toString: always('???')
  };

  //  TypeVariable :: String -> Type
  $.TypeVariable = function(name) {
    return {
      '@@type': 'sanctuary-def/Type',
      type: 'VARIABLE',
      name: name,
      test: K(true),
      toString: always(name)
    };
  };

  //  NullaryType :: (String, (x -> Boolean)) -> Type
  var NullaryType = $.NullaryType = function(name, test) {
    return {
      '@@type': 'sanctuary-def/Type',
      type: 'NULLARY',
      name: name,
      test: test,
      toString: always(stripNamespace(name))
    };
  };

  //  UnaryType :: (String, (x -> Boolean), (t a -> [a])) -> Type -> Type
  var UnaryType = $.UnaryType = function(name, test, _1) {
    return function($1) {
      var format = function(f, f$1) {
        return f('(' + stripNamespace(name) + ' ') + f$1(String($1)) + f(')');
      };
      return {
        '@@type': 'sanctuary-def/Type',
        type: 'UNARY',
        name: name,
        test: function(x) { return test(x) && all(_1(x), $1.test); },
        format: format,
        toString: always(format(id, id)),
        _1: _1,
        $1: $1
      };
    };
  };

  //  UnaryType.from :: Type -> (Type -> Type)
  UnaryType.from = function(t) {
    return UnaryType(t.name, t.test, t._1);
  };

  //  BinaryType :: (String, (x -> Boolean), (t a b -> [a]), (t a b -> [b])) ->
  //                  (Type, Type) -> Type
  var BinaryType = $.BinaryType = function(name, test, _1, _2) {
    return function($1, $2) {
      var format = function(f, f$1, f$2) {
        return f('(' + stripNamespace(name) + ' ') +
               f$1(String($1)) + f(' ') + f$2(String($2)) + f(')');
      };
      return {
        '@@type': 'sanctuary-def/Type',
        type: 'BINARY',
        name: name,
        test: function(x) { return test(x) && all(_1(x), $1.test) &&
                                              all(_2(x), $2.test); },
        format: format,
        toString: always(format(id, id, id)),
        _1: _1,
        _2: _2,
        $1: $1,
        $2: $2
      };
    };
  };

  //  BinaryType.from :: Type -> ((Type, Type) -> Type)
  BinaryType.from = function(t) {
    return BinaryType(t.name, t.test, t._1, t._2);
  };

  //  BinaryType.xprod :: (Type, [Type], [Type]) -> [Type]
  BinaryType.xprod = function(t, $1s, $2s) {
    var specialize = BinaryType.from(t);
    return chain($1s, function($1) {
      return map($2s, function($2) {
        return specialize($1, $2);
      });
    });
  };

  //  EnumType :: [Any] -> Type
  var EnumType = $.EnumType = function(members) {
    var types = map(members, $$type);
    var reprs = map(members, show);
    return {
      '@@type': 'sanctuary-def/Type',
      type: 'ENUM',
      test: function(x) {
        //  We use `show` to perform value-based equality checks (since we
        //  don't have access to `R.equals` and don't want to implement it).
        //  We avoid a lot of unnecessary work by checking the type of `x`
        //  before determining its string representation. Only if `x` is of
        //  the same type as one or more of the `members` do we incur the
        //  cost of determining its string representation.
        return types.indexOf($$type(x)) >= 0 && reprs.indexOf(show(x)) >= 0;
      },
      toString: always('(' + reprs.join(' | ') + ')')
    };
  };

  //  RecordType :: {Type} -> Type
  var RecordType = $.RecordType = function(fields) {
    var names = keys(fields);

    //  invalidMappings :: [String]
    var invalidMappings = chain(names, function(name) {
      return $$type(fields[name]) === 'sanctuary-def/Type' ?
        [] :
        [show(name) + ': ' + show(fields[name])];
    });

    if (!isEmpty(invalidMappings)) {
      throw new TypeError(unlines([
        'Invalid values',
        '',
        'The argument to ‘RecordType’ must be an object mapping field name to type.',
        '',
        'The following mappings are invalid:',
        '',
        map(invalidMappings, prefix('  - ')).join('\n')
      ]));
    }

    return {
      '@@type': 'sanctuary-def/Type',
      type: 'RECORD',
      test: function(x) {
        if (x == null) return false;
        for (var idx = 0; idx < names.length; idx += 1) {
          var name = names[idx];
          if (!has(name, x) || !fields[name].test(x[name])) return false;
        }
        return true;
      },
      toString: function() {
        var s = '{';
        for (var idx = 0; idx < names.length; idx += 1) {
          var name = names[idx];
          s += idx === 0 ? ' ' : ', ';
          s += name + ' :: ' + fields[name];
          if (idx === names.length - 1) s += ' ';
        }
        return s + '}';
      },
      fields: fields
    };
  };

  //  Nullable :: Type -> Type
  $.Nullable = UnaryType(
    'sanctuary-def/Nullable',
    K(true),
    function(nullable) { return nullable === null ? [] : [nullable]; }
  );

  //  $$type :: a -> String
  var $$type = function(x) {
    return x != null && typeOf(x['@@type']) === 'String' ?
      x['@@type'] :
      typeOf(x);
  };

  //  $$typeEq :: String -> a -> Boolean
  var $$typeEq = function(name) {
    return function(x) {
      return $$type(x) === name;
    };
  };

  //  type0 :: String -> Type
  var type0 = function(name) {
    return NullaryType(name, $$typeEq(name));
  };

  //  type1 :: (String, (t a -> [a])) -> Type -> Type
  var type1 = function(name, _1) {
    return UnaryType(name, $$typeEq(name), _1);
  };

  //  $.env :: [Type]
  $.env = [
    ($.Any        = Any),
    ($.Array      = type1('Array', id)),
    ($.Boolean    = type0('Boolean')),
    ($.Date       = type0('Date')),
    ($.Error      = type0('Error')),
    ($.Function   = type0('Function')),
    ($.Null       = type0('Null')),
    ($.Number     = type0('Number')),
    ($.Object     = type0('Object')),
    ($.RegExp     = type0('RegExp')),
    ($.String     = type0('String')),
    ($.Undefined  = type0('Undefined'))
  ];

  //  ValidDate :: Type
  $.ValidDate = NullaryType(
    'sanctuary-def/ValidDate',
    function(x) { return $.Date.test(x) && !isNaN(x.valueOf()); }
  );

  //  PositiveNumber :: Type
  $.PositiveNumber = NullaryType(
    'sanctuary-def/PositiveNumber',
    function(x) { return $.Number.test(x) && x > 0; }
  );

  //  NegativeNumber :: Type
  $.NegativeNumber = NullaryType(
    'sanctuary-def/NegativeNumber',
    function(x) { return $.Number.test(x) && x < 0; }
  );

  //  ValidNumber :: Type
  var ValidNumber = $.ValidNumber = NullaryType(
    'sanctuary-def/ValidNumber',
    function(x) { return $.Number.test(x) && !isNaN(x); }
  );

  //  NonZeroValidNumber :: Type
  $.NonZeroValidNumber = NullaryType(
    'sanctuary-def/NonZeroValidNumber',
    function(x) { return ValidNumber.test(x) && x != 0; }
  );

  //  FiniteNumber :: Type
  var FiniteNumber = $.FiniteNumber = NullaryType(
    'sanctuary-def/FiniteNumber',
    function(x) { return ValidNumber.test(x) && isFinite(x); }
  );

  //  PositiveFiniteNumber :: Type
  $.PositiveFiniteNumber = NullaryType(
    'sanctuary-def/PositiveFiniteNumber',
    function(x) { return FiniteNumber.test(x) && x > 0; }
  );

  //  NegativeFiniteNumber :: Type
  $.NegativeFiniteNumber = NullaryType(
    'sanctuary-def/NegativeFiniteNumber',
    function(x) { return FiniteNumber.test(x) && x < 0; }
  );

  //  NonZeroFiniteNumber :: Type
  $.NonZeroFiniteNumber = NullaryType(
    'sanctuary-def/NonZeroFiniteNumber',
    function(x) { return FiniteNumber.test(x) && x != 0; }
  );

  //  Integer :: Type
  var Integer = $.Integer = NullaryType(
    'sanctuary-def/Integer',
    function(x) {
      return ValidNumber.test(x) &&
             Math.floor(x) == x &&
             x >= MIN_SAFE_INTEGER &&
             x <= MAX_SAFE_INTEGER;
    }
  );

  //  PositiveInteger :: Type
  $.PositiveInteger = NullaryType(
    'sanctuary-def/PositiveInteger',
    function(x) { return Integer.test(x) && x > 0; }
  );

  //  NegativeInteger :: Type
  $.NegativeInteger = NullaryType(
    'sanctuary-def/NegativeInteger',
    function(x) { return Integer.test(x) && x < 0; }
  );

  //  NonZeroInteger :: Type
  $.NonZeroInteger = NullaryType(
    'sanctuary-def/NonZeroInteger',
    function(x) { return Integer.test(x) && x != 0; }
  );

  //  RegexFlags :: Type
  $.RegexFlags = EnumType(['', 'g', 'i', 'm', 'gi', 'gm', 'im', 'gim']);

  //  arity :: (Number, Function) -> Function
  var arity = function(n, f) {
    return (
      n === 0 ?
        function() {
          return f.apply(this, arguments);
        } :
      n === 1 ?
        function($1) {
          return f.apply(this, arguments);
        } :
      n === 2 ?
        function($1, $2) {
          return f.apply(this, arguments);
        } :
      n === 3 ?
        function($1, $2, $3) {
          return f.apply(this, arguments);
        } :
      n === 4 ?
        function($1, $2, $3, $4) {
          return f.apply(this, arguments);
        } :
      n === 5 ?
        function($1, $2, $3, $4, $5) {
          return f.apply(this, arguments);
        } :
      n === 6 ?
        function($1, $2, $3, $4, $5, $6) {
          return f.apply(this, arguments);
        } :
      n === 7 ?
        function($1, $2, $3, $4, $5, $6, $7) {
          return f.apply(this, arguments);
        } :
      n === 8 ?
        function($1, $2, $3, $4, $5, $6, $7, $8) {
          return f.apply(this, arguments);
        } :
      // else
        function($1, $2, $3, $4, $5, $6, $7, $8, $9) {
          return f.apply(this, arguments);
        }
    );
  };

  //  numArgs :: Number -> String
  var numArgs = function(n) {
    switch (n) {
      case  0:  return  'zero arguments';
      case  1:  return   'one argument' ;
      case  2:  return   'two arguments';
      case  3:  return 'three arguments';
      case  4:  return  'four arguments';
      case  5:  return  'five arguments';
      case  6:  return   'six arguments';
      case  7:  return 'seven arguments';
      case  8:  return 'eight arguments';
      case  9:  return  'nine arguments';
      default:  return  n + ' arguments';
    }
  };

  //  rejectAny :: Type -> [Type]
  var rejectAny = function recur(t) {
    switch (t.type) {
      case 'ANY':
        return [];
      case 'UNARY':
        return map(recur(t.$1), UnaryType.from(t));
      case 'BINARY':
        return BinaryType.xprod(t, recur(t.$1), recur(t.$2));
      default:
        return [t];
    }
  };

  //  unexpectedType :: Any -> TypeError
  var unexpectedType = /* istanbul ignore next */ function(x) {
    return new TypeError(
      'Unexpected type ' +
      LEFT_SINGLE_QUOTATION_MARK + x + RIGHT_SINGLE_QUOTATION_MARK
    );
  };

  //  equalTypes :: (Type, Type, Boolean) -> Boolean
  var equalTypes = function equalTypes(t1, t2, loose) {
    if (t1.type === 'INCONSISTENT' || t2.type === 'INCONSISTENT') return loose;
    if (t1.type === 'UNKNOWN' || t2.type === 'UNKNOWN') return true;
    switch (t1.type) {
      case 'NULLARY':
        return t1.type === t2.type && t1.name === t2.name;
      case 'UNARY':
        return t1.type === t2.type && t1.name === t2.name &&
               equalTypes(t1.$1, t2.$1, loose);
      case 'BINARY':
        return t1.type === t2.type && t1.name === t2.name &&
               equalTypes(t1.$1, t2.$1, loose) &&
               equalTypes(t1.$2, t2.$2, loose);
      case 'ENUM':
        return t1.type === t2.type && show(t1) === show(t2);
      case 'RECORD':
        return t1.type === t2.type && show(t1) === show(t2);
      /* istanbul ignore next */
      default:
        throw unexpectedType(t1.type);
    }
  };

  //  commonTypes :: ([[Type]], Boolean) -> [Type]
  var commonTypes = function(typeses, loose) {
    var types = chain(typeses, id);
    if (isEmpty(types)) return [];

    var $1s, $2s, candidates, idx, t;
    if (types[0].type === 'UNARY') {
      $1s = {};
      for (idx = 0; idx < types.length; idx += 1) {
        t = types[idx];
        if (t.$1.type !== 'UNKNOWN') $1s[t.$1.name] = t.$1;
      }
      candidates =
      map(or(map(keys($1s), function(k) { return $1s[k]; }), [Unknown]),
          UnaryType.from(types[0]));
    } else if (types[0].type === 'BINARY') {
      $1s = {};
      $2s = {};
      for (idx = 0; idx < types.length; idx += 1) {
        t = types[idx];
        if (t.$1.type !== 'UNKNOWN') $1s[t.$1.name] = t.$1;
        if (t.$2.type !== 'UNKNOWN') $2s[t.$2.name] = t.$2;
      }
      candidates = BinaryType.xprod(
        types[0],
        or(map(keys($1s), function(k) { return $1s[k]; }), [Unknown]),
        or(map(keys($2s), function(k) { return $2s[k]; }), [Unknown])
      );
    } else {
      candidates = types;
    }

    return filter(candidates, function(t1) {
      return all(typeses, function(types) {
        return any(types, function(t2) {
          return equalTypes(t1, t2, loose);
        });
      });
    });
  };

  //  filterTypesByValues :: ([Type], [Any]) -> [Type]
  var filterTypesByValues = function(types, values) {
    return filter(types, function(t) {
      return all(values, t.test);
    });
  };

  //  ordinals :: [String]
  var ordinals = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth'
  ];

  var invalidArgumentsLength = function(name, expectedLength, actualLength) {
    return new TypeError(
      LEFT_SINGLE_QUOTATION_MARK + name + RIGHT_SINGLE_QUOTATION_MARK +
      ' requires ' + numArgs(expectedLength) + ';' +
      ' received ' + numArgs(actualLength)
    );
  };

  var typeNotInEnvironment = function(env, name, type) {
    return new TypeError(unlines([
      'Definition of ' + LEFT_SINGLE_QUOTATION_MARK + name + RIGHT_SINGLE_QUOTATION_MARK +
        ' references ' + type.name + ' which is not in the environment:',
      '',
      map(chain(env, rejectAny), prefix('  - ')).join('\n')
    ]));
  };

  var invalidArgument = function(name, types, value, index) {
    return new TypeError(
      LEFT_SINGLE_QUOTATION_MARK + name + RIGHT_SINGLE_QUOTATION_MARK +
      ' expected a value of type ' + types.join(' or ') + ' as its ' +
      ordinals[index] + ' argument; received ' + show(value)
    );
  };

  //  constraintsRepr :: StrMap [Type] -> String
  var constraintsRepr = function(constraints) {
    var reprs = chain(toPairs(constraints), function(pair) {
      return map(pair[1], function(typeClass) {
        return stripNamespace(typeClass.name) + ' ' + pair[0];
      });
    });
    return when(reprs.length > 0,
                function(s) { return s + ' => '; },
                when(reprs.length > 1,
                     function(s) { return '(' + s + ')'; },
                     reprs.join(', ')));
  };

  //  label :: String -> String -> String
  var label = function(label) {
    return function(s) {
      var delta = s.length - label.length;
      return strRepeat(' ', Math.floor(delta / 2)) + label +
             strRepeat(' ', Math.ceil(delta / 2));
    };
  };

  //  arrowJoin :: [String] -> String
  var arrowJoin = function(xs) {
    return xs.join(' -> ');
  };

  //  isParameterizedType :: Object -> Boolean
  var isParameterizedType = function(t) {
    return t.type === 'UNARY' || t.type === 'BINARY';
  };

  //  showType :: Type -> String
  var showType = function(t) {
    var s = String(t);
    return isParameterizedType(t) ? s.slice(1, -1) : s;
  };

  //  showTypeSig :: [Type] -> String
  var showTypeSig = function(types) {
    return arrowJoin(map(types, showType));
  };

  //  showTypeSig_ :: [Type] -> String
  var showTypeSig_ = function(types) {
    return arrowJoin(map(types, showType).concat(['']));
  };

  //  _showTypeSig :: [Type] -> String
  var _showTypeSig = function(types) {
    return arrowJoin([''].concat(map(types, showType)));
  };

  //  _showTypeSig_ :: [Type] -> String
  var _showTypeSig_ = function(types) {
    return arrowJoin([''].concat(map(types, showType)).concat(['']));
  };

  //  showValueAndType :: Pair Any [Type] -> String
  var showValueAndType = function(pair) {
    return show(pair[0]) + ' :: ' + map(pair[1], showType).join(', ');
  };

  //  constraintViolation ::
  //  (String, StrMap [Type], [Type], Any, Integer, [Type], String, TypeClass)
  //  -> Error
  var constraintViolation = function(name, constraints, expTypes, value, index,
                                     actualTypes, typeVarName, typeClass) {
    var reprs = chain(toPairs(constraints), function(pair) {
      return map(pair[1], function(tc) {
        var match = tc.name === typeClass.name && pair[0] === typeVarName;
        return r(match ? '^' : ' ')(stripNamespace(tc.name) + ' ' + pair[0]);
      });
    });

    var carets = when(reprs.length > 1,
                      function(s) { return _('(') + s + _(')'); },
                      reprs.join(_(', ')));

    var padding = _(showTypeSig_(expTypes.slice(0, index)));

    return new TypeError(unlines([
      'Type-class constraint violation',
      '',
      name + ' :: ' + constraintsRepr(constraints) + showTypeSig(expTypes),
      _(name + ' :: ') + carets + _(' => ') + padding + r('^')(typeVarName),
      _(name + ' :: ' + carets + ' => ') + padding + label('1')(typeVarName),
      '',
      '1)  ' + showValueAndType([value, actualTypes]),
      '',
      LEFT_SINGLE_QUOTATION_MARK + name + RIGHT_SINGLE_QUOTATION_MARK + ' requires ' +
        LEFT_SINGLE_QUOTATION_MARK + typeVarName + RIGHT_SINGLE_QUOTATION_MARK +
        ' to satisfy the ' + typeClass + ' type-class constraint;' +
        ' the value at position 1 does not.'
    ]));
  };

  //  underline :: (Type, [String], (String -> String)) -> String
  var underline = function(type, propPath, f) {
    var t = type;
    var types = [t];
    for (var idx = 0; idx < propPath.length; idx += 1) {
      types.push(t = t[propPath[idx]]);
    }

    var s = f(String(types[types.length - 1]));
    for (idx = types.length - 2; idx >= 0; idx -= 1) {
      t = types[idx];
      s = t.type === 'UNARY' ?
            t.format(_, K(s)) :
          t.type === 'BINARY' && propPath[idx] === '$1' ?
            t.format(_, K(s), _) :
          // else
            t.format(_, _, K(s));
    }

    return isParameterizedType(type) ? s.slice(1, -1) : s;
  };

  //  annotateSig :: [Type]
  //                 -> { index :: Integer, typePath :: [Type] }
  //                 -> { index :: Integer, typePath :: [Type] }
  //                 -> (String -> String)
  //                 -> (String -> String)
  //                 -> String
  var annotateSig = function(types, fst, snd, f, g) {
    return _(_showTypeSig((types.slice(0, fst.index)))) +
           underline(fst.typePath[0], fst.propPath, f) +
           _(_showTypeSig_(types.slice(fst.index + 1, snd.index))) +
           trimTrailingSpaces(underline(snd.typePath[0], snd.propPath, g));
  };

  //  conflictingTypeVar :: (String, StrMap [Type], [Type], Object) -> Error
  var conflictingTypeVar = function(name, constraints, expTypes, fst) {
    var nameAndConstraints = name + ' :: ' + constraintsRepr(constraints);
    var expTypeRepr = showType(expTypes[fst.index]);
    var padding = _(_showTypeSig(expTypes.slice(0, fst.index)));

    return new TypeError(unlines([
      'Type-variable constraint violation',
      '',
      nameAndConstraints + showTypeSig(expTypes),
      _(nameAndConstraints) + padding + trimTrailingSpaces(r('^')(expTypeRepr)),
      _(nameAndConstraints) + padding + trimTrailingSpaces(label('1')(expTypeRepr)),
      '',
      '1)  ' + map(fst.pairs, showValueAndType).join('\n    '),
      '',
      'Since there is no type of which all the above values are members, ' +
        'the type-variable constraint has been violated.'
    ]));
  };

  //  conflictingTypeVar2 ::
  //  (String, StrMap [Type], [Type], Object, Object) -> Error
  var conflictingTypeVar2 = function(name, constraints, expTypes, _fst, _snd) {
    var fst = _fst.index < _snd.index ? _fst : _snd;
    var snd = _fst.index < _snd.index ? _snd : _fst;

    var nameAndConstraints = name + ' :: ' + constraintsRepr(constraints);

    return new TypeError(unlines([
      'Type-variable constraint violation',
      '',
      nameAndConstraints + showTypeSig(expTypes),
      _(nameAndConstraints) + annotateSig(expTypes, fst, snd, r('^'), r('^')),
      _(nameAndConstraints) + annotateSig(expTypes, fst, snd, label('1'), label('2')),
      '',
      '1)  ' + map(fst.pairs, showValueAndType).join('\n    '),
      '',
      '2)  ' + map(snd.pairs, showValueAndType).join('\n    '),
      '',
      'Since there is no type of which all the above values are members, ' +
        'the type-variable constraint has been violated.'
    ]));
  };

  //  invalidValue ::
  //  (String, StrMap [Type], [Type], Any, Integer, [Type]) -> Error
  var invalidValue = function(name, constraints, expTypes,
                              value, index, actualTypes) {
    var nameAndConstraints = name + ' :: ' + constraintsRepr(constraints);
    var expTypeRepr = showType(expTypes[index]);
    var padding = _(_showTypeSig(expTypes.slice(0, index)));

    return new TypeError(unlines([
      'Invalid value',
      '',
      nameAndConstraints + showTypeSig(expTypes),
      _(nameAndConstraints) + padding + trimTrailingSpaces(r('^')(expTypeRepr)),
      _(nameAndConstraints) + padding + trimTrailingSpaces(label('1')(expTypeRepr)),
      '',
      '1)  ' + showValueAndType([value, actualTypes]),
      '',
      'The value at position 1 is not a member of ' +
        LEFT_SINGLE_QUOTATION_MARK + showType(expTypes[index]) + RIGHT_SINGLE_QUOTATION_MARK + '.'
    ]));
  };

  //  create :: (Boolean, [Type]) -> Function
  $.create = function(checkTypes, _env) {
    //  env :: [Type]
    var env = map(_env, function(x) {
      return typeof x === 'function' ?
        x.apply(null, map(range(0, x.length), K(Unknown))) :
        x;
    });

    //  assertExpectedTypesInEnvironment :: String -> [Type] -> Undefined
    var assertExpectedTypesInEnvironment = function(name) {
      return function recur(expTypes) {
        for (var idx = 0; idx < expTypes.length; idx += 1) {
          var expType = expTypes[idx];
          if (expType.type !== 'VARIABLE') {
            if (!any(env, eqProps('name')(expType))) {
              throw typeNotInEnvironment(env, name, expType);
            }
            if (expType.type === 'UNARY') {
              recur([expType.$1]);
            } else if (expType.type === 'BINARY') {
              recur([expType.$1, expType.$2]);
            }
          }
        }
      };
    };

    //  _determineActualTypes :: Boolean -> [Any] -> [Type]
    var _determineActualTypes = function(loose) {
      return function recur(values) {
        if (isEmpty(values)) return [Unknown];
        //  consistentTypes :: [Type]
        var consistentTypes = chain(env, rejectAny);
        //  typeses :: [[Type]]
        var typeses = map(values, function(value) {
          return chain(consistentTypes, function(t) {
            return (
              t.name === 'sanctuary-def/Nullable' || !t.test(value) ?
                [] :
              t.type === 'UNARY' ?
                map(recur(t._1(value)), UnaryType.from(t)) :
              t.type === 'BINARY' ?
                BinaryType.xprod(t, recur(t._1(value)), recur(t._2(value))) :
              // else
                [t]
            );
          });
        });
        //  common :: [Type]
        var common = commonTypes(typeses, loose);
        if (!isEmpty(common)) return common;
        //  If none of the values is a member of a type in the environment,
        //  and all the values have the same type identifier, the values are
        //  members of a "foreign" type.
        if (isEmpty(filterTypesByValues(consistentTypes, values)) &&
            all(values.slice(1), $$typeEq($$type(values[0])))) {
          //  Create a nullary type for the foreign type.
          return [type0($$type(values[0]))];
        }
        return [Inconsistent];
      };
    };

    //  rejectInconsistent :: [Type] -> [Type]
    var rejectInconsistent = function(types) {
      return filter(types, function(t) { return t.type !== 'INCONSISTENT'; });
    };

    //  determineActualTypesStrict :: [Any] -> [Type]
    var determineActualTypesStrict = function(values) {
      return rejectInconsistent(_determineActualTypes(false)(values));
    };

    //  determineActualTypesLoose :: [Any] -> [Type]
    var determineActualTypesLoose = function(values) {
      return rejectInconsistent(_determineActualTypes(true)(values));
    };

    //  valuesToPairs :: [Any] -> [Pair Any [Type]]
    var valuesToPairs = function(values) {
      return map(values, function(x) {
        return [x, determineActualTypesLoose([x])];
      });
    };

    var _satisfactoryTypes =
    function(name, constraints, expArgTypes, expRetType,
             $typeVarMap, _expType, _value, index) {
      return function recur(expType, values, typePath, propPath) {
        var $1s, $2s, idx, okTypes;
        switch (expType.type) {

          case 'VARIABLE':
            var typeVarName = expType.name;
            if (has(typeVarName, constraints)) {
              var typeClasses = constraints[typeVarName];
              for (idx = 0; idx < values.length; idx += 1) {
                for (var idx2 = 0; idx2 < typeClasses.length; idx2 += 1) {
                  if (!typeClasses[idx2].test(values[idx])) {
                    throw constraintViolation(
                      name,
                      constraints,
                      expArgTypes.concat([expRetType]),
                      values[idx],
                      index,
                      determineActualTypesLoose([values[idx]]),
                      typeVarName,
                      typeClasses[idx2]
                    );
                  }
                }
              }
            }
            if (has(typeVarName, $typeVarMap)) {
              okTypes = filterTypesByValues($typeVarMap[typeVarName].types,
                                            values);
              if (isEmpty(okTypes)) {
                throw conflictingTypeVar2(
                  name,
                  constraints,
                  expArgTypes.concat([expRetType]),
                  {index: index,
                   pairs: valuesToPairs(values),
                   propPath: propPath,
                   typePath: typePath.concat([expType])},
                  $typeVarMap[typeVarName].history
                );
              }
            } else {
              okTypes = determineActualTypesStrict(values);
              if (isEmpty(okTypes)) {
                throw conflictingTypeVar(
                  name,
                  constraints,
                  expArgTypes.concat([expRetType]),
                  {index: index,
                   pairs: valuesToPairs(values),
                   propPath: propPath,
                   typePath: typePath.concat([expType])}
                );
              }
            }
            $typeVarMap[typeVarName] = {
              types: okTypes,
              history: {
                index: index,
                pairs: valuesToPairs(values),
                propPath: propPath,
                typePath: typePath.concat([expType])
              }
            };
            return okTypes;

          case 'UNARY':
            $1s = recur(expType.$1,
                        chain(values, expType._1),
                        typePath.concat([expType]),
                        propPath.concat(['$1']));
            return map(or($1s, [expType.$1]), UnaryType.from(expType));

          case 'BINARY':
            $1s = recur(expType.$1,
                        chain(values, expType._1),
                        typePath.concat([expType]),
                        propPath.concat(['$1']));
            $2s = recur(expType.$2,
                        chain(values, expType._2),
                        typePath.concat([expType]),
                        propPath.concat(['$2']));
            return BinaryType.xprod(expType,
                                    or($1s, [expType.$1]),
                                    or($2s, [expType.$2]));

          default:
            return determineActualTypesStrict(values);
        }
      };
    };

    var satisfactoryTypes =
    function(name, constraints, expArgTypes, expRetType, $typeVarMap,
             expType, value, index) {
      return _satisfactoryTypes(name, constraints, expArgTypes,
                                expRetType, $typeVarMap, expType, value, index)
                               (expType, [value], [], []);
    };

    var curry = function(name, constraints, expArgTypes, expRetType,
                         _typeVarMap, _values, _indexes, impl) {
      return arity(_indexes.length, function() {
        if (checkTypes) {
          var delta = _indexes.length - arguments.length;
          if (delta < 0) {
            throw invalidArgumentsLength(name,
                                         expArgTypes.length,
                                         expArgTypes.length - delta);
          }
        }
        var $typeVarMap = {};
        for (var typeVarName in _typeVarMap) {
          $typeVarMap[typeVarName] = _typeVarMap[typeVarName];
        }
        var values = _values.slice();
        var indexes = [];
        for (var idx = 0; idx < _indexes.length; idx += 1) {
          var index = _indexes[idx];

          if (idx < arguments.length &&
              !(typeof arguments[idx] === 'object' &&
                arguments[idx] != null &&
                arguments[idx]['@@functional/placeholder'] === true)) {

            var value = arguments[idx];
            if (checkTypes) {
              var expType = expArgTypes[index];
              if (!expType.test(value) ||
                  isEmpty(satisfactoryTypes(name, constraints, expArgTypes,
                                            expRetType, $typeVarMap,
                                            expType, value, index))) {
                throw invalidValue(name,
                                   constraints,
                                   expArgTypes.concat([expRetType]),
                                   value,
                                   index,
                                   determineActualTypesLoose([value]));
              }
            }
            values[index] = value;
          } else {
            indexes.push(index);
          }
        }
        if (isEmpty(indexes)) {
          var returnValue = impl.apply(this, values);
          if (checkTypes) {
            if (!expRetType.test(returnValue)) {
              throw invalidValue(name,
                                 constraints,
                                 expArgTypes.concat([expRetType]),
                                 returnValue,
                                 _indexes.length,
                                 determineActualTypesLoose([returnValue]));
            }
            satisfactoryTypes(name, constraints, expArgTypes, expRetType,
                              $typeVarMap, expRetType, returnValue, NaN);
          }
          return returnValue;
        } else {
          return curry(name, constraints, expArgTypes, expRetType,
                       $typeVarMap, values, indexes, impl);
        }
      });
    };

    return function def(name, constraints, expTypes, impl) {
      if (checkTypes) {
        if (arguments.length !== def.length) {
          throw invalidArgumentsLength('def', def.length, arguments.length);
        }

        var Type = RecordType({test: $.Function});
        var types = [$.String, $.Object, $.Array(Type), $.Function];
        for (var idx = 0; idx < types.length; idx += 1) {
          if (!types[idx].test(arguments[idx])) {
            throw invalidArgument('def', [types[idx]], arguments[idx], idx);
          }
        }
      }

      var expArgTypes = expTypes.slice(0, -1);
      var arity = expArgTypes.length;
      if (arity > 9) {
        throw new RangeError(
          LEFT_SINGLE_QUOTATION_MARK + 'def' + RIGHT_SINGLE_QUOTATION_MARK +
          ' cannot define a function with arity greater than nine'
        );
      }

      if (checkTypes) assertExpectedTypesInEnvironment(name)(expTypes);

      return curry(name,
                   constraints,
                   expArgTypes,
                   expTypes[expTypes.length - 1],
                   {},
                   new Array(arity),
                   range(0, arity),
                   impl);
    };
  };

  return $;

}));
