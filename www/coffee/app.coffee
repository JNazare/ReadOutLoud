app = angular.module("storyteller", [
    "ionic"
    "ngRoute"
    "kinvey"
])

app.config(($compileProvider) ->
    $compileProvider.aHrefSanitizationWhitelist /^\s*(https?|ftp|mailto|file|tel):/
    return
)

app.config(($routeProvider, $locationProvider) ->

    $routeProvider.when "/",
        templateUrl: "library.html"
        controller: "HomeCtrl"

    $routeProvider.when "/login",
        templateUrl: "login.html"
        controller: "LoginCtrl"

    $routeProvider.when "/signup",
        templateUrl: "signup.html"
        controller: "SignupCtrl"

    $routeProvider.when "/settings",
        templateUrl: "settings.html"
        controller: "SettingsCtrl"

    $routeProvider.when "/book/:book_id",
        templateUrl: "book.html"
        controller: "BookCtrl"

    $routeProvider.when "/admin",
        templateUrl: "admin.html"
        controller: "AdminCtrl"

    $routeProvider.when "/new_book",
        templateUrl: "new_book.html"
        controller: "NewBookCtrl"

    $routeProvider.otherwise redirectTo: "/login"
    return
)

app.controller("LoginCtrl", ($scope, $kinvey, $location) ->
    $scope.email=""
    $scope.password=""
    $scope.submit = ->
        promise = $kinvey.User.login(
            username: $scope.email
            password: $scope.password
        )
        promise.then (activeUser) ->
            $scope.activeuser = activeUser
            $location.path("/")
            return
    return
    )

app.controller("SignupCtrl", ($scope, $kinvey, $location) ->
    $scope.email=""
    $scope.password=""
    $scope.nativelang=""
    $scope.submit = ->
        promise = $kinvey.User.signup(
            username: $scope.email
            password: $scope.password
            nativelang: $scope.nativelang
        )
        promise.then (activeUser) ->
            $scope.activeuser = activeUser
            $location.path("/")
            return
    return
    )

app.controller("SettingsCtrl", ($scope, $kinvey, $location) ->
    $scope.nativelang=""
    activeUser = $kinvey.getActiveUser()
    $scope.activeuser = activeUser
    $scope.submit = ->
        if($scope.nativelang)
            activeUser.nativelang = $scope.nativelang
            promise = $kinvey.User.update(activeUser)
            promise.then (activeUser) ->
                $scope.activeuser = activeUser
                $location.path("/")
                return
            return
    return
    )

app.controller("HomeCtrl", ($scope, $kinvey, $location) ->
    promise = $kinvey.init(
        appKey: "kid_bJe2dFWlU"
        appSecret: "a22c88799ce248298aff031b96946969"
        sync:
            enable: true
    )
    promise.then (activeUser) ->
        if(activeUser)
            $scope.activeuser = activeUser
            query = $kinvey.DataStore.find("books")
            query.then (books) ->
                $scope.books = books
                return
            return
        else
            $location.path("/login")
            return
        return
    return
)

app.controller("AdminCtrl", ($scope, $kinvey, $location, $route) ->
    promise = $kinvey.init(
        appKey: "kid_bJe2dFWlU"
        appSecret: "a22c88799ce248298aff031b96946969"
        sync:
            enable: true
    )
    promise.then (activeUser) ->
        if(activeUser)
            $scope.activeuser = activeUser
            query = $kinvey.DataStore.find("books")
            query.then (books) ->
                $scope.books = books
                $scope.deleteBook = (book) ->
                    if(book.pages)
                        i = 0
                        while i < book.pages.length
                            delete_file_id = book.pages[i].image._id
                            delete_file_promise = $kinvey.File.destroy(delete_file_id)
                            i++
                    delete_cover_promise = $kinvey.File.destroy(book.cover_id._id)
                    delete_book_promise = $kinvey.DataStore.destroy('books', book._id)
                    $route.reload()
                return
            return
        else
            $location.path("/login")
            return
        return
    return
)

app.controller "NewBookCtrl", [
  "$scope"
  "$kinvey"
  "fileUpload"
  "$location"
  ($scope, $kinvey, $fileUpload, $location) ->
    promise = $kinvey.init(
        appKey: "kid_bJe2dFWlU"
        appSecret: "a22c88799ce248298aff031b96946969"
        sync:
            enable: true
    )
    promise.then (activeUser) ->
        if(activeUser)
            $scope.uploadFile = ->
                cover_image = $scope.myFile
                upload_promise = $kinvey.File.upload(cover_image,
                  mimeType: "image/jpeg"
                  size: cover_image.size
                )
                upload_promise.then (file) ->
                    page_promise = $kinvey.DataStore.save("books",
                      title: $scope.title
                      author: $scope.author
                      cover_id: 
                        _type: "KinveyFile"
                        _id: file._id
                      created_by: activeUser._id
                    )
                    page_promise.then (book) ->
                        $scope.activeuser = activeUser
                        $location.path("/admin")
                return
        else
            $location.path("/login")
            return
]

app.controller "BookCtrl", [
  "$scope"
  "$location"
  "$kinvey"
  "$ionicSlideBoxDelegate"
  "$sce"
  "$http"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http) ->
    $scope.count = 0
    getuser = $kinvey.User.me()
    getuser.then (activeUser) ->
        $scope.activeuser = activeUser
        $scope.translated_word = ""
        $scope.selected_word = ""
        $ionicSlideBoxDelegate.update()
        book_id = $location.path().split("/")[2]
        query = $kinvey.DataStore.get("books", book_id)
        query.then (book) ->
            new_pages = []
            angular.forEach book.pages, (page) ->
                new_pages.push
                  image: page.image
                  text: page.text
                  listed_text: page.text.split(" ")
            $scope.pages = new_pages
            $ionicSlideBoxDelegate.update()
            $scope.translateWord = (txt) ->
                txt = txt.trim()
                txt = txt.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"")
                link = "https://translation-app.herokuapp.com/api/en/"+activeUser.nativelang+"/"+txt
                $http.get(link).success((data, status, headers, config) ->
                  $scope.translated_word = data
                  $scope.selected_word = txt
                  return
                ).error (data, status, headers, config) ->
                  console.log "error"
                  return
            $scope.clickMe = (clickEvent) ->
                text = $scope.pages[clickEvent].text
                utterance = new SpeechSynthesisUtterance(text)
                utterance.lang = 'en-US'
                utterance.rate = 0.1
                window.speechSynthesis.speak(utterance)
                return
            return
        return
    return
]

app.directive "fileModel", [
  "$parse"
  ($parse) ->
    return (
      restrict: "A"
      link: (scope, element, attrs) ->
        model = $parse(attrs.fileModel)
        modelSetter = model.assign
        element.bind "change", ->
          scope.$apply ->
            modelSetter scope, element[0].files[0]
            return
          return
        return
    )
]

app.service "fileUpload", [
  "$http"
  ($http) ->
    @uploadFileToUrl = (file, uploadUrl) ->
      fd = new FormData()
      fd.append "file", file
      $http.post(uploadUrl, fd,
        transformRequest: angular.identity
        headers:
          "Content-Type": `undefined`
      ).success(->
      ).error ->
      return
]

app.run ($ionicPlatform) ->
    $ionicPlatform.ready ->
        
        # Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        # for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar true  if window.cordova and window.cordova.plugins.Keyboard
        StatusBar.styleDefault()  if window.StatusBar
        return
    return