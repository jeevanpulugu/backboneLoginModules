var modArray = ['loginmodels/loginmodel', 'settingmodels/userpreferencesmodel', 'text!logintemplates/logintemplate.html!strip'];

define(modArray, function (loginModel, userpreferencesModel, data) {
    var html = $(data), _this;
    var loginView = function () {
        _this = this;
    };

    loginView.prototype = {
        loginViewWrapper: Backbone.View.extend({
            el: '#loginPage', //defined in the master page, which holds the logintemplate.html
            template: _.template(html.siblings('#loginViewHtml').text()),
            securityquestionstemplate: _.template(html.siblings('#securityquestionsDD').text()),
            selectuserstemplate: _.template(html.siblings('#userslistradiobuttons').text()),
            securityquestionandanswertemplate: _.template(html.siblings('#securityquestionandanswer').text()),
            events: {
                "click #btnSubmit": "onSubmitClick",
                "click #btnLogin": "onChangePasswordClick",
                "click #emailSuccessMessageWrap #OkButton": "closeSuccessPopup",
                "click #wrongAnswerMessageWrap #OkButton": "closeWrongAnswerPopup",
                "click #ContactAdminMessageWrap #contactAdminMessageButton": "closeContactAdminPopup",
                "click #sendForgotUserNameAndBothWrap #forgotUserNameAndBothSendButton": "checkUserNames",
                "click #forgotDetails": "onForgotUserNameAndBothSectionClick",
                "blur input": "onInputBlur",
                "change #selLanguage": "changeLanguage",
                "click #changePasswordPopup #forgot_pswd_close": "removeFormErrorClass",
                "click #sendmailButton": "securityAnswerValidation",
                "click #forgotDetailsCancel": "closeForgotDetails",
                "click #cancelUserSelection": "closeUserSelection",
                "click #cancelValidateQuestion": "closeUserSelection"
            },

            initialize: function () {
                this.count = 0;
                //Show the logintemplate.html
            },
            showLoginPage: function () {
                this.render();
                //If rememberme is checked in the previous session, then display the user credentials by getting from the local storage
                this.PrefillUserCredentialsIfPossible();
                //This is used to display the error message on login failed
                $("#loginWrap").height('253px');
                var self = this;
                $("#loginPage").keypress(function (e) {
                    self.validateEnterButton(e);
                });
            },

            validateEnterButton: function (event) {
                var keycode = (event.keyCode || event.which || event.charCode);
                if (keycode == 13) {
                    if (($("#forgotUserNameAndBothPopup-popup").hasClass("ui-popup-active"))) {
                        this.checkUserNames();
                    } else if ($("#selectUserPopup-popup").hasClass("ui-popup-active")) {
                        if ($.trim($('#securityqandaDiv').html()).length && $('#securityqandaDiv').is(":visible")) {
                            $("#sendmailButton").trigger("click");
                        } else {
                            $("#userSelected").trigger("click");
                        }
                    } else if ($("#changePasswordPopup-popup").hasClass("ui-popup-active")) {
                        this.onChangePasswordClick();
                    } else if (!($("#changePasswordPopup-popup").hasClass("ui-popup-active"))) {
                        this.reallySubmit();
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return false;
                }
                return true;
            },

            PrefillUserCredentialsIfPossible: function () {

                $.cookie.json = true;
                // $.cookie('languageselection', { 'language': 'en-US' }, { expires: 365 });
                var remember = window.localStorage.getItem('remember');
                //If rememberme is checked in the previous session then prefill the last user credentials
                var userCookie = $.cookie('userdetails');
                var languageCookie = $.cookie('languageselection');
                var lanGuage;

                if (remember == 'true' && userCookie && languageCookie) {

                    var userName = userCookie.username == undefined ? '' : userCookie.username;
                    var passWord = userCookie.password == undefined ? '' : userCookie.password;
                    if (languageCookie.language) {
                        lanGuage = languageCookie.language;
                    } else {
                        lanGuage = 'en-US';
                    }
                    if (userName != '' && passWord != '') {
                        //populate the fieldsn
                        $('#txtUserName').val(userName.replace(/\"/g, ""));
                        $('#txtPassword').val(passWord.replace(/\"/g, ""));

                        $("#selLanguage").val(lanGuage);
                        $('#selLanguage').selectmenu('refresh', true);
                    }
                    $("#chkRememberMe").attr('checked', true).checkboxradio('refresh');

                } else {
                    var language;
                    if (languageCookie && languageCookie.language) {
                        language = languageCookie.language;
                    } else {
                        language = 'en-US';
                    }

                    $("#selLanguage").val(language);
                    $('#selLanguage').selectmenu('refresh', true);
                }
            },
            getSecurityQuestionList: function () {
                var that = this;
                var securityQuestions = new loginModel['GetSecurityQuestions']();
                securityQuestions.fetch({
                    success: function (model, response) {
                        var securityQuestionsModel = {};
                        securityQuestionsModel['questionlist'] = response;
                        $(that.$el).find("#securityQuestionDiv").html(that.securityquestionstemplate(securityQuestionsModel));
                        $("#securityquestiondropdowndiv").trigger('create');
                    }
                });
                // $(that.$el).trigger('create');

            },
            changeLanguage: function () {
                var selectedLanguage = $("#selLanguage").val();
                //Setting the cookie with the selected language from preferences
                $.cookie('languageselection', { 'language': selectedLanguage }, { expires: 365 });
                window.location.reload();

                $.cookie.json = true;
                var selLanguage = $.cookie('languageselection');
                var lanGuage = selLanguage.language;
                $("#selLanguage").val(lanGuage);
                $('#selLanguage').selectmenu('refresh', true);
            },

            //display the login page
            render: function () {
                this.$el.html(this.template);
                this.$el.trigger('create');
                $.mobile.changePage("#loginPage");
                $('#txtUserName').focus();
                $("#invalidCredentials").hide();
                if ($.browser.msie) {
                    var userNamePlaceHolder = translateText('gen-username-label');
                    $("#txtUserName").val(userNamePlaceHolder);
                    $("#txtUserName").focus(function () {
                        if ($("#txtUserName").val() === userNamePlaceHolder) {
                            $("#txtUserName").val(userNamePlaceHolder);
                            $("#txtUserName").css('color', '#78787C');
                        }
                        $("#txtUserName").on("click", function () {
                            $("#txtUserName").css('color', '#000000');
                            if ($("#txtUserName").val() === userNamePlaceHolder) {
                                $("#txtUserName").val('');
                            }
                        });
                    });
                }
            },

            onChangePasswordClick: function () {
                var that = this;
                $("#changePasswordForm").validationEngine('attach');
                if ($("#changePasswordForm").validationEngine('validate')) {
                    var userObj = {};
                    var newPassword = $("#txtnewPassword").val();
                    if ($("#securityquestiondropdown").val() != undefined) {
                        var securityQuestionId = $("#securityquestiondropdown").val();
                        var securityAnswer = $("#securityanswerText").val();
                        var securityObj = {};
                        securityObj["SecurityQuestionId"] = securityQuestionId;
                        securityObj["HintAnswer"] = securityAnswer;
                        userObj["UserHintAnswer"] = securityObj;
                    }

                    userObj["UserName"] = m_userData.UserName;
                    userObj["Password"] = newPassword;

                    userObj["UserId"] = m_userData.UserId;

                    m_userData.Password = newPassword;

                    var logModel = new loginModel['UpdatePassword']();

                    var changePasswordRequest = logModel.save(userObj, {
                        success: function () {
                            window.sessionStorage.setItem("SecurityToken", changePasswordRequest.getResponseHeader("SecurityToken"));
                            that.onLoginComplete(m_userData);
                        }
                    });
                }
            },

            onSubmitClick: function (e) {

                this.reallySubmit();

                e.preventDefault();
                e.stopImmediatePropagation();
            },

            reallySubmit: function () {
                var that = this;
                $("#LoginForm").validationEngine('attach');
                if ($("#LoginForm").validationEngine('validate')) {

                    var username = $("#txtUserName").val();
                    var password = $("#txtPassword").val();

                    if ((username.trim() != '') && (password.trim() != '')) {

                        var logModel = new loginModel['validateUser']();

                        var userObj = {};
                        userObj["UserName"] = username;
                        userObj["Password"] = password;

                        var loginRequest = logModel.save(userObj, {
                            success: function (model, response) {
                                $("#maskTileview").remove();
                                window.sessionStorage.setItem("SecurityToken", loginRequest.getResponseHeader("SecurityToken"));
                                if (response == null) {
                                    $("#invalidCredentials").show();
                                } else {
                                    window.sessionStorage.setItem("UserID", response.UserId);
                                    window.sessionStorage.setItem("InstallID", response.InstallId);
                                    if ((response.IsTempPassword != null && response.IsTempPassword) || (response.IsFirstTimeLogin === true)) {
                                        // ReSharper disable AssignToImplicitGlobalInFunctionScope
                                        m_userData = response;
                                        // ReSharper restore AssignToImplicitGlobalInFunctionScope
                                        that.LaunchUpdatePasswordPopUp(response.IsFirstTimeLogin);
                                    } else {
                                        that.onLoginComplete(response);
                                    }
                                }
                            },
                            error: function () {
                                $("#invalidCredentials").show();
                            }
                        });
                    } else {
                        $("#invalidCredentials").show();
                    }
                }


            },
            removeFormErrorClass: function () {
                $("#txtconfirmPassword").val("");
                $("#changePasswordForm").validationEngine('detach');
                $("#txtnewPassword").unbind();
            },

            //save the login, launch the pivotspage
            onLoginComplete: function (result) {
                if (result != null && result.UserId != null) {
                    //save the user credentials                    
                    this.SaveUserLoginInfo(result);
                    window.sessionStorage.setItem("Roleofadmin", result.UserRole.RoleName.toUpperCase());
                    //enabling and disabling top right setting links 
                    call_Rolecheck();
                    //This will enable/disable the form admin link 

                    //this is to empty the tile view div
                    $("#pivot_main_div_1").empty();
                    $("#pivot_main_div_0").empty();

                } else {
                    $("#invalidCredentials").show();
                }
            },

            closeForgotDetails: function () {
                $('#forgotUserNameAndBothForm').find("input:radio:checked").prop('checked', false).checkboxradio("refresh");
                $("#forgotUserName").attr("checked", true).checkboxradio("refresh");
                $("#forgotUserNameAndBothPopup").popup("close");
            },

            closeUserSelection: function () {
                $('#forgotUserNameAndBothForm').find("input:radio:checked").prop('checked', false).checkboxradio("refresh");
                $("#forgotUserName").attr("checked", true).checkboxradio("refresh");
                $("#selectUserPopup").popup("close");
            },

            SaveUserLoginInfo: function (objUserAndRole) {
                var self = this;
                window.sessionStorage.setItem("UserID", objUserAndRole.UserId);
                window.sessionStorage.setItem("UserName", objUserAndRole.UserName);
                window.sessionStorage.setItem("RoleName", objUserAndRole.UserRole.RoleName);
                window.sessionStorage.setItem("AllFarmAccess", objUserAndRole.AllFarmAccess);
                var userPreferencesdata = new userpreferencesModel['getUserPreferences']({ id: objUserAndRole.UserId });
                userPreferencesdata.fetch({
                    cache: false,
                    success: function (userprefModel) {
                        if (userprefModel === null) {
                            window.sessionStorage.setItem("Language", 'en-US');
                            window.sessionStorage.setItem("FarmId", '00000000-0000-0000-0000-000000000000');
                            window.sessionStorage.setItem("FarmGroupId", '00000000-0000-0000-0000-000000000000');
                            window.sessionStorage.setItem("View", '0');
                            window.sessionStorage.setItem("ViewType", '0');
                            window.sessionStorage.setItem("DisplayPage", "LiveMapView");
                            window.sessionStorage.setItem("SortMode", '0');
                            window.sessionStorage.setItem("ShowWeatherLink", '1');
                            window.sessionStorage.setItem("WeatherName", 'Weather');
                            window.sessionStorage.setItem("WeatherURL", 'http://www.dtnprogressivefarmer.com/dtnag/weather');
                            window.sessionStorage.setItem("farmRoleName", " ");

                            window.UserID = objUserAndRole.UserId;
                        } else {
                            window.sessionStorage.setItem("UserPreferences", JSON.stringify(userprefModel));
                            var farmName = userprefModel.get('FarmName');
                            if (farmName === null) {
                                window.sessionStorage.setItem("farmRoleId", ' ');
                                window.sessionStorage.setItem("groupRoleId", ' ');
                            } else {
                                window.sessionStorage.setItem("farmRoleId", userprefModel.get('FarmId'));
                                if (userprefModel.get('FarmGroupId') && userprefModel.get('FarmGroupId') !== '00000000-0000-0000-0000-000000000000') {
                                    var groupSelected = userprefModel.get('FarmGroupId');
                                    if (groupSelected) {
                                        var farmGroups = {
                                            "FarmId": userprefModel.get('FarmId'),
                                            "FarmGroups": [{ FarmGroupId: userprefModel.get('FarmGroupId') }]
                                        };
                                        window.sessionStorage.setItem("groupRoleId", JSON.stringify([farmGroups]));
                                    }
                                } else {
                                    window.sessionStorage.setItem("groupRoleId", ' ');
                                }
                            }


                            window.sessionStorage.setItem("farmRoleName", farmName);


                            if (userprefModel.get('View')) {
                                window.sessionStorage.setItem("DisplayPage", "TileView");
                            } else {
                                if (userprefModel.get('MapType') === 'MyMap') {
                                    window.sessionStorage.setItem("DisplayPage", "MapView");
                                } else {
                                    window.sessionStorage.setItem("DisplayPage", "LiveMapView");
                                }
                                
                            }
                            if (userprefModel.get('ViewType')) {
                                $("#viewChoice2").attr('checked', true).checkboxradio('refresh');
                                window.sessionStorage.setItem("layer", "soilView");
                            } else {
                                $("#viewChoice1").attr('checked', true).checkboxradio('refresh');
                                window.sessionStorage.setItem("layer", "genericView");
                            }
                            window.UserID = objUserAndRole.UserId;

                            $.cookie.json = true;
                            var lanGuage;
                            if ($.cookie('languageselection') && $.cookie('languageselection').language) {
                                lanGuage = $.cookie('languageselection').language;
                            } else {
                                lanGuage = 'en-US';
                            }

                            if (lanGuage && lanGuage != 'en-US' && userprefModel.get('Language')['LanguageValue'] === 'en-US') {
                                var updateuserPreferencesdata = new userpreferencesModel['updateUserPreferences']({ id: window.sessionStorage.getItem("UserID") });
                                var languageObj = {};
                                languageObj['LanguageValue'] = lanGuage;
                                userprefModel.set('Language', languageObj);
                                $.cookie('languageselection', { 'language': lanGuage }, { expires: 365 });
                                selectCulturefiles(lanGuage);
                                updateuserPreferencesdata.save(userprefModel);

                            } else {
                                $.cookie('languageselection', { 'language': userprefModel.get('Language')['LanguageValue'] }, { expires: 365 });
                                selectCulturefiles(userprefModel.get('Language')['LanguageValue']);
                            }
                        }
                        var userPreferences = JSON.parse(window.sessionStorage.getItem("UserPreferences"));
                        if (userPreferences.Whether.ShowWeatherLink) {
                            $('#wlink').text(userPreferences.Whether.WeatherName);
                            $('#wlink').attr("href", userPreferences.Whether.URL);
                            $("#wlink").attr("target", "_blank");
                        }
                        self.$el.unbind();
                        showPivotsPage(objUserAndRole.UserName);

                    }
                });

                var isPersistent = $('#chkRememberMe').is(':checked');

                if (isPersistent) {
                    var uName = $('#txtUserName').val();
                    var pWord = $('#txtPassword').val();
                    //var lAnguage = $('#selLanguage').val();
                    //save user info in local storage

                    $.cookie('userdetails', { 'username': uName, 'password': pWord }, { expires: 365 });
                    //$.cookie('languageselection', { 'language': lAnguage }, { expires: 365 });
                    //selectCulturefiles(lAnguage);

                    window.localStorage.setItem('remember', true);

                } else {

                    //reset user info local storage
                    $.removeCookie('userdetails');
                    //$.cookie('languageselection', { 'language': 'en-US' }, { expires: 365 });
                    window.localStorage.setItem('remember', false);
                }
                // ReSharper disable AssignToImplicitGlobalInFunctionScope
                roleisUpdate = true;
                // ReSharper restore AssignToImplicitGlobalInFunctionScope


            },

            onInputBlur: function () {
                $(this).validationEngine('hide');
                $('#LoginForm').validationEngine('detach');
                $("#forgotUserNameAndBothForm").validationEngine('detach');
                $("#forgotPasswordForm").validationEngine('detach');
            },

            onForgotUserNameAndBothSectionClick: function (e) {
                this.LaunchForgotUserNameAndBothPopUp(e.target.id);
                e.preventDefault();
                e.stopImmediatePropagation();
            },

            LaunchContactAdministratorPopUp: function () {
                $("#LoginForm").validationEngine('hideAll');
                $("#contactAdminMessagePopup").popup();
                $("#contactAdminMessagePopup").popup("open");

            },

            LaunchUpdatePasswordPopUp: function (IsFirstTimeLogin) {

                $("#LoginForm").validationEngine('hideAll');
                $("#changePasswordPopup").popup();
                $("#changePasswordPopup").popup("open");
                if (IsFirstTimeLogin) {
                    this.getSecurityQuestionList();
                }
                $('#txtnewPassword').val('');
                $("#changePasswordPopup input[name='txtnewPassword']").focus();
            },

            LaunchForgotUserNameAndBothPopUp: function (controlId) {
                $("#LoginForm").validationEngine('hideAll');
                $("#forgotUserNameAndBothPopup").popup();
                $("#forgotUserNameAndBothPopup").popup("open");
                // $("#forgotUserNameAndBothPopup-popup").css({ "left": "270px" });
                $('#emailText').val('');
                $('#emailText').focus();
                $('.forgotTypeRadio').attr("checked", false).checkboxradio("refresh");
                $('#forgotUserName').attr("checked", true).checkboxradio("refresh");
                $('#hiddenInputFieldToDifferentiateForgot').val(controlId);
                $('#noOfAttemptsOnforgotUserNameAndBothPopup').val('0');
            },

            checkUserNames: function () {
                $("#forgotUserNameAndBothForm").validationEngine('attach');
                if ($("#forgotUserNameAndBothForm").validationEngine('validate')) {
                    $.mobile.loading('show');
                    var that = this;

                    var mailId = $("#emailText").val();

                    var listofUsers = new loginModel['GetUsersSecurityQuestion']({ id: mailId });
                    listofUsers.fetch({
                        cache: false,
                        success: function (model, response) {
                            var listofUsersModel = {};
                            var userDetails = {};
                            if (response.length > 0) {
                                listofUsersModel['userslist'] = response;
                                if (response.length > 1) {
                                    $("#forgotUserNameAndBothPopup").popup("close");
                                    $("#selectUserPopup").popup();
                                    $("#selectUserPopup").popup("open");
                                    $("#userDetails").show();
                                    $("#securityInformation").hide();
                                    $("#selectUserForm").validationEngine('attach');
                                    $('#hiddenInputFieldToDifferentiateForgot').val($('input[name=forgotDetails]:checked').val());
                                    $(that.$el).find("#userslistDiv").html(that.selectuserstemplate(listofUsersModel));
                                    $.mobile.loading('hide');
                                    $("#userSelected").on("click", { viewObj: that, userdetails: mailId }, that.displaySecurityQestion);
                                    $("#sendmailButton").on("click", { viewObj: that, userdetails: mailId }, that.securityAnswerValidation);
                                    $(that.$el).trigger('create');
                                    $('#userslistDiv').mCustomScrollbar('destroy');
                                    $('#userslistDiv').mCustomScrollbar({
                                        scrollButtons: {
                                            enable: true
                                        },
                                        advanced: {
                                            updateOnContentResize: true,
                                            autoScrollOnFocus: false
                                        }
                                    });

                                } else {
                                    _.each(response, function (object) {
                                        if (object.SecurityQuestions) {
                                            userDetails['UserId'] = object.UserId;
                                            userDetails['UserMail'] = mailId;
                                            $('#hiddenInputFieldToDifferentiateForgot').val($('input[name=forgotDetails]:checked').val());
                                            that.sendmailonforgotpasswordandboth(userDetails);
                                        } else {
                                            $.mobile.loading('hide');
                                            $("#forgotUserNameAndBothPopup").popup("close");
                                            that.LaunchContactAdministratorPopUp();
                                        }
                                    });
                                }
                            } else {
                                $.mobile.loading('hide');
                                $("#forgotUserNameAndBothPopup").popup("close");
                                that.LaunchContactAdministratorPopUp();
                            }
                        }
                    });


                }


            },
            displaySecurityQestion: function (e) {
                if ($("#selectUserForm").validationEngine('validate')) {
                    if ($('input[name=usernames]:checked', '#selectUserForm').val()) {
                        var el = e.data.viewObj;
                        $("#userDetails").hide();
                        $("#securityInformation").show();
                        var securityQuestionObj = {};
                        securityQuestionObj.questionName = $('input[name=usernames]:checked', '#selectUserForm').val();
                        securityQuestionObj.questionId = $('input[name=usernames]:checked', '#selectUserForm').data('securityquestionid');
                        securityQuestionObj.userId = $('input[name=usernames]:checked', '#selectUserForm').attr('id');
                        $("#securityqandaDiv").html(el.securityquestionandanswertemplate(securityQuestionObj));
                    } else {
                        $.mobile.loading('hide');
                        $("#selectUserPopup").popup("close");
                        e.data.viewObj.LaunchContactAdministratorPopUp();
                    }
                }
            },
            securityAnswerValidation: function (e) {
                if ($("#selectUserForm").validationEngine('validate')) {
                    var self = e.data.viewObj,
                        mailid = e.data.userdetails, buttnsObj;

                    var message = translateText("login-page-wrong-answer-status-msg") + translateText("login-page-wrong-answer-status-msg-instructions");
                    var answer = $('#answerText').val();
                    var userid = $('#answerText').data('userid');
                    var answerObj = {};
                    answerObj['HintAnswer'] = answer;
                    answerObj['UserId'] = userid;
                    answerObj['UserMail'] = mailid;
                    var validateUser = new loginModel['ValidateUserSecurityAnswer']();
                    $.mobile.loading('show');
                    $('#sendmailButton').addClass('ui-disabled');
                    validateUser.save(answerObj, {
                        cache: false,

                        success: function (model, response) {
                            $('#sendmailButton').removeClass('ui-disabled');
                            if (response === true) {
                                $.mobile.loading('hide');
                                self.sendmailonforgotpasswordandboth(answerObj);
                            } else if (self.count <= 2) {
                                self.count++;
                                buttnsObj = {
                                    'Close': {
                                        click: function (ex) {
                                            ex.preventDefault();
                                            $(document).trigger('simpledialog', { 'method': 'close' });
                                            return false;
                                        }
                                    }
                                };
                                $("#answerText").blur();
                                bsConfirmbox(message, buttnsObj);
                                $.mobile.loading('hide');

                            } else {
                                self.count = 0;
                                $.mobile.loading('hide');
                                //Close the forgot popup
                                $("#selectUserPopup").popup("close");

                                //Launch the Contact Administrator popup, since consequently 3 attempts are failed
                                self.launchWrongAnswerPopup();
                            }


                        }
                    });
                }
                e.stopImmediatePropagation();
            },
            sendmailonforgotpasswordandboth: function (userdetails) {
                var that = this;
                var userObj = {};
                userObj['Email'] = userdetails.UserMail;
                userObj['UserId'] = userdetails.UserId;

                var logModel;
                if ($('#hiddenInputFieldToDifferentiateForgot').val() === 'frgBoth' || $('#hiddenInputFieldToDifferentiateForgot').val() === 'frgPswd') {
                    logModel = new loginModel['SendMailOnForgotBothUserNameAndPassword']();
                } else {
                    logModel = new loginModel['SendMailOnForgotUserName']();
                }

                logModel.save(userObj, {
                    cache: false,
                    success: function () {
                        $.mobile.loading('hide');
                        $("#selectUserPopup").popup("close");
                        $("#forgotUserNameAndBothPopup").popup("close");
                        that.launchSuccessfullyMailedPopup();
                        $('#sendmailButton').removeClass('ui-disabled');
                    },
                    error: function () {
                        $.mobile.loading('hide');

                        var count = $('#noOfAttemptsOnforgotUserNameAndBothPopup').val();

                        if (count == "2") {

                            //Close the forgot popup
                            $("#selectUserPopup").popup("close");

                            //Launch the Contact Administrator popup, since consequently 3 attempts are failed
                            that.LaunchContactAdministratorPopUp();

                        } else {

                            var intCount = parseInt(count, 10);
                            $("#noOfAttemptsOnforgotUserNameAndBothPopup").val(++intCount);
                            that.displayInformationOnBoth(translateText("login-page-ivalid-email-msg"));

                        }
                    }
                });

            },
            launchSuccessfullyMailedPopup: function () {
                $("#emailSuccessMessagePopup").popup();
                $("#emailSuccessMessagePopup").popup("open");
            },
            launchWrongAnswerPopup: function () {
                $("#wrongAnswerMessagePopup").popup();
                $("#wrongAnswerMessagePopup").popup("open");
            },

            closeSuccessPopup: function (e) {
                $("#emailSuccessMessagePopup").popup("close");
                e.preventDefault();
                e.stopImmediatePropagation();
            },
            closeWrongAnswerPopup: function (e) {
                $("#wrongAnswerMessagePopup").popup("close");
                $('#answerText').val('');
                e.preventDefault();
                e.stopImmediatePropagation();
            },
            closeContactAdminPopup: function (e) {
                $("#contactAdminMessagePopup").popup("close");
                e.preventDefault();
                e.stopImmediatePropagation();
            },

            getCustomUrlEncoding: function (urlVariable) {
                return urlVariable.replace(/\#/g, '^').replace(/\*/g, ')').replace(/\:/g, '|');
            },


            //this will display the Invalid email errors.
            displayInformationOnBoth: function (text) {

                if (text.trim() != '') {
                    $("#forgotUserNameAndBothPopup #displayInformationOnForgotBoth").html(text);
                    $("#emailText").focus();
                    $("#forgotUserNameAndBothPopup #displayInformationOnForgotBoth").addClass("displayInformationOnForgotBoth");
                    $("#sendForgotUserNameAndBothWrap").height('255px');
                    setTimeout(function () {
                        $('#displayInformationOnForgotBoth').text('');
                        $("#sendForgotUserNameAndBothWrap #displayInformationOnForgotBoth").removeClass("displayInformationOnForgotBoth");
                        $("#sendForgotUserNameAndBothWrap").height('231px');
                    }, 10000);
                } else {
                    $("#sendForgotUserNameAndBothWrap #displayInformationOnForgotBoth").removeClass("displayInformationOnForgotBoth");
                    $("#sendForgotUserNameAndBothWrap").height('231px');
                }
            },

            //this will display the Invalid username errors.
            displayInformationOnForgotPassword: function (text) {
                if (text.trim() != '') {
                    $("#forgotPasswordPopup #displayInformationOnForgotPassword").html(text);
                    $("#emailText").focus();
                    $("#forgotPasswordPopup #displayInformationOnForgotPassword").addClass("displayInformationOnForgotBoth");
                    $("#sendForgotPasswordWrap").height('255px');
                    setTimeout(function () {
                        $('#displayInformationOnForgotPassword').text('');
                        $("#forgotPasswordPopup #displayInformationOnForgotPassword").removeClass("displayInformationOnForgotBoth");
                        $("#sendForgotPasswordWrap").height('231px');
                    }, 10000);
                } else {
                    $("#forgotPasswordPopup #displayInformationOnForgotPassword").removeClass("displayInformationOnForgotBoth");
                    $("#sendForgotPasswordWrap").height('231px');
                }
            }
        })
    };
    return new loginView();
});