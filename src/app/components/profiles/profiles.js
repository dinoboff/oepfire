(function() {
  'use strict';

  angular.module('oep').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.profile, {
        templateUrl: 'app/components/profiles/profiles-view.html',
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
    'routes',
    'oepAuth',
    'oepDataStore',
    function oepProfileInitialDataResolverFactory($q, $location, $route, routes, oepAuth, oepDataStore) {
      return function oepProfileInitialDataResolver() {
        var publicId = $route.current.params.publicId;
        var userPromise = oepDataStore.auth.user();
        var profilePromise;
        var errNoPublicId = new Error('The user has not set his public id');

        // If we are looking for the profile of some other user,
        // the profile has to exist.
        if (publicId) {
          profilePromise = oepDataStore.oep.profile(publicId).then(function(profile) {
            if (profile.$value === null) {
              return $q.reject(new Error('Could not found the profile for ' + publicId));
            }
            return profile;
          });

          return $q.all({
            auth: oepAuth,
            currentUser: userPromise,
            profile: profilePromise
          });
        }

        // If we are looking at the current user  profile,
        // the user needs to be logged in...
        if (!oepAuth.user || !oepAuth.user.uid) {
          $location.path(routes.ranking);
        }

        // ... And the profile might not exist yet. We need to let the view
        // load in that case and let the user pick a public id and initiate
        // the profile.
        profilePromise = userPromise.then(function(userData) {
          if (!userData.publicId) {
            return $q.reject(errNoPublicId);
          }

          return oepDataStore.oep.profile(userData.publicId).then(function(profile) {
            if (profile.$value === null) {
              return oepDataStore.oep.initProfile(userData);
            }

            return profile;
          });
        }).catch(function(err) {
          // the controller can recover from that by asking the user to register.
          if (err === errNoPublicId) {
            return;
          }
          // Any other error should cancel the route change.
          return $q.reject(err);
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
        }).then(function(profile){
          oepAlert.success('Profile setup.');
          self.profile = profile;
          return profile;
        }).catch(function(e){
          oepAlert.error(e.toString());
        }).finally(function() {
          self.settingPublicId = false;
        });
      };
    }
  ])

  ;

})();
