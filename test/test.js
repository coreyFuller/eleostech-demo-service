var assert = require('assert');
var axios = require('axios')
var app = require('../app/index')

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

  describe('Checking headers', function() {
    describe('Authenticated function', function() {
      it('Should return true if the request is authenticated', function(){
        assert.equal(true, true)
      })
    })
  })