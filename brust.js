if (Meteor.isClient) {
  Template.organization.organizationTitle = function() {
    return "What's your organization ?";
  };
  Template.organization.organizationLabel = function () {
    return "Organization: ";
  };

  Template.organization.repositories = function() {
    return Session.get("repositories") || [];
  }

  Template.organization.milestones = function() {
    return Session.get("milestones") || [];
  }

  Template.organization.rendered = function() {
    var milestones = Session.get("milestones");
    for (var milestone_idx in milestones) {
      burnDownChart(milestones[milestone_idx]);
    }

    function burnDownChart(milestone) {

      var milestoneDueIn = Math.round((new Date(milestone.due_on) - new Date(milestone.created_at))/1000/60/60/24);
          maxWorkLeft = d3.max(milestone.work_left_vs_time),
          data = milestone.work_left_vs_time;

      var margin = {top: 20, right: 20, bottom: 20, left: 80},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var x = d3.scale.linear()
          .domain([0, milestoneDueIn])
          .range([0, width]);

      var y = d3.scale.linear()
          .domain([0, maxWorkLeft+1])
          .range([height, 0]);

      var line = d3.svg.line()
          .x(function(d, i) { return x(i); })
          .y(function(d, i) { return y(d); });

      var svg = d3.select("#workLeftVSTime-"+milestone.number)
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("defs").append("clipPath")
         .attr("id", "clip")
         .append("rect")
         .attr("width", width)
         .attr("height", height);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + y(0) + ")")
          .call(d3.svg.axis().scale(x)
                             .orient("bottom")
                             .tickFormat(function(d, i) {
                                return d > 0 ? d + (d > 1 ? ' days' : ' day') : null;
                              }));

      svg.append("g")
          .attr("class", "y axis")
          .call(d3.svg.axis().scale(y)
                             .orient("left")
                             .tickFormat(function(d, i) {
                                return d > 0 ? d + (d > 1 ? ' issues' : ' issue') : null;
                              }));

      var burnDown = svg.append("g")
                        .attr("clip-path", "url(#clip)")
                        .append("path")
                        .datum(data)
                        .attr("class", "line")
                        .attr("d", line);

      var idealBurnDown = svg.append("g")
                             .attr("clip-path", "url(#clip)")
                             .append("path")
                             .datum(d3.range(maxWorkLeft, -1, -(maxWorkLeft/milestoneDueIn)))
                             .attr("class", "line")
                             .attr("d", line)
                             .style("stroke", 'red');
    }
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
