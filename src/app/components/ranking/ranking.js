(function() {
  'use strict';

  angular.module('oep').

  config([
    '$routeProvider',
    'routes',
    function($routeProvider, routes) {
      $routeProvider.when(routes.ranking, {
        templateUrl: 'app/components/ranking/ranking-view.html'
        // controller: 'OepRankingCtrl',
        // controllerAs: 'ctrl',
        // resolve: {
        //   'initialData': [
        //     'oepRankingCtrlInitialDataResolver',
        //     function(oepRankingCtrlInitialDataResolver) {
        //       return oepRankingCtrlInitialDataResolver();
        //     }
        //   ]
        // }
      });

    }
  ])

  ;

})();
