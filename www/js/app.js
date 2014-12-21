// Generated by CoffeeScript 1.7.1
(function() {
  var app, selectActiveLanguage, speakText;

  app = angular.module("storyteller", ["ionic", "ngRoute", "kinvey", "base64"]);

  app.config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
  });

  app.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(["self", "http://0.0.0.0:3000/**"]);
  });

  app.config([
    "$httpProvider", function($httpProvider) {
      $httpProvider.defaults.headers.common = {};
      $httpProvider.defaults.headers.post = {};
      $httpProvider.defaults.headers.put = {};
      return $httpProvider.defaults.headers.patch = {};
    }
  ]);

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
    $routeProvider.when("/edit_page/:book_id/:page_num", {
      templateUrl: "edit_page.html",
      controller: "EditPageCtrl"
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

  app.controller("LoginCtrl", function($scope, $kinvey, $location, $ionicLoading) {
    $ionicLoading.show({
      content: "Loading",
      animation: "fade-in",
      showBackdrop: true,
      showDelay: 0
    });
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $ionicLoading.hide();
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
    $scope.submit = function() {
      var promise;
      promise = $kinvey.User.signup({
        username: $scope.email,
        password: $scope.password,
        nativelang: $scope.nativelang,
        email: $scope.email,
        speed: 0.1,
        role: "user",
        run_ocr: false
      });
      return promise.then(function(activeUser) {
        $scope.activeuser = activeUser;
        $location.path("/");
      });
    };
  });

  app.controller("SettingsCtrl", function($scope, $kinvey, $location, $rootScope, $ionicLoading) {
    var promise;
    $ionicLoading.show({
      content: "Loading",
      animation: "fade-in",
      showBackdrop: true,
      showDelay: 0
    });
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
    $scope.activeuser = $kinvey.getActiveUser();
    promise = $kinvey.DataStore.find('languages');
    promise.then(function(languages) {
      $scope.languages = languages;
      $scope.currentLanguage = $scope.languages[selectActiveLanguage(languages, $scope.activeuser.nativelang)];
      return $ionicLoading.hide();
    });
    $scope.submit = function() {
      $scope.activeuser.nativelang = $scope.currentLanguage._id;
      $scope.activeuser.speed = Number($scope.activeuser.speed);
      $scope.activeuser.run_ocr = $scope.activeuser.run_ocr;
      console.log($scope.activeuser.run_ocr);
      promise = $kinvey.User.update($scope.activeuser);
      return promise.then(function(activeUser) {
        return $rootScope.back();
      });
    };
    $scope.logout = function() {
      promise = $kinvey.User.logout();
      return $location.path("/login");
    };
  });

  app.controller("HomeCtrl", function($scope, $kinvey, $location, $ionicLoading) {
    var promise;
    $ionicLoading.show({
      content: "Loading",
      animation: "fade-in",
      showBackdrop: true,
      showDelay: 0
    });
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
          $ionicLoading.hide();
        });
        return;
      } else {
        $location.path("/login");
        return;
      }
    });
  });

  app.controller("AdminCtrl", function($scope, $kinvey, $location, $route) {
    var promise, query;
    $scope.templates = [
      {
        name: 'navbar.html',
        url: '_partials/navbar.html'
      }
    ];
    $scope.back_button = true;
    $scope.activeuser = $kinvey.getActiveUser();
    if ($scope.activeuser) {
      query = new $kinvey.Query();
      if ($scope.activeuser.role === "user") {
        query.equalTo('creator', $scope.activeuser._id);
      }
      promise = $kinvey.DataStore.find("books", query);
      promise.then(function(books) {
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

  app.controller("NewBookCtrl", [
    "$scope", "$kinvey", "fileUpload", "$location", function($scope, $kinvey, $fileUpload, $location) {
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $scope.activeuser = $kinvey.getActiveUser();
      if ($scope.activeuser) {
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
              creator: $scope.activeuser._id,
              pages: []
            });
            return page_promise.then(function(book) {
              return $location.path("/edit/" + book._id);
            });
          });
        };
      } else {
        $location.path("/login");
      }
    }
  ]);

  app.controller("NewPageCtrl", [
    "$scope", "$kinvey", "fileUpload", "$location", "$http", "$base64", "$ionicLoading", function($scope, $kinvey, $fileUpload, $location, $http, $base64, $ionicLoading) {
      var OCRFile, OCRImage, OCRPath, call;
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $scope.text = "";
      $scope.stage = 0;
      OCRImage = function(image) {
        var canvas, canvas_height, canvas_width, ctx;
        canvas = document.createElement("canvas");
        canvas_width = image.naturalWidth;
        canvas_height = image.naturalHeight;
        if (image.naturalWidth > 1500) {
          canvas_width = 1500;
          canvas_height = (canvas_width * image.naturalHeight) / image.naturalWidth;
        }
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas_width, canvas_height);
        return OCRAD(ctx);
      };
      OCRPath = function(url, callback) {
        var image;
        image = new Image();
        image.src = url;
        image.onload = function() {
          callback(OCRImage(image));
        };
      };
      OCRFile = function(file, callback) {
        var reader;
        reader = new FileReader();
        reader.onload = function() {
          OCRPath(reader.result, callback);
        };
        reader.readAsDataURL(file);
      };
      call = function(text) {
        $scope.text = text.replace(/\b[-.,()&$#!'\[\]{}_ /\n%"]+\B|\B[-.,()&$#!'\[\]{}_ /|%"]/g, "").trim();
        console.log($scope.text);
        return text;
      };
      $scope.file_changed = function(element, s) {
        var imgtag, reader, selectedFile, text;
        $scope.text = "";
        if ($scope.activeuser.run_ocr === true) {
          text = OCRFile(element.files[0], call);
        }
        $scope.myFile = element.files[0];
        selectedFile = element.files[0];
        reader = new FileReader();
        imgtag = document.getElementById("myimage");
        imgtag.title = selectedFile.name;
        reader.onload = function(event) {
          imgtag.src = event.target.result;
        };
        reader.readAsDataURL(selectedFile);
      };
      $scope.activeuser = $kinvey.getActiveUser();
      if ($scope.activeuser) {
        $scope.uploadPage = function() {
          return $scope.stage = $scope.stage + 1;
        };
        return $scope.uploadFile = function() {
          var cover_image, upload_promise;
          $ionicLoading.show({
            content: "Loading",
            animation: "fade-in",
            showBackdrop: true,
            showDelay: 0
          });
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
              var page_promise;
              book.pages.push(new_page);
              page_promise = $kinvey.DataStore.save("books", book);
              return page_promise.then(function(book) {
                $location.path("/edit/" + book_id);
                return $ionicLoading.hide();
              });
            });
          });
        };
      } else {
        $location.path("/login");
      }
    }
  ]);

  app.controller("BookCtrl", [
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", "$ionicPopup", "$ionicPopover", "$ionicLoading", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup, $ionicPopover, $ionicLoading) {
      var book_id, query;
      $ionicLoading.show({
        content: "Loading",
        animation: "fade-in",
        showBackdrop: true,
        showDelay: 0
      });
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $ionicSlideBoxDelegate.update();
      $scope.activeuser = $kinvey.getActiveUser();
      $scope.selectedIndex = -1;
      book_id = $location.path().split("/")[2];
      query = $kinvey.DataStore.get("books", book_id);
      query.then(function(book) {
        var new_pages, promise;
        new_pages = [];
        angular.forEach(book.pages, function(page) {
          return new_pages.push({
            image: page.image,
            text: page.text,
            listed_text: page.text.split(" ")
          });
        });
        $scope.pages = new_pages;
        promise = $kinvey.DataStore.find('languages');
        promise.then(function(languages) {
          $scope.voice_code = languages[selectActiveLanguage(languages, $scope.activeuser.nativelang)].voice;
          return $ionicLoading.hide();
        });
        $scope.translateWord = function($event, txt, $index) {
          var link;
          $scope.selectedIndex = $index;
          txt = txt.trim().replace(/["\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          link = "https://translation-app.herokuapp.com/api/en/" + $scope.activeuser.nativelang + "/" + txt;
          return $http.get(link).success(function(data, status, headers, config) {
            var speech_english, speech_native;
            $scope.translated_word = data;
            $scope.selected_word = txt;
            $scope.popover.show($event);
            speech_english = speakText(txt, 'en-us', $scope.activeuser.speed);
            speech_native = speakText(data, $scope.voice_code, $scope.activeuser.speed);
            window.speechSynthesis.speak(speech_english);
            window.speechSynthesis.speak(speech_native);
          }).error(function(data, status, headers, config) {});
        };
        $scope.clickMe = function(clickEvent) {
          var speech, text;
          console.log('here');
          text = $scope.pages[clickEvent].text;
          speech = speakText(text, 'en-us', $scope.activeuser.speed);
          return window.speechSynthesis.speak(speech);
        };
        return $scope.showPopup = function(image) {
          var alertPopup, tempate_string;
          tempate_string = '<img src="' + image + '" width="100%">';
          return alertPopup = $ionicPopup.alert({
            template: tempate_string,
            buttons: [
              {
                text: "<strong>OK</strong>",
                type: "button-balanced"
              }
            ]
          });
        };
      });
      $ionicPopover.fromTemplateUrl("_partials/translation.html", {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
      $scope.openPopover = function($event) {
        $scope.popover.show($event);
      };
      $scope.closePopover = function() {
        $scope.selectedIndex = -1;
        $scope.popover.hide();
      };
      $scope.$on("$destroy", function() {
        $scope.selectedIndex = -1;
        $scope.popover.remove();
      });
      $scope.$on("popover.hidden", function() {
        $scope.selectedIndex = -1;
      });
      $scope.$on("popover.removed", function() {
        $scope.selectedIndex = -1;
      });
    }
  ]);

  app.controller("EditPageCtrl", [
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", "$ionicPopup", "$ionicPopover", "$ionicLoading", "$route", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup, $ionicPopover, $ionicLoading, $route) {
      var book_id, page_num, query;
      $ionicLoading.show({
        content: "Loading",
        animation: "fade-in",
        showBackdrop: true,
        showDelay: 0
      });
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $ionicSlideBoxDelegate.update();
      $scope.activeuser = $kinvey.getActiveUser();
      $scope.selectedIndex = -1;
      book_id = $location.path().split("/")[2];
      page_num = $location.path().split("/")[3];
      query = $kinvey.DataStore.get("books", book_id);
      return query.then(function(book) {
        $scope.book = book;
        $scope.page = book.pages[page_num];
        $scope.text = $scope.page.text;
        $scope.page_num = Number(page_num) + 1;
        console.log($scope.page);
        $ionicLoading.hide();
        $scope.showPopup = function(image) {
          var alertPopup, tempate_string;
          tempate_string = '<img src="' + image + '" width="100%">';
          return alertPopup = $ionicPopup.alert({
            template: tempate_string,
            buttons: [
              {
                text: "<strong>OK</strong>",
                type: "button-balanced"
              }
            ]
          });
        };
        $scope.savePage = function() {
          var delete_page_image_promise, page_image, updated_page_promise, upload_promise;
          page_image = $scope.myFile;
          if (page_image) {
            delete_page_image_promise = $kinvey.File.destroy(book.pages[page_num].image._id);
            upload_promise = $kinvey.File.upload(page_image, {
              mimeType: "image/jpeg",
              size: page_image.size
            });
            return upload_promise.then(function(file) {
              var updated_page_promise;
              book.pages[page_num].image = {
                _id: file._id,
                _type: "KinveyFile"
              };
              book.pages[page_num].text = $scope.text;
              updated_page_promise = $kinvey.DataStore.save('books', book);
              return updated_page_promise.then(function(page) {
                return $route.reload();
              });
            });
          } else {
            book.pages[page_num].text = $scope.text;
            updated_page_promise = $kinvey.DataStore.save('books', book);
            return updated_page_promise.then(function(page) {
              return $route.reload();
            });
          }
        };
        return $scope.deletePage = function() {
          var delete_page_image_promise, delete_page_promise;
          delete_page_image_promise = $kinvey.File.destroy(book.pages[page_num].image._id);
          book.pages.splice(page_num, 1);
          delete_page_promise = $kinvey.DataStore.save('books', book);
          return delete_page_promise.then(function(book) {
            return $location.path("/edit/" + book_id);
          });
        };
      });
    }
  ]);

  app.controller("EditCtrl", [
    "$scope", "$location", "$kinvey", "$ionicSlideBoxDelegate", "$sce", "$http", "fileUpload", "$route", "$filter", function($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $fileUpload, $route, $filter) {
      var book_id, query;
      $scope.templates = [
        {
          name: 'navbar.html',
          url: '_partials/navbar.html'
        }
      ];
      $scope.back_button = true;
      $scope.activeuser = $kinvey.getActiveUser();
      console.log($scope.activeuser);
      $ionicSlideBoxDelegate.update();
      book_id = $location.path().split("/")[2];
      query = $kinvey.DataStore.get("books", book_id);
      query.then(function(book) {
        $scope.book = book;
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

  speakText = function(word, voice_code, speed) {
    var utterance;
    utterance = new SpeechSynthesisUtterance();
    utterance.text = word;
    utterance.lang = voice_code;
    utterance.rate = speed;
    return utterance;
  };

  selectActiveLanguage = function(languages, nativelang) {
    var i;
    i = 0;
    while (i < languages.length) {
      if (languages[i]._id === nativelang) {
        break;
      }
      i++;
    }
    return i;
  };

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
