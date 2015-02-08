/**
 * It should be served by ./bin/server who will provide `firebaseUrl`.
 *
 */
exports.module = function(angular, config) {
  'use strict';

  angular.module('oepMocked', ['oep', 'ngMockE2E']).

  constant('firebaseConfig', config).

  config([
    'oepFirebaseRefProvider',
    function(oepFirebaseRefProvider) {
      oepFirebaseRefProvider.setBaseUrl(config.url);
    }
  ]).

  config([
    '$provide',
    function($provide) {
      $provide.decorator('oepAuth', [
        '$q',
        '$delegate',
        '$firebaseAuth',
        'oepFirebase',
        function($q, $delegate, $firebaseAuth, oepFirebase) {
          var auth = $firebaseAuth(oepFirebase());

          $delegate.login = function() {
            return auth.$authWithCustomToken(config.tokens.bob).then(function(user) {
              $delegate.user = user.auth;
            });
          };

          return $delegate;
        }
      ]);
    }
  ]).

  run([
    '$httpBackend',
    function($httpBackend) {
      // Requests to mock


      // Anything else should pass.
      //
      $httpBackend.whenGET(/.*/).passThrough();
      $httpBackend.whenPOST(/.*/).passThrough();
      $httpBackend.whenPUT(/.*/).passThrough();
      $httpBackend.whenDELETE(/.*/).passThrough();
      $httpBackend.whenJSONP(/.*/).passThrough();
    }
  ])

  ;

};
