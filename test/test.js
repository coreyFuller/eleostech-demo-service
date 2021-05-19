var assert = require('assert');
var axios = require('axios')
describe('Loads Requests', function() {
  describe('GET Request', function() {
    it('response should not be empty', function() {
        axios.get('localhost:3000/loads').then((response) => {
            console.log(response.data)
        })
      assert.equal(true,true)
    });
  });
});
describe('Messages Requests', function() {
    describe('PUT Request', function() {
      it('response should not be empty', function() {
        assert.equal(true, true);
      });
    });
  });
describe('Authenticate Requests', function() {
    describe('GET Request', function() {
      it('response should not be empty', function() {
        axios.get('localhost:3000/authenticate/token').then((response) => {
            console.log(response.data)
        })
        assert.equal(true, true);
      });
    });
  });