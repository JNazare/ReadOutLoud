// Generated by CoffeeScript 1.7.1
(function() {
  var app;

  app = angular.module("storyteller", ["ionic", "ngRoute", "kinvey"]);

  app.config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
  });

  app.config(function($routeProvider, $locationProvider) {
    $routeProvider.when("/", {
      templateUrl: "library.html",
      controller: "HomeCtrl"
    });
    $routeProvider.when("/login", {
      templateUrl: "login.html",
      controller: "LoginCtrl"
    });
    $routeProvider.when("/signup", {
      templateUrl: "signup.html",
      controller: "SignupCtrl"
    });
    $routeProvider.when("/settings", {
      templateUrl: "settings.html",
      controller: "SettingsCtrl"
    });
    $routeProvider.when("/book/:book_id", {
      templateUrl: "book.html",
      controller: "BookCtrl"
    });
    $routeProvider.when("/admin", {
      templateUrl: "admin.html",
      controller: "AdminCtrl"
    });
    $routeProvider.when("/new_book", {
      templateUrl: "new_book.html",
      controller: "NewBookCtrl"
    });
    $routeProvider.otherwise({
      redirectTo: "/login"
    });
  });

  app.controller("LoginCtrl", function($scope, $kinvey, $location) {
    $scope.email = "";
    $scope.password = "";
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.login({
        username: $scope.email,
        password: $scope.password
      });
      return promise.then(function(activeUser) {
        $scope.activeuser = activeUser;
        $location.path("/");
      });
    };
  });

  app.controller("SignupCtrl", function($scope, $kinvey, $location) {
    $scope.email = "";
    $scope.password = "";
    $scope.nativelang = "";
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.signup({
        username: $scope.email,
        password: $scope.password,
        nativelang: $scope.nativelang
      });
      return promise.then(function(activeUser) {
        $scope.activeuser = activeUser;
        $location.path("/");
      });
    };
  });

  app.controller("SettingsCtrl", function($scope, $kinvey, $location) {
    var activeUser;
    $scope.nativelang = "";
    activeUser = $kinvey.getActiveUser();
    $scope.activeuser = activeUser;
    $scope.submit = function() {
      var promise;
      if ($scope.nativelang) {
        activeUser.nativelang = $scope.nativelang;
        promise = $kinvey.User.update(activeUser);
        promise.then(function(activeUser) {
          $scope.activeuser = activeUser;
          $location.path("/");
        });
      }
    };
  });

  app.controller("HomeCtrl", function($scope, $kinvey, $location) {
    var promise;
    promise = $kinvey.init({
      appKey: "kid_bJe2dFWlU",
      appSecret: "a22c88799ce248298aff031b96946969",
      sync: {
        enable: true
      }
    });
    promise.then(function(activeUser) {
      var query;
      if (activeUser) {
        $scope.activeuser = activeUser;
        query = $kinvey.DataStore.find("books");
        query.then(function(books) {
          $scope.books = books;
        });
        return;
      } else {
        $location.path("/login");
        return;
      }
    });
  });

  app.controller("AdminCtrl", function($scope, $kinvey, $location, $route) {
    var promise;
    promise = $kinvey.init({
      appKey: "kid_bJe2dFWlU",
      appSecret: "a22c88799ce248298aff031b96946969",
      sync: {
        enable: true
      }
    });
    promise.then(function(activeUser) {
      var query;
      if (activeUser) {
        $scope.activeuser = activeUser;
        query = $kinvey.DataStore.find("books");
        query.then(function(books) {
          $scope.books = books;
          $scope.deleteBook = function(book) {
            var delete_book_promise, delete_cover_promise, delete_file_id, delete_file_promise, i;
            if (book.pages) {
              i = 0;
              while (i < book.pages.length) {
                delete_file_id = book.pages[i].image._id;
                delete_file_promise = $kinvey.File.destroy(delete_file_id);
                i++;
              }
            }
            delete_cover_promise = $kinvey.File.destroy(book.cover_id._id);
            delete_book_promise = $kinvey.DataStore.destroy('books', book._id);
            return $route.reload();
          };
        });
        return;
      } else {
        $location.path("/login");
        return;
      }
    });
  });

  app.controller("NewBookCtrl", [
    "$scope", "$kinvey", "fileUpload", "$location", function($scope, $kinvey, $fileUpload, $location) {
      var promise;
      promise = $kinvey.init({
        appKey: "kid_bJe2dFWlU",
        appSecret: "a22c88799ce248298aff031b96946969",
        sync: {
          enable: true
        }
      });
      return promise.then(function(activeUser) {
        if (activeUser) {
          return $scope.uploadFile = function() {
            var cover_image, upload_promise;
            cover_image = $scope.myFile;
            upload_promise = $kinvey.File.upload(cover_image, {
              mimeType: "image/jpeg",
              size: cover_image.size
            });
            upload_promise.then(function(file) {
              var page_promise;
              page_promise = $kinvey.DataStore.save("books", {
                title: $scope.title,
                author: $scope.author,
                cover_id: {
                  _type: "KinveyFile",
                  _id: file._id
                },
                created_by: activeUser._id
              });
              return page_promise.then(function(book) {
                $scope.activeuser = activeUser;
                return $location.path("/admin");
              });
            });
          };
        } else {
          $location.path("/login");
        }
      });
    }
  ]);

  app.controller("BookCtrl", [
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http) {
      var getuser;
      $scope.count = 0;
      getuser = $kinvey.User.me();
      getuser.then(function(activeUser) {
        var book_id, query;
        $scope.activeuser = activeUser;
        $scope.translated_word = "";
        $scope.selected_word = "";
        $ionicSlideBoxDelegate.update();
        book_id = $location.path().split("/")[2];
        query = $kinvey.DataStore.get("books", book_id);
        query.then(function(book) {
          var new_pages;
          new_pages = [];
          angular.forEach(book.pages, function(page) {
            return new_pages.push({
              image: page.image,
              text: page.text,
              listed_text: page.text.split(" ")
            });
          });
          $scope.pages = new_pages;
          $ionicSlideBoxDelegate.update();
          $scope.translateWord = function(txt) {
            var link;
            txt = txt.trim();
            txt = txt.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            link = "https://translation-app.herokuapp.com/api/en/" + activeUser.nativelang + "/" + txt;
            return $http.get(link).success(function(data, status, headers, config) {
              $scope.translated_word = data;
              $scope.selected_word = txt;
            }).error(function(data, status, headers, config) {
              console.log("error");
            });
          };
          $scope.clickMe = function(clickEvent) {
            var text, utterance;
            text = $scope.pages[clickEvent].text;
            utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.1;
            window.speechSynthesis.speak(utterance);
          };
        });
      });
    }
  ]);

  app.directive("fileModel", [
    "$parse", function($parse) {
      return {
        restrict: "A",
        link: function(scope, element, attrs) {
          var model, modelSetter;
          model = $parse(attrs.fileModel);
          modelSetter = model.assign;
          element.bind("change", function() {
            scope.$apply(function() {
              modelSetter(scope, element[0].files[0]);
            });
          });
        }
      };
    }
  ]);

  app.service("fileUpload", [
    "$http", function($http) {
      return this.uploadFileToUrl = function(file, uploadUrl) {
        var fd;
        fd = new FormData();
        fd.append("file", file);
        $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          headers: {
            "Content-Type": undefined
          }
        }).success(function() {}).error(function() {});
      };
    }
  ]);

  app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  });

}).call(this);
