var reporter = require('nodeunit').reporters.default;

reporter.run([
  './tests/factories/DocFactoryTest.js',
  './tests/validators/UserValidatorTest.js',
  './tests/validators/DocValidatorTest.js',
  './tests/validators/GroupValidatorTest.js',
  './tests/DAOs/UserDAOTest.js',
  './tests/DAOs/GroupDAOTest.js',
  './tests/DAOs/DocDAOTest.js',
  './tests/enums/OperationEnumTest.js'
]);
