/**
 * By default, the app is using the staging DB and mock some http request.
 *
 */
(function() {
  'use strict';

  angular.module('oepMocked', ['oep', 'ngMockE2E']).config([
    'oepFirebaseRefProvider',
    function(oepFirebaseRefProvider){
      oepFirebaseRefProvider.setBaseUrl('https://singpath-play.firebaseIO.com');
    }
  ]).run([
    '$httpBackend',
    function($httpBackend) {
      $httpBackend.whenGET(/.*/).passThrough();
      $httpBackend.whenPOST(/.*/).passThrough();
      $httpBackend.whenPUT(/.*/).passThrough();
      $httpBackend.whenDELETE(/.*/).passThrough();
      $httpBackend.whenJSONP(/.*/).passThrough();
    }
  ]);

})();
