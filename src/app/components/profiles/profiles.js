(function() {
  'use strict';

  angular.module('oep').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.editProfile, {
        templateUrl: 'app/components/profiles/profiles-view-edit.html',
        controller: 'OepProfileCtrl',
        controllerAs: 'ctrl',
        resolve: {
          'initialData': [
            'oepProfileInitialDataResolver',
            function(oepProfileInitialDataResolver) {
              return oepProfileInitialDataResolver();
            }
          ]
        }
      });

    }
  ]).

  /**
   * Use to resolve `initialData` of `OepProfileCtrl`.
   *
   *
   */
  factory('oepProfileInitialDataResolver', [
    '$q',
    '$location',
    '$route',
    'oepAuth',
    'oepDataStore',
    function oepProfileInitialDataResolverFactory($q, $location, routes, oepAuth, oepDataStore) {
      return function oepProfileInitialDataResolver() {
        // var publicId = $route.current.params.publicId;
        var userPromise = oepDataStore.auth.user();
        var registeredServicesPromise;
        var profilePromise;
        var errNoPublicId = new Error('The user has not set his public id');

        // // If we are looking for the profile of some other user,
        // // the profile has to exist.
        // if (publicId) {
        //   profilePromise = oepDataStore.oep.profile(publicId).then(function(profile) {
        //     if (profile.$value === null) {
        //       return $q.reject(new Error('Could not found the profile for ' + publicId));
        //     }
        //     return profile;
        //   });

        //   return $q.all({
        //     auth: oepAuth,
        //     currentUser: userPromise,
        //     profile: profilePromise
        //   });
        // }

        // If we are looking at the current user profile,
        // the user needs to be logged in...
        if (!oepAuth.user || !oepAuth.user.uid) {
          $location.path(routes.ranking);
        }

        // ... And the profile might not exist yet. We need to let the view
        // load in that case and let the user pick a public id and initiate
        // the profile.
        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return;
          }

          return oepDataStore.oep.profile(userData.publicId).then(function(profile) {
            if (profile && profile.$value === null) {
              return oepDataStore.oep.initProfile(userData);
            }

            return profile;
          });
        });

        return $q.all({
          auth: oepAuth,
          currentUser: userPromise,
          profile: profilePromise
        });
      };
    }
  ]).

  /**
   * OepProfileCtrl
   *
   */
  controller('OepProfileCtrl', [
    'initialData',
    'oepDataStore',
    'oepAlert',
    function OepProfileCtrl(initialData, oepDataStore, oepAlert) {
      var self = this;

      this.auth = initialData.auth;
      this.currentUser = initialData.currentUser;
      this.profile = initialData.profile;

      this.settingPublicId = false;

      this.setPublicId = function(currentUser) {
        this.settingPublicId = true;
        oepDataStore.auth.publicId(currentUser).then(function() {
          oepAlert.success('Public id set.');
          return oepDataStore.oep.profileInit(currentUser);
        }).then(function(profile) {
          oepAlert.success('Profile setup.');
          self.profile = profile;
          return profile;
        }).catch(function(e) {
          oepAlert.error(e.toString());
        }).finally(function() {
          self.settingPublicId = false;
        });
      };

      this.lookUp = {
        codeCombat: {
          errors: {},
          id: undefined,
          name: undefined,

          find: function() {
            self.lookUp.codeCombat.errors.isLoggedToCodeCombat = undefined;
            self.lookUp.codeCombat.errors.hasACodeCombatName = undefined;

            oepDataStore.oep.services.codeCombat.currentUser().then(function(details) {
              self.lookUp.codeCombat.id = details.id;
              self.lookUp.codeCombat.name = details.name;
            }).catch(function(err) {
              if (err === oepDataStore.oep.services.codeCombat.errLoggedOff) {
                self.lookUp.codeCombat.errors.isLoggedToCodeCombat = true;
              } else if (err === oepDataStore.oep.services.codeCombat.errNoName) {
                self.lookUp.codeCombat.errors.hasACodeCombatName = true;
              } else {
                oepAlert.error(err.toString());
              }
            });
          },

          save: function() {
            return oepDataStore.oep.services.codeCombat.saveDetails(self.currentUser, {
              id: self.lookUp.codeCombat.id,
              name: self.lookUp.codeCombat.name
            }).then(function(){
              oepAlert.success('Code Combat user name saved.');
            }).catch(function(err){
              oepAlert.error(err.toString());
            });
          },

          reset: function() {
            self.lookUp.codeCombat.id = undefined;
            self.lookUp.codeCombat.name = undefined;
          }
        }
      };
    }
  ]).

  directive('oepProfile', [

    function oepProfileFactory() {
      return {
        templateUrl: 'app/components/profiles/profiles-view-oep-profile.html',
        restrict: 'A',
        scope: {
          serviceId: '@oepServiceId',
          profile: '=oepProfile'
        },
        controller: [
          function OepProfileCtrl() {
            this.services = {
              codeCombat: {
                name: 'Code Combat',
                url: 'http://codecombat.com/'
              },

              codeSchool: {
                name: 'Code School',
                url: 'https://www.codeschool.com/'
              },

              treehouse: {
                name: 'Treehouse',
                url: 'http://www.teamtreehouse.com/signup_code/singapore'
              }
            };
          }
        ],
        controllerAs: 'ctrl',
        // arguments: scope, iElement, iAttrs, controller
        link: function oepProfilePostLink() {}
      };
    }
  ])

  ;

})();
