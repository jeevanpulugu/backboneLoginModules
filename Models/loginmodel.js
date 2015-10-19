var modArray = ['commonmodels/serviceurl'];
define(modArray, function(servicecollection) {
    var servicecollectionobj = new servicecollection['urlmodelvalue'](), globalThis,
        userManagementService = servicecollectionobj.get("UserManagementService"),
        LoginModel = function() {
            globalThis = this;
        };

    LoginModel.prototype = {
        validateUser: Backbone.Model.extend({
            urlRoot: userManagementService.ValidateUser
        }),
        SendMailOnForgotPassword: Backbone.Model.extend({
            urlRoot: userManagementService.SendMailOnForgotPassword
        }),
        SendMailOnForgotUserName: Backbone.Model.extend({
            urlRoot: userManagementService.SendMailOnForgotUserName
        }),
        SendMailOnForgotBothUserNameAndPassword: Backbone.Model.extend({
            urlRoot: userManagementService.SendMailOnForgotBothUserNameAndPassword
        }),
        UpdatePassword: Backbone.Model.extend({
            urlRoot: userManagementService.UpdatePassword
        }),
        GetSecurityQuestions: Backbone.Model.extend({
            urlRoot: userManagementService.GetSecurityQuestions
        }),
        GetUsersSecurityQuestion: Backbone.Model.extend({
            urlRoot: userManagementService.GetUsersSecurityQuestion
        }),
        ValidateUserSecurityAnswer: Backbone.Model.extend({
            urlRoot: userManagementService.ValidateUserSecurityAnswer
        })
    };

    return new LoginModel();
});