(function () {
    var app = angular.module("scheduled_report_webservices", ["api-param"]);
    app.factory("ScheduledReportWebService", ScheduledReportWebService);
    function ScheduledReportWebService($rootScope, $window, $http, ApiParam) {
        var dateRange ={};
        ScheduledReportWebService.getDataTableInfo = function () {
            return $http.get(ApiParam.baseURL() + "/v1/report/schedule/list/"+$rootScope.currentOUId,ApiParam.headerConfig());
        };

        ScheduledReportWebService.getScheduleReport = function (schedule_id) {
            return $http.get(ApiParam.baseURL() + "/v1/report/schedreport/"+schedule_id, ApiParam.headerConfig());
        };

        ScheduledReportWebService.getAuthorization = function (ckdata) {
            var req = {
                method: 'POST',
                url: $rootScope.url + ':' + $rootScope.port + '/v1/report/authorize',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'bearer ' + $window.sessionStorage.token
                },
                data: ckdata
            };
            return $http(req);
        };

        ScheduledReportWebService.getReport = function (report_id) {
            return $http.get(ApiParam.baseURL() + "/v1/report/report/"+report_id, ApiParam.headerConfig());
        };

        ScheduledReportWebService.sendNow = function (report_id) {
            return $http.get(ApiParam.baseURL() + "/v1/report/sendNow/"+report_id, ApiParam.headerConfig());
        };

        ScheduledReportWebService.filterRulesBasesOnId = function (filter_id) {
            return $http.get(ApiParam.baseURL() + "/v1/report/filters/"+filter_id, ApiParam.headerConfig());
        };

        ScheduledReportWebService.deleteReport = function (report_id) {
            console.log('DELETEING REPORT', report_id);
            return $http.delete(ApiParam.baseURL() + "/v1/report/" + report_id, ApiParam.headerConfig());
        };

        ScheduledReportWebService.createScheduleReportFilter = function (nc) {
            var req = {
                method: 'POST',
                url: $rootScope.url + ':' + $rootScope.port + '/v1/report/filter',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'bearer ' + $window.sessionStorage.token
                },
                data: nc
            };
            return $http(req);
        };

        ScheduledReportWebService.createScheduleReport = function (nc) {
            var req = {
                method: 'POST',
                url: $rootScope.url + ':' + $rootScope.port + '/v1/report',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'bearer ' + $window.sessionStorage.token
                },
                data: nc
            };
            return $http(req);
        };

        ScheduledReportWebService.createNewSchedule = function (nc) {
            var req = {
                method: 'POST',
                url: $rootScope.url + ':' + $rootScope.port + '/v1/report/schedule',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'bearer ' + $window.sessionStorage.token
                },
                data: nc
            };
            return $http(req);
        };

        ScheduledReportWebService.deleteSchedule = function (scheduleId) {
            return $http.delete(ApiParam.baseURL() + "/v1/report/schedule/" + scheduleId, ApiParam.headerConfig());
        };

        ScheduledReportWebService.setDateRange = function (date) {
            	$window.sessionStorage.dateRange = date.range;
              $window.sessionStorage.startDate = date.drp_start;
              $window.sessionStorage.endDate = date.drp_end;
              $window.sessionStorage.schedrptid = date.schedrptid;
        };

        ScheduledReportWebService.getDateRange = function (scheduleId) {
        dateRange.range =  $window.sessionStorage.dateRange;
        dateRange.drp_start =   $window.sessionStorage.startDate;
        dateRange.drp_end =   $window.sessionStorage.endDate;
        dateRange.schedrptid =   $window.sessionStorage.schedrptid;
        return dateRange;
        };

        return ScheduledReportWebService;
    }
}());
