if (Meteor.isClient) {
  Template.organization.organizationTitle = function() {
    return "What's your organization ?";
  };
  Template.organization.organizationLabel = function () {
    return "Organização: ";
  };

  Template.organization.repositories = function() {
    return Session.get("repositories") || [];
  }

  Template.organization.milestones = function() {
    return Session.get("milestones") || [];
  }

  Template.organization.events = {
    'click #fetchButton' : function () {
      $('#fetchButton').attr('disabled','true').val('Loading...');
      var organization = $('#organization').val();
      Meteor.call('fetchRepositories', organization, function(err, repositories) {
        if(err) {
          window.alert("Error: " + err.reason);
          console.log("error occured on receiving data on server. ", err );
        } else {
          Session.set("repositories", repositories);
        }
        $('#fetchButton').removeAttr('disabled').val('Fetch');
      });
    },
    'change #repositories' : function () {
      var organization = $('#organization').val();
      var repository = $('#repositories option:selected').val();
      Meteor.call('fetchMilestones', organization, repository, function(err, milestones) {
        if(err) {
          window.alert("Error: " + err.reason);
          console.log("error occured on receiving data on server. ", err );
        } else {
          Session.set("milestones", milestones);
        }
        $('#fetchButton').removeAttr('disabled').val('Fetch');
      });
    }
  };

  document.title = Template.organization.organizationTitle();
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.methods({
    fetchRepositories: function(organization) {
      var url = "http://scorch-staging.herokuapp.com/organizations/"+organization+"/repositories";
      var result = Meteor.http.get(url, {timeout:30000});
      console.log(result)
      if(result.statusCode==200) {
        var respJson = JSON.parse(result.content);
        return respJson['repositories'];
      } else {
        console.log("Response issue: ", result.statusCode);
        var errorJson = JSON.parse(result.content);
        throw new Meteor.Error(result.statusCode, errorJson.error);
      }
    },
    fetchMilestones: function(organization, repository) {
      var url = "http://scorch-staging.herokuapp.com/repositories/"+repository+"/workleft-vs-time?organization="+organization;
      var result = Meteor.http.get(url, {timeout:30000});
      console.log(result)
      if(result.statusCode==200) {
        var respJson = JSON.parse(result.content);
        return respJson['milestones'];
      } else {
        console.log("Response issue: ", result.statusCode);
        var errorJson = JSON.parse(result.content);
        throw new Meteor.Error(result.statusCode, errorJson.error);
      }
    }
  });
}
