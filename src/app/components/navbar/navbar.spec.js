/* jshint camelcase: false*/
/* global describe, beforeEach, module, it, inject, expect, jasmine */

(function() {
  'use strict';

  describe('oep', function() {

    /**
     * Test core singpath fire controllers.
     *
     */
    describe('controllers', function() {
      var $controller, $rootScope, $q;

      beforeEach(module('oep'));

      beforeEach(inject(function(_$rootScope_, _$q_, _$controller_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
      }));


      /**
       * Test OepSharedNavBarCtrl.
       */
      describe('OepSharedNavBarCtrl', function() {
        var ctrl, alert, auth;

        beforeEach(function() {
          auth = jasmine.createSpyObj('oepAuth', ['login', 'logout']);
          alert = jasmine.createSpy('oepAlert');
          ['info', 'success', 'warning', 'danger'].map(function(k) {
            alert[k] = jasmine.createSpy(k);
          });
          ctrl = $controller('OepSharedNavBarCtrl', {
            oepAuth: auth,
            oepAlert: alert
          });
        });

        it('should have auth attribute', function() {
          expect(ctrl.auth).toBe(auth);
        });

        it('should login users', function() {
          var resp = {
            uid: '1234'
          };
          var result;

          auth.login.and.returnValue($q.when(resp));

          ctrl.login().then(function(resp) {
            result = resp;
          });
          $rootScope.$apply();

          expect(result).toBe(resp);
        });

        it('should alert users when login fails', function() {
          var e = new Error('I want it to fail');

          auth.login.and.returnValue($q.reject(e));

          ctrl.login();
          $rootScope.$apply();

          expect(alert.warning).toHaveBeenCalled();
        });

        it('should reject login promise on error', function() {
          var e = new Error('I want it to fail');
          var result;

          auth.login.and.returnValue($q.reject(e));

          ctrl.login().catch(function(e) {
            result = e;
          });
          $rootScope.$apply();

          expect(result).toBe(e);
        });

      });


    });


  });

})();
