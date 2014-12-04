// Generated by CoffeeScript 1.7.1
(function() {
  var app, speakWord;

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
    $routeProvider.when("/edit/:book_id", {
      templateUrl: "edit.html",
      controller: "EditCtrl"
    });
    $routeProvider.when("/new_page/:book_id/:after", {
      templateUrl: "new_page.html",
      controller: "NewPageCtrl"
    });
    $routeProvider.when("/lost_login", {
      templateUrl: "lost_login.html",
      controller: "LostLoginCtrl"
    });
    $routeProvider.otherwise({
      redirectTo: "/login"
    });
  });

  app.controller("LoginCtrl", function($scope, $kinvey, $location) {
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.email = "";
    $scope.password = "";
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.login({
        username: $scope.email,
        password: $scope.password
      });
      return promise.then((function(activeUser) {
        $scope.activeuser = activeUser;
        $location.path("/");
      }), function(error) {
        return $scope.flash = "Sorry! Incorrect username / password";
      });
    };
  });

  app.controller("LostLoginCtrl", function($scope, $kinvey, $location) {
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
    $scope.email = "";
    $scope.password = "";
    $scope.flash = "";
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.resetPassword($scope.email);
      return promise.then(function() {
        $location.path("/");
      });
    };
  });

  app.controller("SignupCtrl", function($scope, $kinvey, $location) {
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
    $scope.email = "";
    $scope.password = "";
    $scope.nativelang = "";
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.signup({
        username: $scope.email,
        password: $scope.password,
        nativelang: $scope.nativelang,
        email: $scope.email,
        speed: 0.1
      });
      return promise.then(function(activeUser) {
        $scope.activeuser = activeUser;
        $location.path("/");
      });
    };
  });

  app.controller("SettingsCtrl", function($scope, $kinvey, $location, $rootScope) {
    var activeUser, languages;
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
    $scope.flash = "";
    $scope.nativelang = "";
    activeUser = $kinvey.getActiveUser();
    $scope.activeuser = activeUser;
    languages = {
      "es": "Spanish",
      "zh": "Chinese",
      "ar": "Arabic",
      "pt": "Portuguese",
      "fr": "French",
      "de": "German"
    };
    $scope.currentLanguage = languages[activeUser.nativelang];
    delete languages[activeUser.nativelang];
    $scope.languages = languages;
    $scope.currentSpeed = activeUser.speed;
    $scope.submit = function() {
      var promise;
      if ($scope.nativelang) {
        activeUser.nativelang = $scope.nativelang;
        promise = $kinvey.User.update(activeUser);
        promise.then(function(activeUser) {
          return $rootScope.back();
        });
        return;
      }
      if ($scope.activeuser.speed) {
        activeUser.speed = $scope.activeuser.speed;
        promise = $kinvey.User.update(activeUser);
        promise.then(function(activeUser) {
          $rootScope.back();
        });
        return;
      }
      return $rootScope.back();
    };
  });

  app.controller("HomeCtrl", function($scope, $kinvey, $location) {
    var promise;
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
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
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
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
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
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

  app.controller("NewPageCtrl", [
    "$scope", "$kinvey", "fileUpload", "$location", function($scope, $kinvey, $fileUpload, $location) {
      var promise;
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
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
              var book_id, new_page, query;
              new_page = {
                text: $scope.text,
                image: {
                  _type: "KinveyFile",
                  _id: file._id
                }
              };
              book_id = $location.path().split("/")[2];
              query = $kinvey.DataStore.get("books", book_id);
              return query.then(function(book) {
                var page_index, page_promise;
                if ($scope.at_end) {
                  book.pages.push(new_page);
                  page_promise = $kinvey.DataStore.save("books", book);
                  return page_promise.then(function(book) {
                    return $location.path("/edit/" + book_id);
                  });
                } else {
                  page_index = $location.path().split("/")[3];
                  book.pages.splice(page_index, 0, new_page);
                  page_promise = $kinvey.DataStore.save("books", book);
                  return page_promise.then(function(book) {
                    return $location.path("/edit/" + book_id);
                  });
                }
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
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", "$ionicPopup", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup) {
      var getuser, word_count;
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $scope.selectedIndex = -1;
      $scope.count = 0;
      word_count = 0;
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
          $scope.translateWord = function(txt, $index) {
            var link;
            $scope.selectedIndex = $index;
            txt = txt.trim();
            txt = txt.replace(/["\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            link = "https://translation-app.herokuapp.com/api/en/" + activeUser.nativelang + "/" + txt;
            return $http.get(link).success(function(data, status, headers, config) {
              var speech1, speech2;
              $scope.translated_word = data;
              $scope.selected_word = txt;
              speech1 = speakWord(txt, 'en');
              speech2 = speakWord(data, activeUser.nativelang);
              window.speechSynthesis.speak(speech1);
              window.speechSynthesis.speak(speech2);
            }).error(function(data, status, headers, config) {});
          };
          $scope.clickMe = function(clickEvent) {
            var ct, speech, text;
            ct = 0;
            text = $scope.pages[clickEvent].text;
            speech = speakWord(text, 'en');
            window.speechSynthesis.speak(speech);
          };
          $scope.showPopup = function(image) {
            var alertPopup, tempate_string;
            tempate_string = '<img src="' + image + '" width="100%">';
            return alertPopup = $ionicPopup.alert({
              template: tempate_string
            });
          };
        });
      });
    }
  ]);

  speakWord = function(word, lang) {
    var speechLang, utterance;
    speechLang = {
      "es": "es-mx",
      "zh": "zh-cn",
      "ar": "ar-eg",
      "pt": "pt-br",
      "fr": "fr-fr",
      "de": "de-de",
      "en": "en-us"
    };
    utterance = new SpeechSynthesisUtterance();
    utterance.text = word;
    utterance.lang = speechLang[lang];
    utterance.rate = 0.1;
    return utterance;
  };

  app.controller("EditCtrl", [
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", "fileUpload", "$route", "$filter", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $fileUpload, $route, $filter) {
      var getuser;
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      getuser = $kinvey.User.me();
      getuser.then(function(activeUser) {
        var book_id, query;
        $scope.activeuser = activeUser;
        $ionicSlideBoxDelegate.update();
        book_id = $location.path().split("/")[2];
        query = $kinvey.DataStore.get("books", book_id);
        query.then(function(book) {
          $scope.book_id = book._id;
          $scope.pages = book.pages;
          $ionicSlideBoxDelegate.update();
          $scope.uploadFile = function(page_index) {
            var delete_page_image_promise, page_image, updated_page_promise, upload_promise;
            page_image = $scope.myFile;
            if (page_image) {
              delete_page_image_promise = $kinvey.File.destroy(book.pages[page_index].image._id);
              upload_promise = $kinvey.File.upload(page_image, {
                mimeType: "image/jpeg",
                size: page_image.size
              });
              return upload_promise.then(function(file) {
                var updated_page_promise;
                book.pages[page_index].image = {
                  _id: file._id,
                  _type: "KinveyFile"
                };
                book.pages[page_index].text = $scope.text;
                updated_page_promise = $kinvey.DataStore.save('books', book);
                return updated_page_promise.then(function(page) {
                  return $route.reload();
                });
              });
            } else {
              book.pages[page_index].text = $scope.text;
              updated_page_promise = $kinvey.DataStore.save('books', book);
              return updated_page_promise.then(function(page) {
                return $route.reload();
              });
            }
          };
          $scope.deletePage = function(page_index) {
            var delete_page_image_promise, delete_page_promise;
            delete_page_image_promise = $kinvey.File.destroy(book.pages[page_index].image._id);
            book.pages.splice(page_index, 1);
            delete_page_promise = $kinvey.DataStore.save('books', book);
            return delete_page_promise.then(function(page) {
              return $route.reload();
            });
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

  app.run(function($ionicPlatform, $rootScope, $location) {
    $ionicPlatform.ready(function() {
      var history;
      history = [];
      $rootScope.$on("$routeChangeSuccess", function() {
        history.push($location.$$path);
      });
      $rootScope.back = function() {
        var prevUrl;
        prevUrl = (history.length > 1 ? history.splice(-2)[0] : "/");
        $location.path(prevUrl);
      };
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  });

}).call(this);
