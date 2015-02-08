 (function() {
  'use strict';

  angular.module('oep').

  /**
   * Controler for the header novigation bar.
   *
   * Set an auth property bound to oepAuth. Its user property can used
   * to display the state of the authentication and the user display name
   * when the user is logged in.
   *
   * The ctrl set a login and logout property to autenticate/unauthenticate
   * the current user.
   *
   */
  controller('OepSharedNavBarCtrl', [
    '$q',
    '$aside',
    'oepAlert',
    'oepAuth',
    function($q, $aside, oepAlert, oepAuth) {
      this.auth = oepAuth;

      this.login = function() {
        return oepAuth.login().catch(function(e) {
          oepAlert.warning('You failed to authenticate with Google');
          return $q.reject(e);
        });
      };

      this.logout = function() {
        return oepAuth.logout();
      };

      this.openSideMenu = function(conf) {
        var aside = $aside({
          contentTemplate: conf.contentTemplate,
          title: 'Menu',
          animation: 'am-fade-and-slide-left',
          placement: 'left',
          container: 'body'
        });
        aside.$promise.then(function() {
          aside.show();
        });
      };

    }
  ])



  ;

})();
