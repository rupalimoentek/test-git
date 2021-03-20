"use_strict";
var sinon =  require('sinon'),
    reportModel = require('../../models/reportModel'),
    connector = require('../../models/appModel'),
    orgUnitModel = require('../../models/orgUnitModel');




describe('reportModel.campaignSettings returns data from query', function () {
    before(function(done){
        sinon
            .stub(orgUnitModel,'ouAndDescendents')
            .yields('90,85,822,87,83,792,793,857,830,838,800,902,807,814,869,846,850,882,875,888,908,914,920,926,932,938,943,948,953,959,964,969,974,73,9,10,11,88,12,13,14,15,16,17,6,18,33,72,794,801,808,815,823,831,839,847,851,816,790,795,802,809,818,832,827,824,852,848,841,858,864,870,883,876,889,903,909,915,922,927,933,103,105,106,791,970,796,803,810,817,877,825,871,833,865,842,884,849,853,892,904,910,916,921,928,934,939,944,949,954,957,960,965,975,979,983,986,989,992,995,998,8,130,120,131,70,114,115,117,108,89,75,74,86,109,84,119,124,122,126,107,110,194,811,819,843,826,878,872,866,804,797,854,128,860,835,834,893,885,891,905,911,917,923,929,935,940,945,950,955,961,966,971,976,980,102,118,918,828,125,924,798,930,836,121,936,127,844,805,812,113,820,941,71,855,946,873,867,879,906,912,951,956,962,967,972,977,981,984,987,990,993,996,999,963,799,881,806,880,813,874,821,868,829,837,887,840,123,845,856,968,907,913,919,925,931,937,942,947,952,958,973,978,982,985,988,991,994,997,1000,1063,1062,1064,1080,1130');
        sinon
        .stub(connector.ctPool,'query')
            .yields({
                "results": [
                    {
                        "id": 772,
                        "campaign_name": "$0000000 TEST FOR COUNT",
                        "campaign_ext_id": null,
                        "org_unit_id": 8,
                        "org_unit_name": "Blingy Marketing LLC1",
                        "campaign_owner": "Bucky Rocket",
                        "start_date": "2015-10-01 00:46:15",
                        "end_date": null,
                        "status": "active",
                        "active_routes": "14",
                        "inactive_routes": "0",
                        "assigned_users": "manish agarwal",
                        "campaign_status": "active",
                        "campaign_start_date": "2015-10-01 07:46:15",
                        "campaign_end_date": null
                    },
                    {
                        "id": 780,
                        "campaign_name": "yogesh test 1",
                        "campaign_ext_id": "",
                        "org_unit_id": 8,
                        "org_unit_name": "Blingy Marketing LLC1",
                        "campaign_owner": "Bucky Rocket",
                        "start_date": "2015-10-07 00:21:54",
                        "end_date": "2015-10-07 00:21:54",
                        "status": "inactive",
                        "active_routes": "0",
                        "inactive_routes": "0",
                        "assigned_users": "manish agarwal",
                        "campaign_status": "inactive",
                        "campaign_start_date": "2015-10-07 07:21:54",
                        "campaign_end_date": "2015-10-07 07:21:54"
                    }
                ],
                "total_count": "197"
            }

            );
        done();
    });
    after(function(done){
        orgUnitModel.ouAndDescendents.restore();
        connector.ctPool.query.restore();

        done();
    });

    it('returns valid valid data',function(done) {
        var params = [{
            "limit": 100,
            "offset": 100,
            "ft": "a",
            "filters": [{
                "inclusivity": "include",
                "column": "campaign_id",
                "compOperator": "gt",
                "userinput": 22
            }, {"inclusivity": "exclude", "column": "campaign_name", "compOperator": "cont", "userinput": "test"}]
        }];
        var userData = [{"role_id":1,"billing_id":8,"user_ou_level":0,"timezone":"America/Los_Angeles","last_name":"Rocket","first_name":"Bucky","tl_id":8,"ou_name":"Blingy Marketing LLC1","ou_id":8,"user_id":2}];

        console.log('test sent params:' , params);

        reportModel.campaignSettings(JSON.stringify(params), userData, function (err, data) {

            if (err) return done(err);
            connector.ctPool.query.called.should.be.equal(true);
            console.log('data was: ' + data);
            data.should.not.be.empty;
            // console.log('data:',data);
            data.should.have.property('results[0].id', 772);
            done();
        });


    });
});