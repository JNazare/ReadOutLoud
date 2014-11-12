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


app.controller "BookCtrl", [
  "$scope"
  "$location"
  "$kinvey"
  "$ionicSlideBoxDelegate"
  "$sce"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce) ->
    $scope.count = 0
    getuser = $kinvey.User.me()
    getuser.then (activeUser) ->
        $scope.activeuser = activeUser
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
            $scope.clickMe = (clickEvent) ->
                text = $scope.pages[clickEvent].text
                utterance = new SpeechSynthesisUtterance(text)
                utterance.lang = 'en-US'
                utterance.rate = 0.1
                window.speechSynthesis.speak(utterance)
                return
            $scope.translateWord = (txt) ->
                console.log txt
            return
        return
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