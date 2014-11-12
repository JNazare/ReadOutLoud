// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('storyteller', ['ionic', 'ngRoute', 'kinvey'])

.config(function ($compileProvider){
  // Set the whitelist for certain URLs just to be safe
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
})

.config(function($routeProvider, $locationProvider) {
  // Set up the initial routes that our app will respond to.
  // These are then tied up to our nav router which animates and
  // updates a navigation bar
  $routeProvider.when('/', {
    templateUrl: 'library.html',
    controller: 'LibraryCtrl'
  });

  $routeProvider.when('/book/:book_id', {
    templateUrl: 'book.html',
    controller: 'BookCtrl'
  });

  // if none of the above routes are met, use this fallback
  // which executes the 'IntroCtrl' controller (controllers.js)
  $routeProvider.otherwise({
    redirectTo: '/'
  });
})

.controller('LibraryCtrl', function($scope, $kinvey) {
    var promise = $kinvey.init({
        appKey    : 'kid_bJe2dFWlU',
        appSecret : 'a22c88799ce248298aff031b96946969',
        sync      : { enable: true }
    });
    promise.then(function(activeUser) {
      if(!activeUser){
        var login = $kinvey.User.login({
          username : 'alpha',
          password : 'password'
        });
        login.then(function(logged_in){
          var query = $kinvey.DataStore.find('books');
          query.then(function(books){
              $scope.books = books;
          });
        })
      }
      else{
        var query = $kinvey.DataStore.find('books');
        query.then(function(books){
            $scope.books = books;
        });
      }
    })
  })

.controller('BookCtrl', function($scope, $location, $kinvey, $ionicSlideBoxDelegate) {
    // $scope.pages = [{"text":"Corduroy by Don Freeman","image":{"_type":"KinveyFile","_id":"f430f4d4-fa2f-4eeb-9bbe-9f4246912f82"}},{"text":"Corduroy is a bear who once lived in the toy department of a big store. Day after day he waited with all the other animals and dolls for somebody to come along and take him home.","image":{"_type":"KinveyFile","_id":"f25b17ac-fd3e-44a9-93b0-e1d846331917"}},{"text":"The store was always filled with shoppers buying all sorts of things, but no one ever seemed to want a small bear in green overalls.","image":{"_type":"KinveyFile","_id":"c974bcc9-4ce0-4242-846d-e9dd9b36f021"}}]
    $ionicSlideBoxDelegate.update();
    var book_id = $location.path().split("/")[2];
    var query = $kinvey.DataStore.get('books', book_id);
    query.then(function(book){
        $scope.pages = book.pages;
        $ionicSlideBoxDelegate.update();
    });
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})