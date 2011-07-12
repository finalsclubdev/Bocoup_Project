var OperationEnum = require('../../src/enums/OperationEnum.js');

var validOpValues = [
  'INSERT',
  'REMOVE',
  'MACRO',
  'NOOP'
];

exports['exports only valid op values'] = function(test) {
  test.expect(validOpValues.length + 1);

  for(var op in validOpValues) {
    test.ok(op, OperationEnum[op]);
  }

  var sum = 0;
  for(var i in OperationEnum) {
    sum++;
  }

  test.strictEqual(sum, validOpValues.length, 'OperationEnum has too many exports.');

  test.done();
};
