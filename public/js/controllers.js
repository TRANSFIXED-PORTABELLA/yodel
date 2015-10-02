angular.module('app.controllers', [])
.controller('LandingController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //function called when join button clicked
      $scope.join = function (event) {
        //send the event to the server
        socket.emit('join', event);
        //set the name of the event. Used for routing purposes
        Event.event = event;
        //move the insider into the event
        $location.path('/events/' + event);
      };
      //directs user to the create event page
      $scope.create = function () {
        $location.path('/create');
      };
    }])
.controller('CreateController', ['$scope', '$location', 'socket', 'Event',
    function ($scope, $location, socket, Event) {
      //function called when the create button is pushed
      $scope.create = function (event) {
        //set the name of the event.
        Event.event = event;
        //send the event to the server so it can do creation things
        socket.emit('create', event);
        //redirect  to the event
        $location.path('/events/' + event);
      };
    }])
.controller('EventController', ['$window', '$scope', '$location', 'socket', 'Event',
    function ($window, $scope, $location, socket, Event) {
      //this is the array that gets ng-repeated in the view
      $scope.songs = [];

      // to keep track of which song is up
      $scope.songIndex = 0;

      //link to the search view
      $scope.search = function () {
        $location.path('/events/' + Event.event + '/search');
      };

      //let the server know that insider has arrived in the room.
      socket.emit('joined');

      //server responses to this with the eventState
      socket.on('joined', function (songs) {
        //add the songs from the server to the local array
        //we are getting an ng-repeate dups error here beacause
        //when the user comes back from the search page
        //this socket event is triggered, refreshing the local songs array
        //but the song has already been pushed when the the song added socket event
        //gets triggered just before. Still trying to figure this one out.
        //only happens when multiple people are in the event
        if ($scope.songs.length === 0) {

          $scope.songs = songs;
        }

      });

      //server get the song from the insider that added the song and
      //boadcasts it to everyone in the event. Here we get the song and
      //add it to our local array
      socket.on('songAdded', function (song) {
        $scope.songs.push(song);
      });

      
            
      // fired when the youtube iframe api is ready
      $window.onPlayerReady = function onPlayerReady(event) {
        console.log("ready");
        if ($scope.songs[$scope.songIndex]) {
          player.cueVideoById($scope.songs[$scope.songIndex].id);
          $scope.songIndex++;
          event.target.playVideo();
        }
      };

      // fired on any youtube state change, checks for a video ended event and
      // plays next song if yes
      $window.loadNext = function loadNext(event) {
        if ($scope.songs[$scope.songIndex] && event.data === YT.PlayerState.ENDED) {
          console.log("loadNext");
          player.loadVideoById($scope.songs[$scope.songIndex].id);
          $scope.songIndex++;
        }        
        console.log("loadnext");
      };

      // if the songs list used to be empty but now isn't, call the
      // onYouTubeIframAPIReady function (for loading reasons, has to be called
      // manually like this when you return from the search page)
      $scope.$watch(function(scope) { return scope.songs; },
          function(newVal, oldVal) {
            if (oldVal.length === 0 && newVal.length > 0) {
              $window.onYouTubeIframeAPIReady();
            }
          });
      
    }
])
.controller('SearchController', ['$scope', '$location', 'socket', 'searchFactory', 'Event',
    //******SearchController capitalized here, but not in original file. Check that it is consistently used in *****
    //HTML partial using this controller.
    function ($scope, $location, socket, searchFactory, Event) {
      //array of results we get back from the you tubes
      $scope.searchResults = [];

      //link back to event
      $scope.home = function () {
        $location.path('/events/' + Event.event);
      };

      //function called when insider hits the add button
      //defers work to the factory, just passes along the song obj.
      $scope.addSong = function (song) {
        searchFactory.addSong(song);
      };

      //defers the http call to the factory, then adds the songs to the
      //local array
      $scope.getSearchResults = function (searchTerm) {
        //********Original function name $scope.search. Make sure used consistently in partials and js files.*********
        searchFactory.getSearchResults(searchTerm)
          //******Originally $scope.searchTerm was passed as an argument to the factory method******
          //and there was nothing passed to the parent function. Make sure this is used consistently
          //and is not causing bugs.
          .then(function(result) {
            result.items.forEach(function (song) {
              var songObj = {
                id: song.id.videoId,
              url: 'https://www.youtube.com/embed/' + song.id.videoId,
              title: song.snippet.title,
              thumbnail: song.snippet.thumbnails.medium.url
              };
              $scope.searchResults.push(songObj);
            });
          });
      };

      socket.on('songAdded', function (song) {
        console.log(song);
      });
    }
]);

