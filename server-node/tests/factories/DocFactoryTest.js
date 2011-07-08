var docFactory = require('../../src/factories/DocFactory.js');

exports["makeDocState() input validation"] = function(test) {
  test.expect(5);

  test.equal(
    typeof docFactory.makeDocState,
    'function',
    'makeDocState is not a function.'
  );

  test.equal(
    typeof docFactory.makeDocState({ id: 'bwah' }),
    'object',
    'Did not return a state object.'
  );

  test.throws(
    function() { docFactory.makeDocState({}); },
    'Did not throw an exception on a doc object missing an id.'
  );

  test.throws(
    function() { docFactory.makeDocState(null); },
    'Did not throw an exception on non-object input.'
  );

  test.throws(
    function() { docFactory.makeDocState('hi there'); },
    'Did not throw an exception on string input.'
  );

  test.done();
};
