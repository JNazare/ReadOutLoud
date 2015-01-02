app = angular.module("storyteller", [
    "ionic"
    "ngRoute"
    "kinvey"
    "base64"
])

app.config(($compileProvider) ->
    $compileProvider.aHrefSanitizationWhitelist /^\s*(https?|ftp|mailto|file|tel):/
    return
)

app.config ($sceDelegateProvider) ->
    $sceDelegateProvider.resourceUrlWhitelist [
        "self"
        "http://0.0.0.0:3000/**"
    ]
    return

app.config [
  "$httpProvider"
  ($httpProvider) ->
    # Reset headers to avoid OPTIONS request (aka preflight)
    $httpProvider.defaults.headers.common = {}
    $httpProvider.defaults.headers.post = {}
    $httpProvider.defaults.headers.put = {}
    $httpProvider.defaults.headers.patch = {}
]

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

    $routeProvider.when "/edit_page/:book_id/:page_num",
        templateUrl: "edit_page.html"
        controller: "EditPageCtrl"

    $routeProvider.when "/new_page/:book_id/:after",
        templateUrl: "new_page.html"
        controller: "NewPageCtrl"

    $routeProvider.when "/lost_login",
        templateUrl: "lost_login.html"
        controller: "LostLoginCtrl"

    $routeProvider.otherwise redirectTo: "/login"
    return
)

app.controller("LoginCtrl", ($scope, $kinvey, $location, $ionicLoading) ->
    $ionicLoading.show
        content: "Loading"
        animation: "fade-in"
        showBackdrop: true
        showDelay: 0
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $ionicLoading.hide()
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
    $scope.submit = ->
        promise = $kinvey.User.signup(
            username: $scope.email
            password: $scope.password
            nativelang: $scope.nativelang
            email: $scope.email
            speed: 0.1
            role: "user"
            run_ocr: false
        )
        promise.then (activeUser) ->
            $scope.activeuser = activeUser
            $location.path("/")
            return
    return
    )

app.controller("SettingsCtrl", ($scope, $kinvey, $location, $rootScope, $ionicLoading) ->
    $ionicLoading.show
        content: "Loading"
        animation: "fade-in"
        showBackdrop: true
        showDelay: 0
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.activeuser = $kinvey.getActiveUser()
    promise = $kinvey.DataStore.find('languages')
    promise.then (languages) ->
        $scope.languages = languages
        $scope.currentLanguage = $scope.languages[selectActiveLanguage(languages, $scope.activeuser.nativelang)]
        $ionicLoading.hide()
    $scope.submit = ->
        $scope.activeuser.nativelang = $scope.currentLanguage._id
        $scope.activeuser.speed = Number($scope.activeuser.speed)
        $scope.activeuser.run_ocr = $scope.activeuser.run_ocr
        promise = $kinvey.User.update($scope.activeuser)
        promise.then (activeUser) ->
            $rootScope.back()
    $scope.logout = ->
        promise = $kinvey.User.logout()
        $location.path("/login")
    return
    )

app.controller("HomeCtrl", ($scope, $kinvey, $location, $ionicLoading) ->
    $ionicLoading.show
        content: "Loading"
        animation: "fade-in"
        showBackdrop: true
        showDelay: 0
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
                $ionicLoading.hide()
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
    
    $scope.activeuser = $kinvey.getActiveUser()
    if($scope.activeuser)
        query = new $kinvey.Query()
        if($scope.activeuser.role == "user")
            query.equalTo('creator', $scope.activeuser._id)
        promise = $kinvey.DataStore.find("books", query)
        promise.then (books) ->
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
)

app.controller "NewBookCtrl", [
  "$scope"
  "$kinvey"
  "fileUpload"
  "$location"
  ($scope, $kinvey, $fileUpload, $location) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    
    $scope.activeuser = $kinvey.getActiveUser()
    if($scope.activeuser)
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
                    creator: $scope.activeuser._id
                    pages: []
                )
                page_promise.then (book) ->
                    $location.path("/edit/"+book._id)
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
  "$http"
  "$base64"
  "$ionicLoading"
  ($scope, $kinvey, $fileUpload, $location, $http, $base64, $ionicLoading) ->
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $scope.text = ""
    $scope.stage = 0

    OCRImage = (image) ->
        canvas = document.createElement("canvas")
        canvas_width = image.naturalWidth
        canvas_height = image.naturalHeight
        if image.naturalWidth > 1500
            canvas_width = 1500
            canvas_height = (canvas_width * image.naturalHeight)/image.naturalWidth
        canvas.width = canvas_width
        canvas.height = canvas_height
        ctx = canvas.getContext("2d")
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas_width, canvas_height)
        OCRAD ctx
      
    OCRPath = (url, callback) ->
        image = new Image()
        image.src = url
        image.onload = ->
            callback OCRImage(image)
            return
        return
      
    OCRFile = (file, callback) ->
        reader = new FileReader()
        reader.onload = ->
            OCRPath reader.result, callback
            return
        reader.readAsDataURL file
        return

    call = (text) ->
        $scope.text = text.replace(/\b[-.,()&$#!'\[\]{}_ /\n%"]+\B|\B[-.,()&$#!'\[\]{}_ /|%"]/g, "").trim()
        return text

    $scope.file_changed = (element, s) ->
        $scope.text=""
        # if ($scope.activeuser.run_ocr==true)
        #     text = OCRFile(element.files[0], call)
        $scope.myFile = element.files[0]
        selectedFile = element.files[0]
        reader = new FileReader()
        imgtag = document.getElementById("myimage")
        imgtag.title = selectedFile.name
        reader.onload = (event) ->
            imgtag.src = event.target.result
            return
        reader.readAsDataURL(selectedFile)
        return

    $scope.activeuser = $kinvey.getActiveUser()
    if($scope.activeuser)
        $scope.uploadPage = ->
            upload_promise = $kinvey.File.upload($scope.myFile,
                mimeType: "image/jpeg"
                size: $scope.myFile.size
                _public: true
            )
            upload_promise.then (file) ->
                streaming_promise = $kinvey.File.stream(file._id)
                streaming_promise.then (downloadObj) ->
                    console.log encodeURIComponent(downloadObj._downloadURL)
                    link = "http://54.164.208.20/api/ocr/"+encodeURIComponent(downloadObj._downloadURL)
                    $http.get(link).success((data, status, headers, config) ->
                        console.log data
                        $scope.text = data
                        $scope.stage = $scope.stage + 1
                    ).error (data, status, headers, config) ->

        $scope.uploadFile = ->
            $ionicLoading.show
                content: "Loading"
                animation: "fade-in"
                showBackdrop: true
                showDelay: 0
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
                    book.pages.push(new_page)
                    page_promise = $kinvey.DataStore.save("books", book)
                    page_promise.then (book) ->
                        $location.path("/edit/"+book_id)
                        $ionicLoading.hide()
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
  "$ionicPopover"
  "$ionicLoading"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup, $ionicPopover, $ionicLoading) ->
    $ionicLoading.show
        content: "Loading"
        animation: "fade-in"
        showBackdrop: true
        showDelay: 0
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $ionicSlideBoxDelegate.update()
    
    $scope.activeuser = $kinvey.getActiveUser()
    $scope.selectedIndex = -1
    book_id = $location.path().split("/")[2]

    query = $kinvey.DataStore.get("books", book_id)
    query.then (book) ->
        book.pages.unshift({text: 'Slide right to start reading "'+book.title+'"' })
        book.pages.push({text: "The End"})
        new_pages = []
        angular.forEach book.pages, (page) ->
            paragraphs = page.text.split("\n")
            new_paragraphs = []
            for paragraph in paragraphs
                paragraph = paragraph.split(" ")
                if paragraph.length > 1
                    new_paragraphs.push(paragraph)
            new_pages.push
                image: page.image
                text: page.text
                listed_text: new_paragraphs
        $scope.pages = new_pages
        promise = $kinvey.DataStore.find('languages')
        promise.then (languages) ->
            $scope.voice_code = languages[selectActiveLanguage(languages, $scope.activeuser.nativelang)].voice
            $ionicLoading.hide()
        $scope.translateWord = ($event, txt, $index) ->
            $scope.selectedIndex = $index
            txt = txt.trim().replace(/["\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"")
            link = "https://translation-app.herokuapp.com/api/en/"+$scope.activeuser.nativelang+"/"+txt
            $http.get(link).success((data, status, headers, config) ->
                $scope.translated_word = data
                $scope.selected_word = txt
                $scope.popover.show $event
                speech_english = speakText(txt, 'en-us', $scope.activeuser.speed)
                speech_native = speakText(data, $scope.voice_code, $scope.activeuser.speed)
                window.speechSynthesis.speak(speech_english)
                window.speechSynthesis.speak(speech_native)
                return
            ).error (data, status, headers, config) ->
                return
        $scope.clickMe = (clickEvent) ->
            text = $scope.pages[clickEvent].text
            speech = speakText(text, 'en-us', $scope.activeuser.speed)
            window.speechSynthesis.speak(speech)
        $scope.showPopup = (image) ->
            tempate_string = '<img src="' + image + '" width="100%">'
            alertPopup = $ionicPopup.alert(
                template: tempate_string
                buttons: [
                    {
                        text: "<strong>OK</strong>"
                        type: "button-balanced"
                    }
                ]
            )
    $ionicPopover.fromTemplateUrl("_partials/translation.html",
        scope: $scope
    ).then (popover) ->
        $scope.popover = popover
        return

    $scope.openPopover = ($event) ->
        $scope.popover.show $event
        return

    $scope.closePopover = ->
        $scope.selectedIndex = -1
        $scope.popover.hide()
        return

    $scope.$on "$destroy", ->
        $scope.selectedIndex = -1
        $scope.popover.remove()
        return

    $scope.$on "popover.hidden", ->
        $scope.selectedIndex = -1
        return

    $scope.$on "popover.removed", ->
        $scope.selectedIndex = -1
        return

    return
]

app.controller "EditPageCtrl", [
  "$scope"
  "$location"
  "$kinvey"
  "$ionicSlideBoxDelegate"
  "$sce"
  "$http"
  "$ionicPopup"
  "$ionicPopover"
  "$ionicLoading"
  "$route"
  ($scope, $location, $kinvey, $ionicSlideBoxDelegate, $sce, $http, $ionicPopup, $ionicPopover, $ionicLoading, $route) ->
    $ionicLoading.show
        content: "Loading"
        animation: "fade-in"
        showBackdrop: true
        showDelay: 0
    $scope.templates = [{ name: 'navbar.html', url: '_partials/navbar.html'}]
    $scope.back_button = true
    $ionicSlideBoxDelegate.update()
    
    $scope.activeuser = $kinvey.getActiveUser()
    $scope.selectedIndex = -1
    book_id = $location.path().split("/")[2]
    page_num = $location.path().split("/")[3]

    query = $kinvey.DataStore.get("books", book_id)
    query.then (book) ->
        $scope.book = book
        $scope.page = book.pages[page_num]
        $scope.text = $scope.page.text
        $scope.page_num = Number(page_num)+1
        $ionicLoading.hide()
        $scope.showPopup = (image) ->
            tempate_string = '<img src="' + image + '" width="100%">'
            alertPopup = $ionicPopup.alert(
                template: tempate_string
                buttons: [
                    {
                        text: "<strong>OK</strong>"
                        type: "button-balanced"
                    }
                ]
            )
        $scope.savePage = ->
            page_image = $scope.myFile
            if page_image
                delete_page_image_promise = $kinvey.File.destroy(book.pages[page_num].image._id)
                upload_promise = $kinvey.File.upload(page_image,
                    mimeType: "image/jpeg"
                    size: page_image.size
                )
                upload_promise.then (file) ->
                    book.pages[page_num].image = 
                        _id: file._id
                        _type: "KinveyFile"
                    book.pages[page_num].text = $scope.text
                    updated_page_promise = $kinvey.DataStore.save('books', book)
                    updated_page_promise.then (page) ->
                        $route.reload()
            else
                book.pages[page_num].text = $scope.text
                updated_page_promise = $kinvey.DataStore.save('books', book)
                updated_page_promise.then (page) ->
                    $route.reload()
        $scope.deletePage = ->
            delete_page_image_promise = $kinvey.File.destroy(book.pages[page_num].image._id)
            book.pages.splice(page_num, 1)
            delete_page_promise = $kinvey.DataStore.save('books', book)
            delete_page_promise.then (book) ->
                $location.path("/edit/"+book_id)
    ]

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
    $scope.activeuser = $kinvey.getActiveUser()
    $ionicSlideBoxDelegate.update()
    
    book_id = $location.path().split("/")[2]
    query = $kinvey.DataStore.get("books", book_id)
    query.then (book) ->
        $scope.book = book
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
]

# App directives
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

# App services
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

# Helper functions
speakText = (word, voice_code, speed) ->
    utterance = new SpeechSynthesisUtterance()
    utterance.text = word
    utterance.lang = voice_code
    utterance.rate = speed
    return utterance


selectActiveLanguage = (languages, nativelang) ->
    i = 0
    while (i < languages.length)
        if languages[i]._id==nativelang
            break
        i++
    return i


app.run ($ionicPlatform, $rootScope, $location) ->
    $ionicPlatform.ready ->

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