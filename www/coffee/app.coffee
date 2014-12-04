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

    $routeProvider.when "/edit/:book_id",
        templateUrl: "edit.html"
        controller: "EditCtrl"

    $routeProvider.when "/new_page/:book_id/:after",
        templateUrl: "new_page.html"
        controller: "NewPageCtrl"

    $routeProvider.when "/lost_login",
        templateUrl: "lost_login.html"
        controller: "LostLoginCtrl"

    $routeProvider.otherwise redirectTo: "/login"
    return
)

app.controller("LoginCtrl", ($scope, $kinvey, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.email=""
    $scope.password=""
    $scope.submit = ->
        promise = $kinvey.User.login(
            username: $scope.email
            password: $scope.password
        )
        promise.then ((activeUser) ->
            $scope.activeuser = activeUser
            $location.path("/")
            return),
        (error) ->
            $scope.flash = "Sorry! Incorrect username / password"
    return
    )

app.controller("LostLoginCtrl", ($scope, $kinvey, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.email=""
    $scope.password=""
    $scope.flash = ""
    $scope.submit = ->
        promise = $kinvey.User.resetPassword( $scope.email )
        promise.then () ->
            $location.path("/")
            return
    return
    )

app.controller("SignupCtrl", ($scope, $kinvey, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.email=""
    $scope.password=""
    $scope.nativelang=""
    $scope.submit = ->
        promise = $kinvey.User.signup(
            username: $scope.email
            password: $scope.password
            nativelang: $scope.nativelang
            email: $scope.email
            speed: 0.1
        )
        promise.then (activeUser) ->
            $scope.activeuser = activeUser
            $location.path("/")
            return
    return
    )

app.controller("SettingsCtrl", ($scope, $kinvey, $location, $rootScope) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.flash = ""
    $scope.nativelang=""
    activeUser = $kinvey.getActiveUser()
    $scope.activeuser = activeUser
    languages = {"es": "Spanish", "zh": "Chinese", "ar": "Arabic", "pt": "Portuguese", "fr": "French", "de" : "German"}
    $scope.currentLanguage = languages[activeUser.nativelang]
    delete languages[activeUser.nativelang]
    $scope.languages = languages
    $scope.currentSpeed = activeUser.speed
    $scope.submit = ->
        if($scope.nativelang)
            activeUser.nativelang = $scope.nativelang
            promise = $kinvey.User.update(activeUser)
            promise.then (activeUser) ->
                $rootScope.back()
            return
        if($scope.activeuser.speed)
            activeUser.speed = $scope.activeuser.speed
            promise = $kinvey.User.update(activeUser)
            promise.then (activeUser) ->
                $rootScope.back()
                return
            return
        $rootScope.back()
    return
    )

app.controller("HomeCtrl", ($scope, $kinvey, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
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
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
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
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
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

app.controller "NewPageCtrl", [
  "$scope"
  "$kinvey"
  "fileUpload"
  "$location"
  ($scope, $kinvey, $fileUpload, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
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
                    new_page = 
                        text: $scope.text
                        image: 
                            _type: "KinveyFile"
                            _id: file._id
                    book_id = $location.path().split("/")[2]
                    query = $kinvey.DataStore.get("books", book_id)
                    query.then (book) ->
                        if($scope.at_end)
                            book.pages.push(new_page)
                            page_promise = $kinvey.DataStore.save("books", book)
                            page_promise.then (book) ->
                                $location.path("/edit/"+book_id)
                        else
                           page_index = $location.path().split("/")[3]
                           book.pages.splice(page_index, 0, new_page)
                           page_promise = $kinvey.DataStore.save("books", book)
                           page_promise.then (book) ->
                                $location.path("/edit/"+book_id)
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
  "$ionicPopup"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.selectedIndex = -1;
    $scope.count = 0
    word_count = 0
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
            $scope.translateWord = (txt, $index) ->
                $scope.selectedIndex = $index
                txt = txt.trim()
                txt = txt.replace(/["\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"")
                link = "https://translation-app.herokuapp.com/api/en/"+activeUser.nativelang+"/"+txt
                $http.get(link).success((data, status, headers, config) ->
                    $scope.translated_word = data
                    $scope.selected_word = txt
                    speech1 = speakWord(txt, 'en')
                    speech2 = speakWord(data, activeUser.nativelang)
                    window.speechSynthesis.speak(speech1)
                    window.speechSynthesis.speak(speech2)
                    return
                ).error (data, status, headers, config) ->
                    return
            $scope.clickMe = (clickEvent) ->
                ct = 0
                text = $scope.pages[clickEvent].text
                speech = speakWord(text, 'en')
                window.speechSynthesis.speak(speech)
                return
            $scope.showPopup = (image) ->
                tempate_string = '<img src="' + image + '" width="100%">'
                alertPopup = $ionicPopup.alert(
                    template: tempate_string
                )
            return
        return
    return
]

speakWord = (word, lang) ->
    speechLang = {"es": "es-mx", "zh": "zh-cn", "ar": "ar-eg", "pt": "pt-br", "fr": "fr-fr", "de" : "de-de", "en" : "en-us"}
    utterance = new SpeechSynthesisUtterance()
    utterance.text = word
    utterance.lang = speechLang[lang]
    utterance.rate = 0.1 # activeUser.speed
    return utterance
    # window.speechSynthesis.speak(utterance)


app.controller "EditCtrl", [
  "$scope"
  "$location"
  "$kinvey"
  "$ionicSlideBoxDelegate"
  "$sce"
  "$http"
  "fileUpload"
  "$route"
  "$filter"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $fileUpload, $route, $filter) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    getuser = $kinvey.User.me()
    getuser.then (activeUser) ->
        $scope.activeuser = activeUser
        $ionicSlideBoxDelegate.update()
        book_id = $location.path().split("/")[2]
        query = $kinvey.DataStore.get("books", book_id)
        query.then (book) ->
            $scope.book_id = book._id
            $scope.pages = book.pages
            $ionicSlideBoxDelegate.update()
            $scope.uploadFile = (page_index) ->
                page_image = $scope.myFile
                if page_image
                    delete_page_image_promise = $kinvey.File.destroy(book.pages[page_index].image._id)
                    upload_promise = $kinvey.File.upload(page_image,
                        mimeType: "image/jpeg"
                        size: page_image.size
                    )
                    upload_promise.then (file) ->
                        book.pages[page_index].image = 
                            _id: file._id
                            _type: "KinveyFile"
                        book.pages[page_index].text = $scope.text
                        updated_page_promise = $kinvey.DataStore.save('books', book)
                        updated_page_promise.then (page) ->
                            $route.reload()
                else
                    book.pages[page_index].text = $scope.text
                    updated_page_promise = $kinvey.DataStore.save('books', book)
                    updated_page_promise.then (page) ->
                        $route.reload()
            $scope.deletePage = (page_index) ->
                delete_page_image_promise = $kinvey.File.destroy(book.pages[page_index].image._id)
                book.pages.splice(page_index, 1)
                delete_page_promise = $kinvey.DataStore.save('books', book)
                delete_page_promise.then (page) ->
                    $route.reload()
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


app.run ($ionicPlatform, $rootScope, $location) ->
    $ionicPlatform.ready ->
        
        # Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        # for form inputs)

        history = []
        $rootScope.$on "$routeChangeSuccess", ->
            history.push $location.$$path
            return

        $rootScope.back = ->
            prevUrl = (if history.length > 1 then history.splice(-2)[0] else "/")
            $location.path prevUrl
            return

        cordova.plugins.Keyboard.hideKeyboardAccessoryBar true  if window.cordova and window.cordova.plugins.Keyboard
        StatusBar.styleDefault()  if window.StatusBar
        return
    return