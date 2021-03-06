/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:liveGameScores
 * @description Live game score directive
 *
 */
VBET5.directive('liveGameScores', ['$window', 'Config', 'Storage', 'GameInfo', 'Utils','$rootScope','analytics', function ($window, Config, Storage, GameInfo, Utils,$rootScope,analytics) {
    'use strict';
    return {
        restrict: 'AE',
        scope: {
            openGame: '=',
            enlargedGame: '=',
            showStatsBlock: '=',
            marketsInOneColumn: '='
        },
        templateUrl: 'templates/directive/live-game-scores.html',
        link: function (scope,element,attr) {
            var LIVE_GAME_SCORES_FLIP_MODE = "liveGameScoresFlipMode";
            scope.Math = Math;
            scope.liveGamesSoccerTemplate = GameInfo.liveGamesSoccerTemplate;
            scope.dotaGamesList = GameInfo.dotaGamesList;
            scope.framesCount = Utils.memoize(GameInfo.framesCount);
            scope.showFrameAlias = Utils.memoize(GameInfo.showFrameAlias);
            scope.slideSets = GameInfo.slideSets;
            scope.getCurrentTime = Utils.memoize(GameInfo.getCurrentTime);
            scope.visibleSetsNumber = 5;
            scope.openGameLoading = false;
            var storageFlipMode = Storage.get(LIVE_GAME_SCORES_FLIP_MODE);
            scope.flipMode = storageFlipMode !== undefined? storageFlipMode: 1;
            scope.sportWithIcons = ['MortalKombatXL', 'StreetFighterV', 'Dota', 'Dota2', 'CounterStrike', 'LeagueOfLegends', 'KingOfGlory', 'EBasketball', 'Overwatch', 'Smite', 'WorldOfWarcraft', 'WorldOfTanks', 'ETennis', 'RocketLeague', 'WarcraftIII', 'E-IceHockey', 'RainbowSix', 'ArenaofValor'];

            scope.isExtraTime = GameInfo.isExtraTime;

            /**
             * @ngdoc method
             * @name toggleLiveSectionPin
             * @methodOf vbet5.directive:liveGameScores
             * @description pins/unpin live score section at the top of middle section
             */
            scope.toggleLiveSectionPin = function toggleLiveSectionPin() {
                $rootScope.env.isLiveGamePinned = !$rootScope.env.isLiveGamePinned;
                if ($rootScope.env.isLiveGamePinned && Config.env.hideLiveStats) {
                    Config.env.hideLiveStats = false;
                    scope.setStatsBlockState(!Config.env.hideLiveStats);
                }
                Storage.set('LiveGamePin', $rootScope.env.isLiveGamePinned);
            };

            /**
             * @ngdoc method
             * @name switchMarketsInOneColumn
             * @methodOf vbet5.controller:classicViewMainCtrl
             * @description  switch markets to one or two columns
             * @param {boolean} enabled
             */
            scope.switchMarketsInOneColumn = function switchMarketsInOneColumn(enabled) {
                if (scope.marketsInOneColumn.enabled !== enabled) {
                    scope.marketsInOneColumn.enabled = enabled;
                    Storage.set('markets_in_one_column', enabled);
                }
            };

            /**
             * @ngdoc method
             * @name changeStatsMode
             * @methodOf vbet5.directive:liveGameScores
             * @description  changes live games stats mode from chart to details and back
             */
            scope.changeStatsMode = function changeStatsMode(mode) {
                scope.flipMode = mode;
                Storage.set(LIVE_GAME_SCORES_FLIP_MODE, scope.flipMode);
            };

            $rootScope.env.isLiveGamePinned = !!Storage.get('LiveGamePin');

            /**
             * @ngdoc method
             * @name toggleStatsVisibility
             * @methodOf vbet5.directive:liveGameScores
             * @description  toggles live game statistics visibility
             */
            scope.toggleStatsVisibility = function toggleStatsVisibility() {
                Config.env.hideLiveStats = !Config.env.hideLiveStats;
                scope.setStatsBlockState(!scope.showStatsBlock);
            };

            /**
             * @ngdoc method
             * @name openStatistics
             * @methodOf @methodOf vbet5.directive:liveGameScores
             * @description
             * Opens statistics in popup window
             *
             * @param {Object} game game object
             */
            scope.openStatistics = function openStatistics(game) {
                analytics.gaSend('send', 'event', 'explorer', 'H2H-on-click', {'page': scope.locationPath, 'eventLabel': ($rootScope.env.live ? 'Live' : 'Prematch')});
                $window.open(GameInfo.getStatsLink(game), game.id, "width=940,height=600,resizable=yes,scrollbars=yes");
            };

            scope.setStatsBlockState = function setStatsBlockState(state) {
                if (state !== undefined) {
                    scope.showStatsBlock = !!state;
                    scope.$emit('sportsbook.updateStatsBlockState', !!state);
                }
            };


            if (scope.openGame && scope.openGame.sport && scope.openGame.sport.alias === 'BasketballShots') {
                scope.shotsSlider = {
                    untouched:true,
                    visibleCount: 10,
                    scrollIndex: 0,
                    next: function () {
                        if(scope.shotsSlider.scrollIndex < (scope.openGame.info.total_attempts - scope.shotsSlider.visibleCount)){
                            scope.shotsSlider.untouched = false;
                            scope.shotsSlider.scrollIndex++;
                        }
                    },
                    previous: function () {
                        if(scope.shotsSlider.scrollIndex > 0){
                            scope.shotsSlider.untouched = false;
                            scope.shotsSlider.scrollIndex--;
                        }
                    }
                };
                var autoScroll = function () {
                    if(scope.shotsSlider.untouched){
                        return true;
                    }
                    var lastEventIndex = scope.openGame.live_events ? scope.openGame.live_events.length - 1 : 0;
                    var firstVisibleIndex = scope.shotsSlider.scrollIndex;
                    var lastVisibleIndex = scope.shotsSlider.scrollIndex + scope.shotsSlider.visibleCount;

                    return lastEventIndex >= firstVisibleIndex && lastVisibleIndex - lastEventIndex < 3 && lastVisibleIndex >= lastEventIndex;
                };

                var calculateScrollIndex = function calculateScrollIndex() {
                    scope.shotsSlider.scrollIndex = parseInt(scope.openGame.live_events && scope.openGame.live_events.length >= (scope.shotsSlider.visibleCount - 3) ? scope.openGame.live_events.length - scope.shotsSlider.visibleCount +3 : 0);
                };
                scope.$watch(function () {   //shots container width watcher
                    if(element[0] && element[0].getElementsByClassName('status-short-l')[0]){
                        return element[0].getElementsByClassName('status-short-l')[0].clientWidth;
                    }
                }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        var autoScrollValue = autoScroll();
                        scope.shotsSlider.visibleCount = Math.floor(newVal / 37); // item width 37px
                        if(autoScrollValue){
                            calculateScrollIndex();
                        }
                    }
                });



                scope.$watch('openGame.live_events.length',function (newVal, oldVal) {
                    if(newVal !== oldVal && autoScroll()){
                        calculateScrollIndex();
                    }
                });
            }

        }
    };
}]);
