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


    });


    /**
     * Test core singpath fire services
     */
    describe('services', function() {


      describe('crypto', function() {

        describe('password', function() {
          var provider, crypto;

          beforeEach(module('oep', function(cryptoProvider) {
            provider = cryptoProvider;
          }));

          beforeEach(inject(function(_crypto_) {
            crypto = _crypto_;
          }));

          it('should create a hash using 256b hash (128b salt, 2024 iteration', function() {
            var hash = crypto.password.newHash('foo');

            expect(hash.options.hasher).toBe('PBKDF2');
            expect(hash.options.prf).toBe('SHA256');
            expect(hash.value.length).toBe(256 / 8 * 2); // 256 bit hex encoded
            expect(hash.options.salt.length).toBe(128 / 8 * 2); // 64 bit hex encoded
            expect(hash.options.iterations).toBe(2024);
          });

          it('should let you configure the hasher', function() {
            var hash;

            provider.setSaltSize(128 / 8);
            provider.setHashKeySize(128 / 32);
            provider.setIterations(100);

            hash = crypto.password.newHash('foo');

            expect(hash.value.length).toBe(128 / 8 * 2); // 256 bit hex encoded
            expect(hash.options.salt.length).toBe(128 / 8 * 2); // 64 bit hex encoded
            expect(hash.options.iterations).toBe(100);
          });

          it('should be able to create hash from salts and options', function() {
            var hash = crypto.password.fromSalt('password', '11111111', {
              keySize: 128 / 32,
              iterations: 10,
              prf: 'SHA1'
            });

            expect(hash).toBe('1a9e75789b45e1e072d420e2995ad5f9');
          });

        });

      });


      describe('oepDataStore', function() {

        beforeEach(module('oep'));

        describe('auth', function() {
          var oepFirebaseSync, oepAuth, sync, userObj;

          beforeEach(function() {
            sync = jasmine.createSpyObj('$angularfire', ['$asObject']);
            userObj = jasmine.createSpyObj('$firebaseObject', ['$loaded', '$save']);
            oepFirebaseSync = jasmine.createSpy().and.returnValue(sync);
            sync.$asObject.and.returnValue(userObj);
            oepAuth = {
              user: {
                uid: 'custome:1',
                google: {
                  displayName: 'Bob Smith'
                }
              }
            };

            module(function($provide) {
              $provide.value('oepFirebaseSync', oepFirebaseSync);
              $provide.value('oepAuth', oepAuth);
            });
          });

          it('should resolved to user data', function() {
            inject(function($q, $rootScope, oepDataStore) {
              var result;

              userObj.$loaded.and.returnValue($q.when(userObj));
              oepDataStore.auth.user().then(function(_result_) {
                result = _result_;
              });
              $rootScope.$apply();

              expect(result).toBe(userObj);
              expect(userObj.$save).not.toHaveBeenCalled();
            });
          });

          it('should return undefined if the user is not logged in', function() {
            inject(function($rootScope, oepDataStore) {
              var result, error;

              oepAuth.user = null;
              oepDataStore.auth.user().then(function(_result_) {
                result = _result_;
              }, function(e) {
                error = e;
              });

              $rootScope.$apply();
              expect(result).toBeUndefined();
              expect(error).toBeDefined();
            });
          });

          it('should setup user date', function() {
            inject(function($rootScope, $q, oepDataStore) {
              var result;

              userObj.$loaded.and.returnValue($q.when(userObj));
              userObj.$save.and.returnValue($q.when(true));
              userObj.$value = null;

              oepDataStore.auth.user().then(function(_result_) {
                result = _result_;
              });

              $rootScope.$apply();
              expect(result).toBe(userObj);
              expect(userObj.$value).toEqual({
                id: oepAuth.user.uid,
                nickName: oepAuth.user.google.displayName,
                displayName: oepAuth.user.google.displayName,
                createdAt: {'.sv': 'timestamp'}
              });
              expect(userObj.$save).toHaveBeenCalled();
            });
          });

        });

      });


      describe('oepFirebaseSync', function() {
        var $firebase, oepFirebaseRef, ref, sync;

        beforeEach(module('oep'));

        beforeEach(function() {
          ref = jasmine.createSpy('ref');
          sync = jasmine.createSpy('sync');
          $firebase = jasmine.createSpy('$firebase').and.returnValue(sync);
          oepFirebaseRef = jasmine.createSpy('oepFirebaseRef').and.returnValue(ref);

          module(function($provide) {
            $provide.value('$firebase', $firebase);
            $provide.value('oepFirebaseRef', oepFirebaseRef);
          });
        });

        it('should create an angularFire object', inject(function(oepFirebaseSync) {
          expect(oepFirebaseSync()).toBe(sync);
          expect($firebase).toHaveBeenCalledWith(ref);
          expect(oepFirebaseRef).toHaveBeenCalledWith();
        }));

        it('should create an angularFire object with ref to child', inject(function(oepFirebaseSync) {
          oepFirebaseSync(['foo', 'bar'], {limitToLast: 50});
          expect(oepFirebaseRef).toHaveBeenCalledWith(['foo', 'bar'], {limitToLast: 50});
        }));

      });


      describe('oepFirebaseRef', function() {
        var provider, factory, Firebase, firebaseSpy, oepFirebaseRef, ref;

        beforeEach(module('oep', function(oepFirebaseRefProvider) {
          var log = jasmine.createSpyObj('$log', ['info', 'debug']);
          provider = oepFirebaseRefProvider;
          factory = function() {
            return provider.$get.slice(-1).pop()({
              Firebase: Firebase
            }, log);
          };
        }));

        beforeEach(function(){
          firebaseSpy = jasmine.createSpy('Firebase');
          ref = jasmine.createSpyObj('ref', ['child', 'orderBy', 'limitToLast']);
          ref.child.and.returnValue(ref);
          ref.orderBy.and.returnValue(ref);
          ref.limitToLast.and.returnValue(ref);
          ref.path = {};
          Firebase = function(url) {
            firebaseSpy(url);
            this.child = ref.child.bind(ref);
            this.path = {};
          };
        });

        it('should return a Firebase ref', inject(function() {
          oepFirebaseRef = factory();
          expect(oepFirebaseRef().constructor).toBe(Firebase);
        }));

        it('should return ref to singpath database', function() {
          oepFirebaseRef = factory();
          oepFirebaseRef();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath.firebaseio.com/');
        });

        it('should allow to configure the ref baseurl', function() {
          provider.setBaseUrl('https://singpath-dev.firebaseio.com/');
          oepFirebaseRef = factory();
          oepFirebaseRef();
          expect(firebaseSpy).toHaveBeenCalledWith('https://singpath-dev.firebaseio.com/');
        });

        it('should allow to point to a specific child path', function() {
          oepFirebaseRef = factory();
          oepFirebaseRef(['auth', 'users']);
          expect(ref.child.calls.count()).toBe(2);
          expect(ref.child.calls.argsFor(0)).toEqual(['auth']);
          expect(ref.child.calls.argsFor(1)).toEqual(['users']);
        });

        it('should allow to point to a specific query options', function() {
          expect(ref.child.calls.count()).toBe(0);
          oepFirebaseRef = factory();
          oepFirebaseRef(['events'], {
            orderBy: 'timestamps',
            limitToLast: 50
          });

          expect(ref.orderBy).toHaveBeenCalledWith('timestamps');
          expect(ref.limitToLast).toHaveBeenCalledWith(50);
        });

      });


      describe('oepAuth', function() {
        var auth, oepFirebaseRef;

        beforeEach(module('oep'));

        beforeEach(function() {
          var $firebaseAuth;

          oepFirebaseRef = jasmine.createSpy('oepFirebaseRef');
          auth = jasmine.createSpyObj('auth', ['$getAuth', '$authWithOAuthPopup', '$authWithOAuthRedirect', '$unauth']);
          $firebaseAuth = jasmine.createSpy('$firebaseAuth').and.returnValue(auth);

          module(function($provide) {
            $provide.value('oepFirebaseRef', oepFirebaseRef);
            $provide.value('$firebaseAuth', $firebaseAuth);
          });

        });

        it('should authenticate current user', function() {
          var user = {
            uid: '1234'
          };

          auth.$getAuth.and.returnValue(user);

          inject(function(oepAuth) {
            expect(oepAuth.user).toBe(user);
          });
        });

        it('should authenticate current user (guest)', function() {
          auth.$getAuth.and.returnValue(null);

          inject(function(oepAuth) {
            expect(oepAuth.user).toBeNull();
          });
        });


        describe('login', function() {
          var user;

          beforeEach(function() {
            user = {
              uid: '1234'
            };
          });

          it('should authenticate against a google account', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth) {
              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              oepAuth.login();
              expect(auth.$authWithOAuthPopup).toHaveBeenCalledWith('google');
            });
          });

          it('should set oepAuth.user on success', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              oepAuth.login();
              $rootScope.$apply();
              expect(oepAuth.user).toBe(user);
            });
          });

          it('should resolve to auth user on success', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              var result;

              auth.$authWithOAuthPopup.and.returnValue($q.when(user));

              oepAuth.login().then(function(resp) {
                result = resp;
              });

              $rootScope.$apply();
              expect(result).toBe(user);
            });
          });

          it('should reject on error', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              var result;
              var err = new Error();

              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));

              oepAuth.login().catch(function(e) {
                result = e;
              });

              $rootScope.$apply();
              expect(result).toBe(err);
            });
          });

          it('should resolve to $firebaseAuth.$authWithOAuthRedirect promise when popup is not available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              var result;
              var err = new Error();
              var redirectResult = {};

              err.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));
              // I am guessing the redirect promise only resolve if it fails
              // (redirect not available), but for the test it doesn't matter.
              auth.$authWithOAuthRedirect.and.returnValue($q.when(redirectResult));

              oepAuth.login().then(function(resp) {
                result = resp;
              });

              $rootScope.$apply();
              expect(result).toBe(redirectResult);
            });
          });

          it('should authenticate against a google account when popup is not available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              var err = new Error();
              var redirectResult = {};

              err.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(err));
              auth.$authWithOAuthRedirect.and.returnValue($q.when(redirectResult));

              oepAuth.login();
              $rootScope.$apply();
              expect(auth.$authWithOAuthRedirect).toHaveBeenCalledWith('google');
            });
          });

          it('should reject when neither popup or redirect is available', function() {
            auth.$getAuth.and.returnValue(null);

            inject(function($q, oepAuth, $rootScope) {
              var result;
              var popUpErr = new Error();
              var redirectErr = new Error();

              popUpErr.code = 'TRANSPORT_UNAVAILABLE';
              auth.$authWithOAuthPopup.and.returnValue($q.reject(popUpErr));
              auth.$authWithOAuthRedirect.and.returnValue($q.reject(redirectErr));

              oepAuth.login().catch(function(e) {
                result = e;
              });

              $rootScope.$apply();
              expect(result).toBe(redirectErr);
            });
          });

        });


        describe('logout', function() {

          it('should unauthenticates current user', function() {
            auth.$getAuth.and.returnValue({
              uid: '1234'
            });

            inject(function($q, oepAuth) {
              auth.$unauth.and.returnValue(null);

              oepAuth.logout();
              expect(auth.$unauth).toHaveBeenCalled();
            });
          });

          it('should reset oepAuth.user', function() {
            auth.$getAuth.and.returnValue({
              uid: '1234'
            });

            inject(function($q, oepAuth) {
              auth.$unauth.and.returnValue(null);

              oepAuth.logout();
              expect(auth.user).toBeUndefined();
            });
          });

        });

      });


      describe('oepAlert', function() {
        var log, oepAlert;

        beforeEach(module('oep'));

        beforeEach(function() {
          module(function($provide) {
            log = jasmine.createSpy();
            log.and.returnValue(null);
            $provide.value('$window', {
              alertify: {
                log: log
              }
            });
          });

          inject(function(_oepAlert_) {
            oepAlert = _oepAlert_;
          });
        });

        it('should alert users', function() {
          oepAlert('Type', 'Content');
          expect(log).toHaveBeenCalledWith('Content', 'type');
        });

        describe('oepAlert.success', function() {

          it('should send a notification of type "success"', function() {
            oepAlert.success('Content');
            expect(log).toHaveBeenCalledWith('Content', 'success');
          });

        });

        describe('oepAlert.info', function() {

          it('should send a notification of type "info"', function() {
            oepAlert.info('Content');
            expect(log).toHaveBeenCalledWith('Content', undefined);
          });

        });

        describe('oepAlert.warning', function() {

          it('should send a notification of type "warning"', function() {
            oepAlert.warning('Content');
            expect(log).toHaveBeenCalledWith('Content', 'error');
          });

        });


        describe('oepAlert.danger', function() {

          it('should send a notification of type "danger"', function() {
            oepAlert.danger('Content');
            expect(log).toHaveBeenCalledWith('Content', 'error');
          });

        });

        describe('oepAlert.error', function() {

          it('should send a notification of type "error"', function() {
            oepAlert.error('Content');
            expect(log).toHaveBeenCalledWith('Content', 'error');
          });

        });

      });

    });


  });

})();
