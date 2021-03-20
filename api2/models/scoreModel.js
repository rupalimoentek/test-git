'use strict';
/**
 * scoreModel.js
 * Created by Aloha on 16/10/16.
 */

var appModel = require('./appModel'),
  connector = require('./appModel'),
  ctTransactionModel = require('./ctTransactionModel'),
  _ = require('underscore'),
  campaignModel = require('./campaignModel.js');
var f = require('./../functions/functions');
var amqp = require('amqplib'),
  when = require('when'),
  fs = require('fs'),
  ctlogger = require('../lib/ctlogger.js'),
  rabbit = yaml.load(fs.readFileSync("./config/rabbit.yml")),
  envVar = process.env.NODE_ENV,
  tempScoreCardTable = "score_cards",
  tempCriteriaTable = "scorecard_criteria",
  tempScoreCardId = "score_card_id",
  tempCriteriaId = "score_card_replica_id",
  scoreCardReplicaId = null,
  url = 'amqp://' + rabbit[envVar].user + ':' + rabbit[envVar].password + '@' + rabbit[envVar].host + ':' + rabbit[envVar].port + '/' + rabbit[envVar].vhost;
//url = 'amqp://localhost';
var scorecard = {

  save_score_card: function (req, cb) { //Create new score card
    var data = req.body;
    if (data != undefined) {
      async.waterfall([
        function (cb1) {
          var groups = [];
          var current_date_timestamp = 'CURRENT_TIMESTAMP';
          var instruction = '';
          if (data.instruction !== undefined && data.instruction !== null && data.instruction !== 'undefined' && data.instruction !== 'null') {
            instruction = data.instruction;
          }

          var scoreCardData = [];
          data.score_card_name = f.pg_escape_str1(data.score_card_name)
          instruction = f.pg_escape_str1(instruction)
          data.outcome = f.pg_escape_str1(data.outcome)


          var qry = 'Insert into score_cards (score_card_title,groups_list, score_card_instructions, score_card_outcome_label,org_unit_id, importance, scorecard_status, created_by, updated_by) values(';
          qry += '\'' + data.score_card_name + '\',' + 'ARRAY[' + data.groups + ']' + ',\'' + instruction + '\', \'' + data.outcome + '\',' + data.ou_id + ',' + data.importance + ',\'active\',' + data.created_by + ',' + data.updated_by + ') RETURNING score_card_id';
          appModel.ctPool.query(qry, function (err, result) {
            if (err) { return cb(err); }
            else {
              cb1(null, result[0]);
            }
          });
        },
        function (scoreCard_Id, cb1) {
          var criteriaData = [];

          async.each(data.criteriaList, function (criteria, cb2) {
            criteriaData.criteria_title = criteria.title
            criteriaData.scorecard_criteria_importance = criteria.criteria_importance;
            criteriaData.score_card_id = scoreCard_Id.score_card_id;
            if (criteria.helpText !== undefined && criteria.helpText !== null && criteria.helpText !== 'undefined' && criteria.helpText !== 'null') {
              criteriaData.criteria_description = f.pg_escape_str1(criteria.helpText)
            }
            criteriaData.scorecard_criteria_type = criteria.ctype.key;
            criteriaData.display_order = criteria.display_order;
            criteriaData.created_by = criteria.created_by,
              criteriaData.updated_by = criteria.updated_by,
              criteriaData.is_required = criteria.acceptCheck ? criteria.acceptCheck : false;
            var insertData = {
              table: 'scorecard_criteria',
              values: criteriaData
            };

            appModel.ctPool.insert(insertData, function (err, result) {
              if (err) { return cb2(err); }
              else { cb2(null); }
            });

          }, function (err) {

            if (err) {
              //
              cb1(err);
            } else {
              //  
              cb1(null, scoreCard_Id);
            }

          });
        }
      ],
        function (err, result) {
          if (err) {
            cb(err);
          } else {
            cb(null, result);
          }

        });
    }
  },

  update_score_card: function (req, cb) { //update  score card
    var data = req.body;
    var scoreCardId = req.params.id;
    var current_date_timestamp = 'CURRENT_TIMESTAMP';
    var criteriaIds = [];

    console.log(data)
    var ctTrans = new ctTransactionModel.begin(function (err) {
      if (err) {
        cb(err);
        return;
      }
      if (data != undefined && scoreCardId !== undefined && scoreCardId !== null) {
        async.waterfall([
          function (cb1) {
            var groups = [];
            var instruction = '';
            if (data.instruction !== undefined && data.instruction !== null && data.instruction !== 'undefined' && data.instruction !== 'null') {
              instruction = data.instruction;
            }

            var qry = 'UPDATE score_cards SET score_card_title =\'' + f.pg_escape_str1(data.score_card_name) + '\', groups_list = ARRAY[' + data.groups + '], score_card_instructions=\'' + f.pg_escape_str1(instruction) + '\', score_card_outcome_label=\'' + f.pg_escape_str1(data.outcome) + '\', importance = ' + data.importance + ',  updated_by=' + data.updated_by + ', updated_on=' + current_date_timestamp + ' WHERE score_card_id =' + scoreCardId;
            ctTrans.query(qry, function (err, result) {
              if (err) { return cb1(err); }
              else {

                cb1(null);
              }
            });
          },
          function (cb1) {
            var qry = "SELECT scorecard_criteria_id FROM scorecard_criteria  WHERE score_card_replica_id IS NULL AND score_card_id =" + scoreCardId;

            ctTrans.query(qry, function (err, result) {
              if (err) { return cb1(err); }
              else {

                _.each(result, function (criteria) {
                  criteriaIds.push(criteria.scorecard_criteria_id);

                });

              }
              cb1(null, criteriaIds);
            });

          }, function (criteriaIds, cb1) {
            var deleteQry = "DELETE FROM call_criteria WHERE scorecard_criteria_id IN (" + criteriaIds.join(",") + ")";
            console.log("deleteQry---------", deleteQry);
            ctTrans.query(deleteQry, function (err, result) {
              if (err) { cb1(err); }
              else { cb1(null, criteriaIds); }
            });

          },
          function (criteriaIds, cb1) {
            async.each(criteriaIds, function (criteria, cb2) {
              var qry = "UPDATE scorecard_criteria SET criteria_status='deleted' WHERE scorecard_criteria_id=" + criteria + " AND score_card_replica_id IS NULL  AND score_card_id =" + scoreCardId;
              ctTrans.query(qry, function (err, result) {
                if (err) { return cb2(err); }
                else {
                  cb2(null);
                }
              });

            }, function (err) {
              if (err) { cb1(err); }
              else { cb1(null, scoreCardId); }
            });

          },
          function (scoreCardId, cb1) {
            var qry = 'INSERT INTO scorecard_criteria (criteria_title, score_card_id,criteria_description,scorecard_criteria_type, display_order,scorecard_criteria_importance,is_required,created_by, updated_by) values';
            async.eachSeries(data.criteriaList, function (criteria, cb3) {
              var helpText = '';
              if (criteria.helpText !== undefined && criteria.helpText !== null && criteria.helpText !== 'undefined' && criteria.helpText !== 'null') {
                helpText = f.pg_escape_str1(criteria.helpText);
              }
              var is_required = criteria.acceptCheck ? criteria.acceptCheck : false;
              qry += '(\'' + f.pg_escape_str1(criteria.title) + '\',' + scoreCardId + ',\'' + helpText + '\',\'' + criteria.ctype.key + '\',' + criteria.display_order + ', ' + criteria.criteria_importance + ',' + is_required + ',' + criteria.created_by + ',' + criteria.updated_by + '), ';
              cb3(null);
            }, function (err) {
              if (err) {
                cb1(err);
              } else {
                qry = qry.replace(/,\s*$/, "");
                console.log("Final query", qry);
                ctTrans.query(qry, function (err, result) {
                  if (err) { return cb1(err); }
                  else { cb1(null); }
                });
              }

            });
          },
          function (cb1) {
            if (data.flag === true) {
              var query = "SELECT sc.call_id from score_card_calls sc";
              query += " LEFT JOIN call c ON c.call_id = sc.call_id";
              query += " WHERE sc.score_card_id =" + data.score_card_id + " AND sc.score_card_call_status = 'unscored'";
              query += " AND c.org_unit_id IN " + "(" + data.org_unit_id + ")";

              connector.ctPool.query(query, function (err, result) {
                if (err) {
                  cb1(err);
                } else {
                  if (result.length > 0) {
                    var call_id = result.map(x => x.call_id);
                    var query = "DELETE FROM score_card_calls WHERE score_card_call_status = 'unscored'";
                    query += " AND score_card_id = " + data.score_card_id + " AND call_id IN ( " + call_id + " )";
                    connector.ctPool.query(query, function (err, result) {
                      if (err) {
                        cb1(err);
                      } else {
                        cb1(null, result);
                      }
                    });
                  } else {
                    cb1(null, result);
                  }
                }
              });
            }
            else {
              cb1(null);
            }

          }
        ],
          function (err) {
            if (err) {
              ctTrans.rollback(function () {
                cb(err);
              });
            }
            else {
              ctTrans.commit(function () {
                cb(null);
              });
            }
          });

      }
    });

  },
  add_score_to_call: function (req, res) { //add score to call
    var data = req.body;
    var scoreCardId = req.params.id;
    var callId = req.params.callId;
    var current_date_timestamp = 'CURRENT_TIMESTAMP';
    var tempScoreCardReplicaId = null;
    var status = "";
    var criteriaIds = [];
    var ctTrans = new ctTransactionModel.begin(function (err) {
      if (err) {
        cb(err);
        return;
      }
      if (data != undefined) {
        async.waterfall([
          function (cb1) {
            var qry = "SELECT scc.score_card_call_status, c.ct_user_id FROM score_card_calls AS scc"
              qry += " JOIN call AS c ON scc.call_id = c.call_id"
              qry += " WHERE scc.call_id ="+data.call_id;
            ctTrans.query(qry, function (err, result) {
              if (err) { res(err); }
              else {
                if (result.length > 0) {
                  status = result[0].score_card_call_status;
                  var ctUserId = result[0].ct_user_id;
                  if(!ctUserId){
                    cb1('Please assign identified agent to call before scoring call.');
                  } else{
                    cb1(null);
                  }
                } else {
                  status = null;
                  cb1('Please assign identified agent and score card to call before scoring call.');
                }
              }
            });
          },
          function (cb1) {
            if (status == 'unscored') {
              async.waterfall([
                function (sp1) {
                  var qry = "INSERT INTO score_cards_replica (SELECT * FROM score_cards WHERE score_card_id = " + scoreCardId + ") RETURNING score_card_replica_id";
                  ctTrans.query(qry, function (err, result) {
                    if (err) { return cb1(err); }
                    else {
                      scoreCardReplicaId = result[0].score_card_replica_id;
                      sp1(null)
                    }

                  });

                },
                function (sp1) {
                  var qry = 'INSERT INTO scorecard_criteria (criteria_title, score_card_id,criteria_description,scorecard_criteria_type, display_order,scorecard_criteria_importance,is_required,created_by, updated_by, score_card_replica_id) values';
                  async.eachSeries(data.scorecard_rating, function (criteria, cb3) {
                    var helpText = '';
                    if (criteria.helpText !== undefined && criteria.helpText !== null && criteria.helpText !== 'undefined' && criteria.helpText !== 'null') {
                      helpText = f.pg_escape_str1(criteria.helpText);
                    }
                    qry += '(\'' + f.pg_escape_str1(criteria.title) + '\',' + data.score_card_id + ',\'' + helpText + '\',\'' + criteria.ctype + '\',' + criteria.display_order + ', ' + criteria.criteria_importance + ',' + criteria.is_required + ',' + data.ct_user_id + ',' + data.ct_user_id + ',' + scoreCardReplicaId + '), ';
                    cb3(null);
                  }, function (err) {
                    if (err) {
                      cb1(err);
                    } else {
                      qry = qry.replace(/,\s*$/, "");
                      ctTrans.query(qry, function (err, result) {
                        if (err) { return cb1(err); }
                        else {
                          sp1(null);
                        }
                      });
                    }

                  });
                },
                function (sp1) {
                  var qry = "SELECT scorecard_criteria_id, display_order FROM scorecard_criteria WHERE score_card_replica_id = " + scoreCardReplicaId + " ORDER BY display_order";
                  ctTrans.query(qry, function (err, result) {
                    if (err) { return cb1(err); }
                    else {
                      _.map(data.scorecard_rating, function (criteriaId, idx) {
                        return criteriaId.criteria_id = result[idx].scorecard_criteria_id, criteriaId.display_order = result[idx].display_order;
                      });
                      console.log(data.scorecard_rating)
                      sp1(null)
                    }
                  });
                },
                function (sp1) {
                  async.waterfall([
                    function (sp3) {
                      var qry = "SELECT scorecard_criteria_id, display_order FROM call_criteria WHERE call_id  = " + data.call_id + " ORDER BY display_order";
                      ctTrans.query(qry, function (err, result) {
                        if (err) { return cb1(err); }
                        else {
                          var criteria_ids = [];
                          if (result.length > 0 && result != null && result != undefined) {
                            async.eachSeries(result, function (ids, sp4) {
                              async.eachSeries(data.scorecard_rating, function (cids, sp5) {
                                if (ids.display_order == cids.display_order) {
                                  criteria_ids.push({
                                    "criteriaId": cids.criteria_id,
                                    "callCriteriaId": ids.scorecard_criteria_id,
                                    "display_order": ids.display_order
                                  })
                                  sp5(null)
                                } else {
                                  sp5(null)
                                }
                              }, function (err) {
                                if (err) {
                                  sp4(err);
                                } else {
                                  sp4(null);
                                }
                              })
                            }, function (err) {
                              if (err) {
                                sp3(err);
                              } else {
                                sp3(null, criteria_ids)
                              }
                            })
                          } else {
                            sp3(null, criteria_ids);
                          }
                        }
                      });

                    },
                    function (criteria_ids, sp3) {
                      async.eachSeries(criteria_ids, function (dataId, sp6) {
                        var uQry = "UPDATE call_criteria "
                        uQry += "SET scorecard_criteria_id = " + dataId.criteriaId + " WHERE scorecard_criteria_id = " + dataId.callCriteriaId + " AND call_id =" + data.call_id;
                        ctTrans.query(uQry, function (err, result) {
                          if (err) {
                            sp3(err);
                          } else {
                            sp6(null);
                          }
                        })

                      }, function (err) {
                        if (err) {
                          sp1(err);
                        } else {
                          sp3(null)
                        }

                      });
                    }
                  ], function (err, result) {
                    if (err) {
                      sp1(err);
                    } else {
                      sp1(null)
                    }
                  })
                }
              ],
                function (err, result) {
                  if (err) { return cb1(err); }
                  else {
                    cb1(null);
                  }
                });
            }
            else {
              cb1(null);
            }

            //cb1(null);
          },
          function (cb1) {
            var qry = "SELECT score_card_call_id FROM score_card_calls WHERE call_id =" + callId;
            ctTrans.query(qry, function (err, result) {
              if (err) { return cb1(err); }
              else { cb1(null, result[0].score_card_call_id); }
            });
          },
          function (scoreCardCallId, cb1) {
            var qry = "DELETE FROM score_card_scores WHERE score_card_call_id =" + scoreCardCallId;
            ctTrans.query(qry, function (err, result) {
              if (err) { return cb1(err); }
              else { cb1(null, scoreCardCallId); }
            });
          },
          function (scoreCardCallId, cb1) {
            var qry = "Insert into score_card_scores (score_value, scorecard_criteria_id,score_card_call_id, calculated_score ,created_by, updated_by) values";
            async.eachSeries(data.scorecard_rating, function (score, cb3) {
              if (score.selectedCheckPass)
                score.score_value = true;
              else if (score.selectedCheckFail)
                score.score_value = false;
              else if (score.selectedCheckNa)
                score.score_value = 'N/A';
              else {
                score.score_value = score.selectedRadio;
              }

              qry += "('" + score.score_value + "'," + score.criteria_id + "," + scoreCardCallId + ", " + score.criteria_score + ", " + req.userid + "," + req.userid + "), ";
              cb3(null);
            }, function (err) {
              if (err) {

                cb1(err);
              } else {
                qry = qry.replace(/,\s*$/, "");
                ctTrans.query(qry, function (err, result) {
                  if (err) { return cb1(err); }
                  else { cb1(null, scoreCardCallId); }
                });
              }

            });
          },
          function (scoreCardCallId, cb1) {

            var qry = "UPDATE score_card_calls SET scored_by = " + req.userid + ", scored_on= " + current_date_timestamp + ", score_card_outcome_answer = " + data.appt_booked + " ,final_score = " + data.score + ","
            if (status == 'unscored') {
              qry += " score_card_replica_id = " + scoreCardReplicaId + ", "
            }
            qry += " score_card_call_status = 'scored' where score_card_call_id =" + scoreCardCallId;

            ctTrans.query(qry, function (err, result) {
              if (err) { return cb1(err); }
              else { cb1(null); }
            });
          },

        ],
          function (err, result) {
            if (err) {
              ctTrans.rollback(function () {
                res(err);
              });
            } else {
              ctTrans.commit(function () {
                scorecard.get_org_details(req.body.call_id, function (err, result) {
                  if (err) { console.log(err); cb(err); } else {
                    var qdata = {};
                    qdata.call_id = req.body.call_id;
                    qdata.timezone = req.query.timezone;

                    for (var i = 0; i < result.length; i++) {
                      qdata.org_id = result[i].org_unit_id;
                      qdata.org_name = result[i].org_unit_name;
                      qdata.call_action = 'scored';
                      qdata.process = 'scorecardactions';
                      qdata.user_id = data.ct_user_id;
                      qdata.isNew = req.body.isNew;
                    }
                    scorecard.send_score_to_rabbit_q(qdata, function (err, result) {
                      scoreCardReplicaId = null;
                      res(null);

                    });
                  }
                });
              });
            }

          });
      }
    });
  },
  update_score_card_call_status: function (req, cb) { //attach score card to call
    var data = req.body;
    var scoreCardId = req.params.id;
    var callId = req.params.callId;

    var criteriaIds = [];
    if (data != undefined) {
      async.waterfall([
        function (cb1) {
          var groups = [];
          var current_date_timestamp = 'CURRENT_TIMESTAMP';

          var qry = "UPDATE score_card_calls SET score_card_outcome_answer ='" + data.outcome_answer + "', score_card_id = " + scoreCardId + ", ct_user_id=" + data.ct_user_id + ", final_score='" + data.final_score + "', score_card_call_status='" + data.call_status + "', updated_by=" + data.userId + " WHERE call_id =" + callId;



          appModel.ctPool.query(qry, function (err, result) {
            if (err) { return cb(err); }
            else {
              scorecard.get_org_details(req.body.call_id, function () {
                var qdata = {};
                qdata.call_id = req.body.call_id;
                for (var i = 0; i < result.length; i++) {
                  qdata.org_id = result[i].org_unit_id;
                  qdata.org_name = result[i].org_unit_name;
                  qdata.call_action = 'reviewed';
                  qdata.process = 'scorecardactions';
                  qdata.user_id = req.userid;
                }
                qdata.call_id = req.body.call_id;
                qdata.timezone = req.query.timezone;
                scorecard.send_score_to_rabbit_q(qdata, function () {
                  cb(null, result);
                });
              }, data.user_id);
              cb1(null, result);
            }
          });
        },

      ],
        function (err, result) {
          if (err) {
            cb(err);
          } else {
            cb(null, result);
          }

        });
    }
  },
  getScoreCards: function (req, cb) {
    var isCardLoaded = true;
    var returnData = {};
    var scoreCriteriaList = [];
    var scoreCard = {};
    var limit = 100;
    var timezones = {
      "America/Halifax": "AST",
      "America/New_York": "EST",
      "America/Chicago": "CST",
      "America/Denver": "MST",
      "America/Phoenix": "MST",
      "America/Los_Angeles": "PST"
    }

    var offset = limit * (req.query.page - 1)
    async.waterfall([
      function (cb1) {
        var qry = " SELECT DISTINCT sc.score_card_id FROM score_cards sc JOIN scorecard_criteria scc " +
          " ON sc.score_card_id = scc.score_card_id AND scc.criteria_status = 'active' " +
          " WHERE sc.scorecard_status !='deleted' AND sc.org_unit_id IN (" + req.user.orglist + ") ORDER by sc.score_card_id DESC ";

        if (req.query.isExport === false || req.query.isExport === 'false') {
          qry += "LIMIT " + limit + " OFFSET " + offset;
        }

        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            return cb1(err);
          } else {
            var score_card_ids = _.pluck(result, 'score_card_id');

            cb1(null, score_card_ids);
          }
        });
      },

      function (score_card_ids, cb1) {
        if (score_card_ids.length === 0) {
          cb1("No Data Found");
        } else {
          var qry = "SELECT sc.score_card_id, sc.score_card_title, sc.created_by, sc.score_card_outcome_label,sc.score_card_instructions, sc.importance, sc.groups_list, sc.created_on, sc.updated_on, COUNT(scc.score_card_id) AS criteria_count" +
            " FROM score_cards sc JOIN scorecard_criteria scc " +
            " ON sc.score_card_id = scc.score_card_id AND scc.criteria_status = 'active' " +
            " WHERE sc.score_card_id IN (" + score_card_ids.join(",") + ") GROUP BY sc.score_card_id ORDER BY sc.score_card_id DESC";
          appModel.ctPool.query(qry, function (err, result) {
            if (err) {
              return cb1(err);
            } else {
              cb1(null, result);
            }
          });
        }
      },

      function (score, cb1) {
        if (score.length < 0) {
          return cb("No Data Found");
        }
        var ous = [], users = [];
        _.each(score, function (sc) {
          ous.push(sc.groups_list);
          users.push(sc.created_by);
          users.push(sc.updated_by);
        })

        users = users.filter(function (element) {
          return element !== undefined;
        });

        async.parallel([
          function (cb3) {
            var qry = "SELECT org_unit_name, org_unit_id FROM org_unit where org_unit_id IN (" + ous.join(",") + ")";
            appModel.ctPool.query(qry, function (err, result) {
              if (err) {
                return cb2(err);
              } else {
                _.each(score, function (sc) {
                  var groups = result.filter(function (res) {
                    return sc.groups_list.indexOf(res.org_unit_id) > -1;
                  });
                  // 
                  sc.groups_list = _.pluck(groups, 'org_unit_name').toString();
                  // console.log(sc.score_card_title);
                  // console.log(sc.created_on);
                  // console.log(moment(sc.created_on).format("MM-DD-YY hh:mm a"));
                  sc.created_on = moment(sc.created_on).tz(req.query.timezone).format("MM-DD-YYYY h:mm:ss a");
                  sc.updated_on = moment(sc.updated_on).tz(req.query.timezone).format("MM-DD-YYYY h:mm:ss a");
                })
                cb3(null);
              }
            });
          },
          function (cb3) {
            var qry = "SELECT first_name || ' ' || last_name as name,ct_user_id FROM ct_user where ct_user_id IN (" + users.join(",") + ")";
            appModel.ctPool.query(qry, function (err, result) {
              if (err) {
                return cb2(err);
              } else {
                _.each(score, function (sc) {
                  var createdUsers = result.filter(function (res) {
                    return res.ct_user_id === sc.created_by;
                  });
                  // 
                  sc.created_by = _.pluck(createdUsers, 'name').toString().substr(0, 50);
                })
                cb3(null);
              }
            });

          },
        ],
          function (err) {
            if (err) {
              return cb2(err);
            }
            cb1(null, score);
          })
      },

      function (score, cb1) {
        var qry = " SELECT COUNT(DISTINCT (sc.score_card_id)) AS total_records FROM score_cards sc JOIN scorecard_criteria scc " +
          " ON sc.score_card_id = scc.score_card_id " +
          " WHERE sc.scorecard_status!='deleted' AND sc.org_unit_id IN (" + req.user.orglist + ")";
        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            return cb1(err);
          } else {
            var totalRec = _.pluck(result, 'total_records')[0];
            var result = {
              total: totalRec,
              score_card_detail: score
            }
            cb1(null, result);
          }
        });
      }
    ],
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });
  },

  getScoreCardsById: function (req, cb) {
    var scoreCradId = req.params.id;
    var scoreCriteriaList = [];
    var scoreCard = {};
    var isCardLoaded = true;
    var returnData = {};

    async.waterfall([
      function (cb1) {
        var qry = " SELECT  sc.score_card_title, sc.created_by, sc.org_unit_id, sc.groups_list, sc.score_card_instructions, sc.score_card_outcome_label, sc.importance, sc.created_on, sc.updated_on, scc.* "
        if (req.query.call_id)
          qry += " ,cc.scorecard_criteria_id  as tagged_scorecard_criteria_id, cc.criteria_timestamp"
        qry += " FROM score_cards sc "
        qry += " JOIN scorecard_criteria scc ON sc.score_card_id = scc.score_card_id AND scc.criteria_status='active'"
        if (req.query.call_id)
          qry += " LEFT JOIN call_criteria cc ON (cc.scorecard_criteria_id = scc.scorecard_criteria_id AND cc.call_id = " + req.query.call_id + ")";
        qry += " WHERE sc.scorecard_status!='deleted' AND scc.score_card_replica_id IS NULL AND sc.score_card_id =" + scoreCradId + " ORDER BY scc.display_order ASC";

        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            return cb1(err);
          } else {
            cb1(null, result);
          }
        });
      },
      function (score, cb1) {
        if (score.length < 0) {
          return cb("No Data Found");
        }
        async.each(score, function (value, cb2) {

          async.waterfall([
            function (cb3) {
              var qry = "SELECT org_unit_name  as label, org_unit_id as id FROM org_unit where org_unit_id IN (" + value.groups_list + ")";
              appModel.ctPool.query(qry, function (err, result) {
                if (err) {
                  return cb2(err);
                } else {
                  value.groups_list = result;
                  //value.groups_list = groups.toString().substr(0,50);
                  value.created_on = moment.utc(value.created_on).format("MM-DD-YYYY h:mm:ss a");
                  value.updated_on = moment.utc(value.updated_on).format("MM-DD-YYYY h:mm:ss a");

                  cb3(null);
                }
              });
            },
            function (cb3) {
              if (value.created_by != null && value.created_by != undefined) {
                var qry = "SELECT username FROM ct_user where ct_user_id = " + value.created_by;
                appModel.ctPool.query(qry, function (err, result) {
                  if (err) {
                    return cb2(err);
                  } else {
                    value.created_by = result[0].username;
                    cb3(null);
                  }
                });
              } else {
                cb3(null);
              }
            },
            function (cb3) {
              if (value.updated_by != null && value.updated_by != undefined) {
                var qry = "SELECT username FROM ct_user where ct_user_id = " + value.updated_by;
                appModel.ctPool.query(qry, function (err, result) {
                  if (err) {
                    return cb2(err);
                  } else {
                    value.updated_by = result[0].username;

                    if (isCardLoaded) {
                      scoreCard = {
                        'importance': value.importance,
                        'score_card_title': value.score_card_title,
                        'groups': value.groups_list,
                        'ou_id': value.org_unit_id,
                        'instructions': value.score_card_instructions,
                        'outcome_label': value.score_card_outcome_label,
                        'created_by': value.created_by,
                        'updated_by': value.updated_by,
                        'created_on': value.created_on,
                        'updated_on': value.updated_on
                      };
                      isCardLoaded = false;
                    }
                    if (value.scorecard_criteria_id != null) {
                      scoreCriteriaList.push({
                        'criteria_title': value.criteria_title,
                        'display_order': parseInt(value.display_order),
                        'criteria_id': value.scorecard_criteria_id,
                        'criteria_type': value.scorecard_criteria_type,
                        'is_required': value.is_required,
                        'help_text': value.criteria_description,
                        'criteria_importance': value.scorecard_criteria_importance,
                        'tagged_scorecard_criteria_id': value.tagged_scorecard_criteria_id === undefined ? null : value.tagged_scorecard_criteria_id,
                        'criteria_timestamp': value.criteria_timestamp === undefined ? null : value.criteria_timestamp
                      });
                    }
                    returnData.scoreCriteriaList = _.sortBy(scoreCriteriaList, 'display_order');
                    returnData.scoreCard = scoreCard;
                    cb3(null);
                  }
                });
              } else {
                cb3(null);
              }
            }
          ],
            function (err) {
              if (err) {
                return cb2(err);
              }
              cb2();
            })
        }, function (err) {
          if (err) {
            return cb1(err);
          }
          cb1(null, returnData);
        });

      }
    ],
      function (err, returnData) {
        if (err) { cb(err); }
        else { cb(null, returnData); }
      });
  },

  // Amrita - Archive Scorecard functionality
  archiveScorecard: function (req, res) {
    async.waterfall([
      function (callback) {
        var qry = "UPDATE score_cards SET scorecard_status = 'deleted' WHERE score_card_id = " + req.Id;
        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      },

      function (callback) {
        var deleteQry = "DELETE FROM score_card_calls WHERE score_card_call_status = 'unscored' AND score_card_id = " + req.Id;

        appModel.ctPool.query(deleteQry, function (err, result) {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      }
    ], function (err, result) {
      if (err)
        res(err);
      else
        res(null);
    })
  },

  checkScoreCardStatus: function (req, res) {
    var qry = "SELECT  count(score_card_call_id) from  score_card_calls where score_card_id = " + req.Id;
    appModel.ctPool.query(qry, function (err, result) {
      if (err) {
        res(err);
      } else {
        res(null, result);
      }
    });
  },

  getGroups: function (req, cb) {
    var qry = "select org_unit_id,org_unit_name from org_unit where org_unit_status = 'active' AND org_unit_id IN (" + req.user.orglist + ")";
    appModel.ctPool.query(qry, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
  },

  scoreCardDetail: function (req, res) {
    var scoreCardId = req.params.id;
    var scoreCardCallId = req.params.scoreCardCallId;
    async.waterfall([
      function (sp1) {
        var qry = " SELECT score_card_call_status,score_card_replica_id  FROM score_card_calls WHERE call_id = " + scoreCardCallId;
        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            return res(err);
          } else {
            if (result.length > 0) {
              if (result[0].score_card_call_status == "scored" || result[0].score_card_call_status == "reviewed") {
                tempScoreCardTable = "score_cards_replica";
                tempScoreCardId = "score_card_replica_id";
                scoreCardId = result[0].score_card_replica_id;

              } else {
                tempScoreCardId = "score_card_id";
              }
            }
            sp1(null)
          }
        });
      },
      function (sp1) {
        var qry = "SELECT sc.importance, sc.score_card_title, cc.scorecard_criteria_id  as tagged_scorecard_criteria_id, cc.criteria_timestamp , sc.org_unit_id, sc.score_card_instructions,";
        qry += " score_card_calls.score_card_outcome_answer, sc.score_card_outcome_label,score_card_scores.score_value,score_card_scores.score_card_call_id,scc.* ";
        qry += " FROM score_card_scores ";
        qry += " JOIN score_card_calls ON score_card_calls.score_card_call_id = score_card_scores.score_card_call_id ";
        qry += " JOIN " + tempScoreCardTable + " sc ON sc." + tempScoreCardId + " = score_card_calls." + tempScoreCardId;
        qry += " JOIN scorecard_criteria scc ON scc.scorecard_criteria_id = score_card_scores.scorecard_criteria_id ";
        qry += " LEFT JOIN call_criteria cc ON ( cc.scorecard_criteria_id = scc.scorecard_criteria_id AND cc.call_id = " + scoreCardCallId + " ) ";
        qry += " WHERE sc." + tempScoreCardId + " = " + scoreCardId + " AND score_card_calls.call_id = " + req.params.scoreCardCallId;
        appModel.ctPool.query(qry, function (err, result) {
          if (err) {
            res(err);
          } else {
            var scoreCriteriaList = [];
            var scoreCard = {};
            var isCardLoaded = true;
            var returnData = {};
            async.each(result, function (row, callback) {

              if (isCardLoaded) {
                scoreCard = {
                  'importance': row.importance,
                  'score_card_title': row.score_card_title,
                  'groups': row.groups_list,
                  'ou_id': row.org_unit_id,
                  'instructions': row.score_card_instructions,
                  'outcome_label': row.score_card_outcome_label,
                  'outcome_answer': row.score_card_outcome_answer,
                  'created_by': row.created_by,
                  'replica_id': row.score_card_replica_id != null ? row.score_card_replica_id : undefined
                };
                isCardLoaded = false;
              }
              if (row.scorecard_criteria_id != null) {
                scoreCriteriaList.push({
                  'criteria_title': row.criteria_title,
                  'criteria_id': row.scorecard_criteria_id,
                  'criteria_type': row.scorecard_criteria_type,
                  'is_required': row.is_required,
                  'help_text': row.criteria_description,
                  'criteria_importance': row.scorecard_criteria_importance != 'undefined' ? row.scorecard_criteria_importance : undefined,
                  'score_value': row.score_value,
                  'display_order': row.display_order,
                  'score_call_id': row.score_card_call_id,
                  'tagged_scorecard_criteria_id': row.tagged_scorecard_criteria_id,
                  'criteria_timestamp': row.criteria_timestamp
                });
              }
            });
            returnData.scoreCriteriaList = scoreCriteriaList;
            returnData.scoreCard = scoreCard;
            sp1(null, returnData);
          }
        });
      }
    ], function (err, returnData) {
      if (err) {
        res(err)
      } else {
        res(null, returnData)
      }

    })
  },
  send_score_to_rabbit_q: function (qdata, callback) {

    // put the data on RabbitMQ
    amqp.connect(url).then(function (conn) {
      return when(conn.createChannel().then(function (ch) {
        var q = rabbit[envVar].queue;
        var ok = ch.assertQueue(q, { durable: true });

        return ok.then(function () {
          var msg = {
            process: qdata.process,
            call: qdata.call_id,
            action_type: qdata.call_action,
            user_id: qdata.user_id,
            timezone: qdata.timezone,
            isNew: qdata.isNew
          };
          ch.sendToQueue(q, new Buffer(JSON.stringify(msg)), { deliveryMode: true });
          console.log(" [x] Sent '%s'", JSON.stringify(msg));

          return ch.close();
        });
      })).ensure(function () { conn.close(); callback(); });
    }).then(null, console.warn);
  },
  get_org_details: function (call_id, callback) {
    // var qry = "select org_unit_id,org_unit_name from org_unit where org_unit_status = 'active' AND org_unit_id IN ("+qdata.call_id+")";
    var qry = "SELECT * FROM call c JOIN org_unit o ON o.org_unit_id = c.org_unit_id AND o.org_unit_status = 'active' AND c.call_id = " + call_id;
    appModel.ctPool.query(qry, function (err, result) {
      if (err) { return callback(err); }
      else {
        callback(null, result);
      }
    });
  },
  set_call_listened: function (req, res) {
    var data = req.body;
    console.log('Set call listened data', data);
    var ctTrans = new ctTransactionModel.begin(function (err) {
      async.waterfall([
        function (cb) {
          var qry = "SELECT * FROM call_fields WHERE call_id =" + data.call_id;
          console.log(qry);
          ctTrans.query(qry, function (err, result) {
            if (err) {
              cb(err);
            } else {
              cb(null, result);
            }
          });
        },
        function (result, cb) {
          console.log('is_call_listened after', result);
          var qry = "";
          if (result && result.length > 0) {
            qry += "UPDATE call_fields SET is_call_listened = true WHERE call_id = " + data.call_id;
          } else {
            qry += "INSERT INTO call_fields (call_title, call_id, is_call_listened, created_by, updated_by) VALUES(";
            qry += "''," + data.call_id + "," + true + "," + data.userId + "," + data.userId + ") ";
          }
          console.log(qry);
          ctTrans.query(qry, function (err, result) {
            if (err) {
              cb(err);
            } else {
              cb(null);
            }
          });
        }
      ],
        function (err, result) {
          if (err) {
            ctTrans.rollback(function () {
              res(err);
            });
          } else {
            ctTrans.commit(function () {
              res(null, result);
            });
          }
        })
    });
  },
  attach_score_card_to_call: function (req, res) {
    console.log(data)
    var data = req.body;
    data.userId = req.userid;
    console.log(data)
    var current_date_timestamp = Date.now().toString();
    var unassignedUser = false;
    if (data.outcome == null)
      data.outcome = true;
    if (data.user_id === 'unassigned') {
      data.user_id = null;
      unassignedUser = true;
    }
    var ScorecardChange = false;
    var agentChange = false;
    var unattachScorecardBefore = false;
    var unattactAgentBefore = false;
    var isScorecardDelete = false;
    var newScoreCardCallEntry = false;
    var ctTrans = new ctTransactionModel.begin(function (err) {
      async.waterfall([
        function (cb) {
          var qry = "SELECT scc.score_card_id,scc.ct_user_id,sc.scorecard_status FROM score_card_calls scc LEFT JOIN score_cards sc ON sc.score_card_id = scc.score_card_id WHERE scc.call_id = " + data.call_id;
          console.log(qry);
          ctTrans.query(qry, function (err, result) {
            if (err) {
              cb(err);
            } else {
              if (result.length > 0) {
                if (data.isScoreCardChange == null || data.isScoreCardChange == undefined || data.isScoreCardChange == '') {
                  ScorecardChange = false;
                } else {
                  ScorecardChange = (data.isScoreCardChange == result[0].score_card_id) && (data.isScoreCardChange != 'unassigned') ? false : true;
                  // unattachScorecardBefore = (data.isScoreCardChange == result[0].score_card_id) && (data.isScoreCardChange != 'unassigned') ? false : true;
                }
                if (data.isScoreCardAgentChange == null || data.isScoreCardAgentChange == undefined || data.isScoreCardAgentChange == '') {
                  agentChange = false;
                } else {
                  agentChange = ((data.isScoreCardAgentChange == result[0].ct_user_id)) ? false : true;
                  //unattactAgentBefore = ((data.isScoreCardAgentChange == result[0].ct_user_id) && (data.isScoreCardAgentChange != 'unassigned')) ? false : true;
                  if (data.isScoreCardChange == '' && agentChange && result[0].scorecard_status == 'deleted') {
                    isScorecardDelete = true;
                  } else {
                    isScorecardDelete = false;
                  }
                }
                cb(null);
              } else {

                newScoreCardCallEntry = true;

                console.log("00002222222222222222222222222222", unattachScorecardBefore)
                if (data.status == 'unscored') {
                  console.log("----------------------unscored--------------")
                  unattachScorecardBefore = (data.isScoreCardChange == null || data.isScoreCardChange == 'unassigned') ? true : (data.isScoreCardChange == '') ? false : true;
                } else if (data.status == 'needs_scorecard') {
                  console.log("----------------------needs_scorecard--------------")
                  unattachScorecardBefore = (data.isScoreCardChange == null || data.isScoreCardChange == '' || data.isScoreCardChange == 'unassigned') ? false : true;
                } else {
                  //unattachScorecardBefore=''
                }
                var qry = "SELECT ct_user_id FROM call WHERE call_id =" + data.call_id;
                ctTrans.query(qry, function (err, result) {
                  if (err)
                    res(err);
                  else
                    if (result.length > 0 && data.isScoreCardAgentChange != undefined && data.isScoreCardAgentChange != '' && data.isScoreCardAgentChange != null) {
                      console.log("==========11111111===========")
                      //       if(result[0].ct_user_id != data.isScoreCardAgentChange){
                      //           //if(data.isScoreCardAgentChange =='unassigned'){
                      //             unattactAgentBefore = true;
                      //           // }else{
                      //           //   unattactAgentBefore = false;
                      //           // }
                      //       }else{
                      //         unattactAgentBefore = false;
                      //       }
                      // }else{
                      //   unattactAgentBefore = false;
                      if (data.identifyAgent != undefined) {
                        if (result[0].ct_user_id != data.identifyAgent.ct_user_id) {
                          unattactAgentBefore = true;
                        } else {
                          unattactAgentBefore = false;
                        }

                      } else if (data.isScoreCardAgentChange == 'unassigned') {
                        unattactAgentBefore = false;
                      } else {

                      }

                    }
                })
                cb(null);
              }
            }
          });
        },
        function (cb) {
          //SP : Check if Scorecard OR Assign agent got changed for Call
          console.log(agentChange, "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", ScorecardChange);
          console.log(unattactAgentBefore, "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", unattachScorecardBefore);
          if (((ScorecardChange) || (agentChange))) {
            var RId = []
            var qry = "SELECT score_card_replica_id, score_card_call_id,ct_user_id FROM score_card_calls WHERE score_card_replica_id IS NOT NULL AND  call_id = " + data.call_id;
            ctTrans.query(qry, function (err, result) {
              if (err) {
                cb(err);
              } else {
                if (result.length > 0) {
                  RId = {
                    "score_card_replica_id": result[0].score_card_replica_id,
                    "score_card_call_id": result[0].score_card_call_id
                  }
                  if (((ScorecardChange && (data.score_card_id != undefined || data.score_card_id != null)))) {//SP: only Score Card for Call changed for Call
                    console.log("@@@@@@@@@@@@@@@@@@ ScoreCard Change@@@@@@@@@@@@@@@@@@@@@@@");
                    async.waterfall([
                      function (sp1) {
                        var qry = "DELETE FROM score_cards_replica WHERE score_card_replica_id =" + RId.score_card_replica_id;
                        ctTrans.query(qry, function (err, result) {
                          if (err) {
                            cb(err);
                          } else {
                            var callRID = RId;
                            sp1(null, callRID);
                          }
                        })
                      },
                      function (callRID, sp1) {
                        var qry = "DELETE FROM scorecard_criteria WHERE criteria_status = 'active' AND score_card_replica_id = " + callRID.score_card_replica_id;
                        ctTrans.query(qry, function (err, result) {
                          if (err) {
                            cb(err);
                          } else {
                            sp1(null, callRID);
                          }
                        })
                      },
                      function (callRID, sp1) {
                        var qry = "DELETE FROM score_card_scores WHERE score_card_call_id = " + callRID.score_card_call_id;
                        ctTrans.query(qry, function (err, result) {
                          if (err) {
                            cb(err);
                          } else {
                            sp1(null, callRID);
                          }
                        })
                      },
                      function (callRID, sp1) {
                        var qry = "DELETE FROM call_criteria WHERE call_id = " + data.call_id;
                        ctTrans.query(qry, function (err, result) {
                          if (err) {
                            cb(err);
                          } else {
                            sp1(null, callRID);
                          }
                        })
                      },
                      function (callRID, sp1) {
                        if (isScorecardDelete) {
                          var qry = "DELETE FROM score_card_calls WHERE call_id =" + data.call_id;
                          ctTrans.query(qry, function (err, result) {
                            if (err) {
                              cb(err);
                            } else {
                              sp1(null, callRID);
                            }
                          })

                        } else {
                          sp1(null, callRID);
                        }
                      },
                      function (callRID, sp1) {
                        sp1(null);
                      }
                    ], function (err) {
                      if (err) {
                        cb(err);
                      } else {
                        cb(null);
                      }
                    });
                  } else {
                    cb(null);
                  }
                  

                } else if (result.length <= 0) {
                  async.parallel([
                    function (sp2) {
                      if(data.score_card_id == 'unassigned' || data.score_card_id == null || !data.score_card_id) {
                        var qry = "DELETE FROM score_card_calls WHERE call_id =" + data.call_id;
                        ctTrans.query(qry, function (err, result1) {
                          if (err) {
                            sp2(err);
                          } else {
                            sp2(null);
                          }
                        });
                      } else {
                        sp2(null);
                      }
                    },
                    function (sp2) {
                      var qry = "DELETE FROM call_criteria WHERE call_id = " + data.call_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          sp2(err);
                        } else {
                          sp2(null)
                        }
                      })
                    }
                  ], function (err, result) {
                    if (err) {
                      cb(err);
                    } else {
                      cb(null);
                    }
                  })
                } else {
                  cb(null);
                }
              }
            });
          } else {
            cb(null);
          }
        },
        function (cb) {
          var query = "SELECT call_id FROM score_card_calls WHERE call_id = " + data.call_id;
          ctTrans.query(query, function (err, result) {
            if (err) {
              res(err);
            }
            async.waterfall([
              function (cb1) {
                if (data.score_card_id && data.score_card_id !== 'unassigned') {
                  if (result.length <= 0 && !isScorecardDelete) {
                    var qry = "Insert INTO score_card_calls ( score_card_id, call_id, ct_user_id, final_score, score_card_call_status, created_by, updated_by, selected_by, selected_on) values(";
                    qry += "" + data.score_card_id + "," + data.call_id + "," + data.user_id + "," + data.score + ",'unscored'," + data.userId + "," + data.userId + "," + data.userId + ",CURRENT_TIMESTAMP)";
                    ctTrans.query(qry, function (err, result) {
                      if (err) {
                        cb1(err);
                      } else {
                        cb1(null);
                      }
                    })
                  } else {
                    if (!isScorecardDelete && ScorecardChange) {
                      var qry = "UPDATE score_card_calls SET score_card_id = " + data.score_card_id + ", score_card_outcome_answer =true, ct_user_id=" + data.user_id + ", updated_by=" + data.userId + ", selected_by = " + data.userId;
                      if (((ScorecardChange) || (agentChange))) {
                        qry += ", final_score='0', score_card_call_status='" + 'unscored' + "'";
                      }
                      qry += " WHERE call_id = " + data.call_id;
                      ctTrans.query(qry, function (err, data) {
                        if (err)
                          cb1(err);
                        else
                          cb1(null);
                      })
                    } else {
                      cb1(null);
                    }
                  }
                } else if ((data.score_card_id && data.score_card_id === 'unassigned')) {
                  var qry = "DELETE FROM score_card_calls "
                  qry += " WHERE call_id = " + data.call_id;
                  ctTrans.query(qry, function (err, data) {
                    if (err)
                      cb1(err);
                    else
                      cb1(null);
                  })
                } else {
                  cb1(null);
                }
              },
              function (cb1) {
                var query = "SELECT * FROM call_fields WHERE call_id = " + data.call_id;
                ctTrans.query(query, function (err, result) {
                  if (data.call_title) {
                    if (result.length <= 0 && (ScorecardChange == false || agentChange == false)) {
                      data.call_title = f.pg_escape_str1(data.call_title);
                      var qry = "Insert into call_fields (call_title, call_id, created_by, updated_by) values(";
                      qry += "'" + data.call_title + "'," + data.call_id + "," + data.userId + "," + data.userId + ") ";
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          cb1(err);
                        } else {
                          cb1(null);
                        }
                      })

                    } else {
                      data.call_title = f.pg_escape_str1(data.call_title);
                      var qry = "UPDATE call_fields SET call_title = '" + data.call_title;
                      qry += "' ,updated_by = " + data.userId;
                      qry += " WHERE call_id= " + data.call_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          res(err);
                        } else {
                          cb1(null);
                        }
                      })
                    }
                  } else {
                    console.log(result)
                    if (result.length > 0) {
                      if (data.call_title === undefined)
                        data.call_title = '';
                      var qry = "UPDATE call_fields SET call_title = '" + data.call_title;
                      qry += "' ,updated_by = " + data.userId;
                      qry += " WHERE call_id= " + data.call_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          res(err);
                        } else {
                          cb1(null);
                        }
                      })
                    } else {
                      cb1(null);
                    }
                  }
                })

              }

            ], function (err, result) {
              if (err)
                cb(err);
              else
                cb(null);
            })
          });
        },
        function (cb) {
          console.log("Update Score Card");
          if (data.user_id || unassignedUser) {
            var qry = "UPDATE  call SET ct_user_id =" + data.user_id + " WHERE call_id =" + data.call_id;
            ctTrans.query(qry, function (err, result) {
              if (err)
                res(err);
              else
                //unattactAgentBefore = true; 
                cb(null);
            })
          } else {
            cb(null)
          }
        },
        function(cb){
          if (!newScoreCardCallEntry && agentChange && !ScorecardChange) {
            var qry = "UPDATE score_card_calls SET ct_user_id =" + data.user_id + " WHERE call_id =" + data.call_id;
            ctTrans.query(qry, function (err, result) {
              if (err)
                res(err);
              else
                cb(null);
            })
          } else {
            cb(null)
          }
        },
        function (cb) {
          var qry = "SELECT score_card_call_status AS status, final_score AS score FROM score_card_calls WHERE call_id =" + data.call_id;

          ctTrans.query(qry, function (err, result) {
            if (err)
              res(err);
            else

              cb(null, result);
          })
        }

      ], function (err, result) {
        if (err) {
          ctTrans.rollback(function () {
            res(err);
          });
        } else {
          ctTrans.commit(function () {
            console.log(unattachScorecardBefore, "=======", unattactAgentBefore, "=======", newScoreCardCallEntry, "=======", ScorecardChange, "=======", agentChange);
            var log_data = {
              "call_id": data.call_id,
              "ct_user_id": data.userId,
              "isScoreCardChangeId": data.isScoreCardChange,
              "isScoreCardAgentChangeID": data.isScoreCardAgentChange,
              "isScoreCardChange": newScoreCardCallEntry == true ? unattachScorecardBefore : ScorecardChange,
              "isScoreCardAgentChange": newScoreCardCallEntry == true ? unattactAgentBefore : agentChange
            }
            var newdata = { 'org_unit_id': data.group_id, 'ct_user_id': data.userId, 'score_card_id': (data.score_card_id == 'unassigned' || data.score_card_id == '' || data.score_card_id == null) ? null : data.score_card_id, 'log_data': log_data, created_by: data.userId, updated_by: data.userId };
            ctlogger.log(newdata, 'insert', 'score_card', '', '', req.headers.authorization);
            res(null, result);
          });
        }
      })
    })
  },
  getAttachedCalls: function (req, callback) {
    var scoreCardId = req.params.Id;
    console.log("HELLO ====", scoreCardId);
    // var qry = "select org_unit_id,org_unit_name from org_unit where org_unit_status = 'active' AND org_unit_id IN ("+qdata.call_id+")";
    var qry = "SELECT DISTINCT(call_id) FROM score_card_calls where score_card_id=   " + scoreCardId;
    appModel.ctPool.query(qry, function (err, result) {
      if (err) { return callback(err); }
      else {
        callback(null, result);
      }
    });
  },
  getScorecardCriterias: function (req, res) {
    var scoreCardId = req.params.id;
    var qry = "SELECT scorecard_criteria_id as criteria_id, display_order, is_required FROM scorecard_criteria WHERE score_card_id =" + scoreCardId
    qry+= " AND criteria_status = 'active' AND score_card_replica_id IS NULL"
    qry+= " ORDER BY display_order";
    appModel.ctPool.query(qry, function (err, result) {
      if (err) { return res(err); }
      else {
        var criterias = [];
        if(result && result.length > 0){
          _.map(result, function(criteria){
            criterias.push({criteriaId: criteria.criteria_id, displayOrder: criteria.display_order, isRequired: criteria.is_required});
          })
          res(null, criterias);
        }else{
          res(null, []);
        }
      }
    });
  },
  // API for assign scorecard and agent to call to hit it from CAI
  assignScorecardToCall: function (req, res) {
    var data = req.body;
    data.userId = req.userid;
    var isScorecardChange = false;
    var insertNewRecord = false;
    var attachedCallUserId = undefined;
    var isAgentChanged = false;
    var scoreCardCallData = undefined;
    var scoreCardBillingOU = undefined;
    var loggedInUserBillingOU = req.user.billing_id;
    var callBillingOU = undefined;
    var ctTrans = new ctTransactionModel.begin(function (err) {
      async.waterfall([
        // Validate data 
        function (cb) {
          if (!data.callId || data.callId == '' || isNaN(data.callId)) {
            cb('Call id should not be empty or invalid.');
          } else if(data.callId != req.params.id){
            cb('Call id in url and request body should be same.');
          } else if (!data.scoreCardId || data.scoreCardId == '' || isNaN(data.scoreCardId)) {
            cb('Score card id should not be empty or invalid.');
          } else if (!data.identifyAgentName || !data.identifyAgentName === '') {
            cb('Agent name should not be empty');
          } else {
            cb(null);
          }
        },
        function (cb) {
          // Check if scorecard and agent already attached to the call or not.
          var query = "SELECT scc.score_card_id, scc.ct_user_id, scc.score_card_call_status, scc.score_card_replica_id, sc.scorecard_status FROM score_card_calls scc "
          query += "LEFT JOIN score_cards sc ON sc.score_card_id = scc.score_card_id WHERE call_id = " + data.callId;
          ctTrans.query(query, function (err, result) {
            if (err) {
              cb(err);
            }
            if (result && result.length > 0) {
              scoreCardCallData = result[0];
              if (scoreCardCallData.score_card_id !== data.scoreCardId) {
                isScorecardChange = true;
              }
              if (scoreCardCallData.scorecard_status === 'deleted' && !isScorecardChange) {
                cb('Attached score card status is deleted. Please attach active score card.');
              }else{
                cb(null);
              }
            } else {
              insertNewRecord = true;
              cb(null);
            }
          });
        },
        function (cb) {
          var qry = "SELECT sc.scorecard_status, ou.billing_id FROM score_cards AS sc"
          qry+=" JOIN org_unit AS ou ON sc.org_unit_id = ou.org_unit_id"
          qry+=" WHERE sc.score_card_id = "+data.scoreCardId;
          ctTrans.query(qry, function (err, result) {
            if (err) {
              cb(err);
            } else {
              if (result && result.length > 0) {
                if (result[0].scorecard_status === 'deleted') {
                  cb('Score card status is deleted. Please send active scorecard');
                } else {
                  scoreCardBillingOU = result[0].billing_id;
                  cb(null);
                }
              } else {
                cb('Score card does not exist.');
              }
            }
          });
        },
        function (cb) {
          // Function to find out agent user id.
          var agents = require('../config/belle-tire-agents.json');
          var callOuId = undefined;
          async.waterfall([
            // Fetch call details from call id
            function (sp1) {
              var qry = "SELECT c.org_unit_id, c.ct_user_id, ou.billing_id from call AS c"
              qry+= " JOIN org_unit AS ou ON c.org_unit_id = ou.org_unit_id"
              qry+= " WHERE c.call_id = "+data.callId;
              ctTrans.query(qry, function (err, result) {
                if (err) cb(err);
                if (result.length > 0) {
                  callOuId = result[0].org_unit_id;
                  attachedCallUserId = result[0].ct_user_id;
                  callBillingOU = result[0].billing_id;
                  if(loggedInUserBillingOU !== callBillingOU){
                    sp1("You don't have permission to assign scorecard and an agent to call.");
                  } else if(callBillingOU !== scoreCardBillingOU) {
                    sp1("Scorecard and the call should be on the same account.");
                  } else {
                    sp1(null);
                  }
                } else {
                  cb("No call record present for call id.");
                }
              });
            },
            function (sp1) {
              var agentName = data.identifyAgentName.toLowerCase();
              var foundAgents = _.filter(agents, function (agent) {
                return agent.orgUnitId === callOuId && agent.nickName.toLowerCase() === data.identifyAgentName.toLowerCase();
              });
              console.log('Matched agents', foundAgents);
              if (foundAgents.length === 0) {
                var qry = "SELECT ct_user_id FROM ct_user WHERE user_status = 'active' AND role_id IN (2, 3, 8) AND ct_user_ou_id = " + callOuId + " AND (((LOWER(first_name) || ' ' || LOWER(last_name) = '" + agentName + "')) OR LOWER(first_name)='" + agentName + "' OR LOWER(last_name)='" + agentName + "')";
                ctTrans.query(qry, function (err, result) {
                  if (err) cb(err);
                  if (result && result.length > 0) {
                    data.agentUserId = result[0].ct_user_id;
                    if (attachedCallUserId !== data.agentUserId) {
                      isAgentChanged = true;
                    }
                    sp1(null);
                  } else {
                    cb('Invalid user name. Please pass a user name belonging to the same group.');
                  }
                });
              } else {
                if (foundAgents.length > 0) {
                  var agentUserName = foundAgents[0].email;
                  var qry = "SELECT ct_user_id FROM ct_user WHERE user_status = 'active' AND role_id IN (2, 3, 8) AND ct_user_ou_id = " + callOuId + " AND username = '" + agentUserName +"'";
                  ctTrans.query(qry, function (err, result) {
                    if (err) cb(err);
                    if (result && result.length > 0) {
                      data.agentUserId = result[0].ct_user_id;
                      if (attachedCallUserId !== data.agentUserId) {
                        isAgentChanged = true;
                      }
                      sp1(null);
                    } else {
                      cb('Invalid user name. Please pass a user name belonging to the same group.');
                    }
                  });
                }
              }
            }], function (err) {
              if (err) {
                cb(err);
              } else {
                cb(null);
              }
            });
        },
        function (cb) {
          if (isScorecardChange) {
            var RId = []
            var qry = "SELECT score_card_replica_id, score_card_call_id,ct_user_id FROM score_card_calls WHERE score_card_replica_id IS NOT NULL AND  call_id = " + data.callId;
            ctTrans.query(qry, function (err, result) {
              if (err) {
                cb(err);
              } else {
                if (result.length > 0) {
                  RId = {
                    "score_card_replica_id": result[0].score_card_replica_id,
                    "score_card_call_id": result[0].score_card_call_id
                  }
                  // Delete previous and reset score if scorecard change or unassigned
                  async.waterfall([
                    function (sp1) {
                      var qry = "DELETE FROM score_cards_replica WHERE score_card_replica_id =" + RId.score_card_replica_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          cb(err);
                        } else {
                          var callRID = RId;
                          sp1(null, callRID);
                        }
                      })
                    },
                    function (callRID, sp1) {
                      var qry = "DELETE FROM scorecard_criteria WHERE criteria_status = 'active' AND score_card_replica_id = " + callRID.score_card_replica_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          cb(err);
                        } else {
                          sp1(null, callRID);
                        }
                      })
                    },
                    function (callRID, sp1) {
                      var qry = "DELETE FROM score_card_scores WHERE score_card_call_id = " + callRID.score_card_call_id;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          cb(err);
                        } else {
                          sp1(null);
                        }
                      })
                    },
                    function (sp1) {
                      var qry = "DELETE FROM call_criteria WHERE call_id = " + data.callId;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          cb(err);
                        } else {
                          sp1(null);
                        }
                      })
                    },
                    function (sp1) {
                      var qry = "UPDATE score_card_calls SET score_card_id = " + data.scoreCardId + ", score_card_outcome_answer =true, ct_user_id=" + data.agentUserId + ", updated_by=" + data.userId + ", selected_by = " + data.userId;
                      qry += ", score_card_replica_id = null, final_score='0', score_card_call_status='" + 'unscored' + "'";
                      qry += " WHERE call_id = " + data.callId;
                      ctTrans.query(qry, function (err) {
                        if (err)
                          cb1(err);
                        else
                          sp1(null);
                      })
                    }
                  ], function (err) {
                    if (err) {
                      cb(err);
                    } else {
                      cb(null);
                    }
                  });
                } else if (result.length === 0) {
                  async.parallel([
                    function (sp2) {
                      var qry = "UPDATE score_card_calls SET score_card_call_status = 'unscored', updated_by = " + data.userId + ", ct_user_id = " + data.agentUserId;
                      qry += ", score_card_id = " + data.scoreCardId + ", score_card_replica_id = null"
                      qry += " WHERE call_id = " + data.callId;
                      ctTrans.query(qry, function (err) {
                        if (err) {
                          sp2(err);
                        } else {
                          sp2(null);
                        }
                      });
                    },
                    function (sp2) {
                      var qry = "DELETE FROM call_criteria WHERE call_id = " + data.callId;
                      ctTrans.query(qry, function (err, result) {
                        if (err) {
                          sp2(err);
                        } else {
                          sp2(null);
                        }
                      })
                    }
                  ], function (err, result) {
                    if (err) {
                      cb(err);
                    } else {
                      cb(null);
                    }
                  })
                }
                else {
                  cb(null);
                }
              }
            });
          } else {
            cb(null);
          }
        },
        function (cb) {
          // Check if call scorecard and agent assignment is new
          if (insertNewRecord) {
            async.waterfall([
              function (sp1) {
                var qry = "Insert INTO score_card_calls ( score_card_id, call_id, ct_user_id, final_score, score_card_call_status, created_by, updated_by, selected_by, selected_on) values(";
                qry += "" + data.scoreCardId + "," + data.callId + "," + data.agentUserId + "," + 0 + ",'unscored'," + data.userId + "," + data.userId + "," + data.userId + ",CURRENT_TIMESTAMP)";
                ctTrans.query(qry, function (err) {
                  if (err) {
                    cb(err);
                  } else {
                    sp1(null);
                  }
                });
              },
              function (sp1) {
                var qry = "UPDATE call SET ct_user_id =" + data.agentUserId + " WHERE call_id =" + data.callId;
                ctTrans.query(qry, function (err) {
                  if (err)
                    cb(err);
                  else
                    sp1(null);
                });
              }
            ], function (err) {
              if (err)
                cb(err);
              else
                cb(null);
            })
          } else {
            cb(null);
          }
        },
        function (cb) {
          if (isAgentChanged && !insertNewRecord) {
            var qry = "UPDATE call SET ct_user_id =" + data.agentUserId + " WHERE call_id =" + data.callId;
            ctTrans.query(qry, function (err) {
              if (err)
                cb(err);
              else
                cb(null);
            });
          } else {
            cb(null);
          }
        }
      ], function (err, result) {
          if (err) {
            ctTrans.rollback(function () {
              console.log('Error', err);
              res(err);
            });
          } else {
            ctTrans.commit(function () {
              res(null, result);
            });
          }
      });
    })
  },
  addOrUpdateCallScore: function (req, res) {
    var data = req.body;
    data.userId = req.userid;
    var scoreCardId = req.params.id;
    var callId = req.params.callId;
    var current_date_timestamp = 'CURRENT_TIMESTAMP';
    var scoreCallStatus = "";
    var scoreCardReplicaId = undefined;
    var SCORED = "scored";
    var UNSCORED = "unscored";
    var criteriaIds = _.map(data.scoreCardRating, function (scoreCard) { return scoreCard.criteriaId; });
    var ctTrans = new ctTransactionModel.begin(function (err) {
      if (err) {
        cb(err);
        return;
      }
      async.waterfall([
        // Validate data 
        function (cb1) {
          if(data.callId === null){
            cb1('Expected type integer but found type null.');
          } else if (!data.callId || data.callId == '' || isNaN(data.callId) || !callId || callId == '' || isNaN(callId)) {
            cb1('syntax error.');
          } else if (data.scoreCardId === null) {
            cb1('Expected type integer but found type null.');
          } else if (!data.scoreCardId || data.scoreCardId == '' || isNaN(data.scoreCardId) || !scoreCardId || scoreCardId == '' || isNaN(scoreCardId)) {
            cb1('syntax error.');
          } else if(data.callId != callId){
            cb1('Call id in url and request body should be same.');
          } else if(data.scoreCardId != scoreCardId){
            cb1('Score card id in url and request body should be same.');
          } else if(_.contains(criteriaIds, null)){
            cb1('Expected type integer but found type null.');
          } else if(_.contains(criteriaIds, undefined)){
            cb1('syntax error.');
          } else if(data.apptBooked == undefined || (data.apptBooked !== 'Yes' && data.apptBooked !== 'No')){
            cb1('Please send valid outcome label/apptBooked value.');
          } else {
            cb1(null);
          }
        },
        // Fetch score card call status
        function (cb1) {
          var qry = "SELECT scc.score_card_call_status, scc.score_card_id, c.ct_user_id FROM score_card_calls AS scc"
          qry += " JOIN call AS c ON scc.call_id = c.call_id"
          qry += " WHERE scc.call_id ="+callId;
          ctTrans.query(qry, function (err, result) {
            if (err) { cb1(err); }
            else {
              if (result.length > 0) {
                scoreCallStatus = result[0].score_card_call_status;
                if(scoreCardId != result[0].score_card_id){
                  cb1('Attached score card id to call and score card id in request should be same.');
                } else if(!result[0].ct_user_id || result[0].ct_user_id === null){
                  cb1('Agent should be assinged to call before scoring call');
                } else {
                  cb1(null);
                }
              } else {
                cb1('Score card not assigned to call yet or call record does not exits.');
              }
            }
          });
        },
        function (cb1) {
          var qry = "SELECT scorecard_criteria_id as criteria_id, criteria_title AS title, criteria_description AS help_text,"
          qry += " is_required, scorecard_criteria_type AS ctype, scorecard_criteria_importance AS importance, display_order"
          qry += " FROM scorecard_criteria WHERE score_card_id ="+ scoreCardId +" AND score_card_replica_id IS NULL "
          qry += " AND criteria_status = 'active' ORDER BY display_order";
          ctTrans.query(qry, function (err, results) {
            if (err) { return cb1(err); }
            else {
              if (results && results.length > 0) {
                var scoreCardCriteriaIds = _.map(results, function (scoreCard) { return scoreCard.criteria_id; });
                _.each(criteriaIds, function(criteria){
                   if(isNaN(criteria)){
                    cb1('syntax error.');
                   }
                });
                if(JSON.stringify(scoreCardCriteriaIds) !== JSON.stringify(criteriaIds)){
                  cb1('Scorecard criteria ids do not match.');
                } else {
                  _.map(data.scoreCardRating, function (criteria) {
                  _.each(results, function (retrivedCriteria) {
                    if (criteria.criteriaId === retrivedCriteria.criteria_id) {
                      criteria.helpText = retrivedCriteria.help_text;
                      criteria.title = retrivedCriteria.title;
                      criteria.displayOrder = retrivedCriteria.display_order;
                      criteria.isRequired = retrivedCriteria.is_required;
                      criteria.importance = retrivedCriteria.importance;
                    }
                  });
                });
                cb1(null);
                }
              } else {
                cb1('Scorecard criterias does not exist');
              }
            }
          });
        },
        function (cb1) {
          validateCallScore(data, cb1)
          // if (validateCallScore(data, cb1)) {
          //   cb1('Please make sure you have answered all mandatory questions.');
          // } else {
          //   cb1(null);
          // }
        },
        function (cb1) {
          // Check if call is unscored
          if (scoreCallStatus == 'unscored') {
            async.waterfall([
              function (sp1) {
                var qry = "INSERT INTO score_cards_replica (SELECT * FROM score_cards WHERE score_card_id = " + scoreCardId + ") RETURNING score_card_replica_id";
                ctTrans.query(qry, function (err, result) {
                  if (err) { return cb1(err); }
                  else {
                    scoreCardReplicaId = result[0].score_card_replica_id;
                    console.log('scoreCardReplicaId', scoreCardReplicaId);
                    sp1(null)
                  }
                });
              },
              function (sp1) {
                var qry = 'INSERT INTO scorecard_criteria (criteria_title, score_card_id,criteria_description,scorecard_criteria_type, display_order,scorecard_criteria_importance,is_required,created_by, updated_by, score_card_replica_id) values';
                async.eachSeries(data.scoreCardRating, function (criteria, cb3) {
                  var helpText = '';
                  if (criteria.helpText !== undefined && criteria.helpText !== null && criteria.helpText !== 'undefined' && criteria.helpText !== 'null') {
                    helpText = f.pg_escape_str1(criteria.helpText);
                  }
                  qry += '(\'' + f.pg_escape_str1(criteria.title) + '\',' + data.scoreCardId + ',\'' + helpText + '\',\'' + criteria.ctype + '\',' + criteria.displayOrder + ', ' + criteria.importance + ',' + criteria.isRequired + ',' + data.userId + ',' + data.userId + ',' + scoreCardReplicaId + '), ';
                  cb3(null);
                }, function (err) {
                  if (err) {
                    cb1(err);
                  } else {
                    qry = qry.replace(/,\s*$/, "");
                    ctTrans.query(qry, function (err, result) {
                      if (err) { return cb1(err); }
                      else {
                        sp1(null);
                      }
                    });
                  }

                });
              },
              function (sp1) {
                var qry = "SELECT scorecard_criteria_id, display_order FROM scorecard_criteria WHERE score_card_replica_id = " + scoreCardReplicaId + " ORDER BY display_order";
                ctTrans.query(qry, function (err, result) {
                  if (err) { return cb1(err); }
                  else {
                    _.map(data.scoreCardRating, function (criteria, idx) {
                      return criteria.criteriaId = result[idx].scorecard_criteria_id, criteria.displayOrder = result[idx].display_order;
                    });
                    sp1(null);
                  }
                });
              },
              function (sp1) {
                async.waterfall([
                  function (sp3) {
                    var qry = "SELECT scorecard_criteria_id, display_order FROM call_criteria WHERE call_id  = " + data.callId + " ORDER BY display_order";
                    ctTrans.query(qry, function (err, result) {
                      if (err) { return cb1(err); }
                      else {
                        var criteriaIds = [];
                        if (result.length > 0 && result != null && result != undefined) {
                          async.eachSeries(result, function (ids, sp4) {
                            async.eachSeries(data.scoreCardRating, function (cids, sp5) {
                              if (ids.display_order == cids.displayOrder) {
                                criteriaIds.push({
                                  "criteriaId": cids.criteriaId,
                                  "callCriteriaId": ids.scorecard_criteria_id,
                                  "display_order": ids.display_order
                                })
                                sp5(null)
                              } else {
                                sp5(null)
                              }
                            }, function (err) {
                              if (err) {
                                sp4(err);
                              } else {
                                sp4(null);
                              }
                            })
                          }, function (err) {
                            if (err) {
                              sp3(err);
                            } else {
                              sp3(null, criteriaIds)
                            }
                          })
                        } else {
                          sp3(null, criteriaIds);
                        }
                      }
                    });

                  },
                  function (criteriaIds, sp3) {
                    async.eachSeries(criteriaIds, function (dataId, sp6) {
                      var uQry = "UPDATE call_criteria "
                      uQry += "SET scorecard_criteria_id = " + dataId.criteriaId + " WHERE scorecard_criteria_id = " + dataId.callCriteriaId + " AND call_id =" + data.callId;
                      ctTrans.query(uQry, function (err, result) {
                        if (err) {
                          sp3(err);
                        } else {
                          sp6(null);
                        }
                      })

                    }, function (err) {
                      if (err) {
                        sp1(err);
                      } else {
                        sp3(null)
                      }

                    });
                  }
                ], function (err, result) {
                  if (err) {
                    sp1(err);
                  } else {
                    sp1(null)
                  }
                })
              }
            ], function (err, result) {
              if (err) { return cb1(err); }
              else {
                cb1(null);
              }
            });
          } else {
            cb1(null);
          }
        },
        function (cb1) {
          var qry = "SELECT score_card_call_id FROM score_card_calls WHERE call_id =" + callId;
          ctTrans.query(qry, function (err, result) {
            if (err) { return cb1(err); }
            else { cb1(null, result[0].score_card_call_id); }
          });
        },
        function (scoreCardCallId, cb1) {
          var qry = "DELETE FROM score_card_scores WHERE score_card_call_id =" + scoreCardCallId;
          ctTrans.query(qry, function (err, result) {
            if (err) { return cb1(err); }
            else { cb1(null, scoreCardCallId); }
          });
        },
        function (scoreCardCallId, cb1) {
          data = calculateCallScorecardScore(data);
          data.apptBooked = (data.apptBooked === 'Yes') ? true : false;
          cb1(null, scoreCardCallId);
        },
        function (scoreCardCallId, cb1) {
          var qry = "Insert into score_card_scores (score_value, scorecard_criteria_id,score_card_call_id, calculated_score ,created_by, updated_by) values";
          async.eachSeries(data.scoreCardRating, function (score, cb3) {
            if (score.selectedCheckPass)
              score.scoreValue = true;
            else if (score.selectedCheckFail)
              score.scoreValue = false;
            else if (score.selectedCheckNa)
              score.scoreValue = 'N/A';
            else {
              score.scoreValue = score.selectedRadio;
            }

            qry += "('" + score.scoreValue + "'," + score.criteriaId + "," + scoreCardCallId + ", " + score.criteriaScore + ", " + data.userId + "," + data.userId + "), ";
            cb3(null);
          }, function (err) {
            if (err) {

              cb1(err);
            } else {
              qry = qry.replace(/,\s*$/, "");
              ctTrans.query(qry, function (err, result) {
                if (err) { return cb1(err); }
                else { cb1(null, scoreCardCallId); }
              });
            }

          });
        },
        function (scoreCardCallId, cb1) {
          var qry = "UPDATE score_card_calls SET scored_by = " + data.userId + ", scored_on= " + current_date_timestamp + ", score_card_outcome_answer = " + data.apptBooked + " ,final_score = " + data.score + ","
          if (scoreCallStatus == UNSCORED) {
            qry += " score_card_replica_id = " + scoreCardReplicaId + ", "
          }
          qry += " score_card_call_status = '" + SCORED + "' where score_card_call_id =" + scoreCardCallId;
          ctTrans.query(qry, function (err, result) {
            if (err) { return cb1(err); }
            else { cb1(null); }
          });
        },
      ], function (err) {
        if (err) {
          ctTrans.rollback(function () {
            console.log('Error: ',err);
            res(err);
          });
        } else {
          ctTrans.commit(function () {
            res(null);
          });
        }
      });
    });
  }
};

// Validate score card scores
function validateCallScore(data, callback) {
  var validationFlag = false;
  _.map(data.scoreCardRating, function (criteria) {
    if (criteria.isRequired) {
      if (criteria.ctype === 'scale_0-3' || criteria.ctype === 'scale_0-5' || criteria.ctype === "scale_0-10") {
        if (!criteria.selectedRadio || criteria.selectedRadio === '') {
          validationFlag = true;
        }
      }
      if (criteria.ctype === "Pass/Fail") {
        if (!criteria.selectedCheckPass && !criteria.selectedCheckFail && !criteria.selectedCheckNa) {
          validationFlag = true;
        }
      }
    }
  });
  if (validationFlag) {
    callback("Please make sure you have answered all mandatory questions.");
  } else {
    var errMsg = undefined;
    _.map(data.scoreCardRating, function (criteria) {
      if (criteria.ctype === 'scale_0-3' && (criteria.selectedRadio && criteria.selectedRadio !== '')) {
        if (!_.contains(['0', '1', '2', '3', 'N/A'], criteria.selectedRadio)) {
          errMsg = 'Invalid selectedRadio value.';
          callback("Invalid scale_0-3 selectedRadio value.");
        }
      } else if (criteria.ctype === 'scale_0-5' && (criteria.selectedRadio && criteria.selectedRadio !== '')) {
        if (!_.contains(['0', '1', '2', '3', '4', '5', 'N/A'], criteria.selectedRadio)) {
          errMsg = 'Invalid selectedRadio value.';
          callback("Invalid scale_0-5 selectedRadio value.");
        }
      } else if (criteria.ctype === "scale_0-10" && (criteria.selectedRadio && criteria.selectedRadio !== '')) {
        if (!_.contains(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'N/A'], criteria.selectedRadio)) {
          errMsg = 'Invalid selectedRadio value.';
          callback("Invalid scale_0-10 selectedRadio value.");
        }
      } else if (criteria.ctype === "Pass/Fail" && (criteria.selectedCheckPass!==undefined || criteria.selectedCheckFail!==undefined || criteria.selectedCheckNa!==undefined)) {
        if (criteria.selectedCheckPass === false && criteria.selectedCheckFail === false && criteria.selectedCheckNa === false) {
          errMsg = 'All Pass/Fail values can not be false.';
          callback("All Pass/Fail values can not be false.");
        } else if (!criteria.selectedCheckPass && !criteria.selectedCheckFail && !criteria.selectedCheckNa) {
          errMsg = 'Invalid Pass/Fail values.';
          callback("Invalid Pass/Fail values.");
        } else if (criteria.selectedCheckPass === true && criteria.selectedCheckFail === true && criteria.selectedCheckNa === true) {
          errMsg = 'All Pass/Fail values can not be true.';
          callback("All Pass/Fail values can not be true.");
        } else if (!_.contains([true, false], criteria.selectedCheckPass) || !_.contains([true, false], criteria.selectedCheckFail) || !_.contains([true, false], criteria.selectedCheckNa)) {
          errMsg = 'Invalid Pass/Fail values.';
          callback("Invalid Pass/Fail values.");
        } else if (criteria.selectedCheckPass === true && criteria.selectedCheckFail === true && criteria.selectedCheckNa === false) {
          errMsg = 'Only one value can be true of Pass/Fail criteria.';
          callback("Only one value can be true of Pass/Fail criteria.");
        } else if (criteria.selectedCheckPass === true && criteria.selectedCheckFail === false && criteria.selectedCheckNa === true) {
          errMsg = 'Only one value can be true of Pass/Fail criteria.';
          callback("Only one value can be true of Pass/Fail criteria.");
        } else if (criteria.selectedCheckPass === false && criteria.selectedCheckFail === true && criteria.selectedCheckNa === true) {
          errMsg = 'Only one value can be true of Pass/Fail criteria.';
          callback("Only one value can be true of Pass/Fail criteria.");
        }
      }
    });
    if (!errMsg) {
      callback(null);
    }
  }
}

function calculateCallScorecardScore(data) {
  var totalImportance = 0;
  var finalGrade = 0;
  var finalScore = 0;
  _.map(data.scoreCardRating, function (criteria) {
    var score = 0;
    var radioScore = 0;
    var importance = criteria.importance;
    if (criteria.ctype === 'scale_0-3') {
      radioScore = 3;
    } else if (criteria.ctype === 'scale_0-5') {
      radioScore = 5;
    } else {
      radioScore = 10;
    }
    criteria.selectedRadio = criteria.selectedRadio == "undefined" ? undefined : criteria.selectedRadio;
    if (criteria.selectedCheckPass) {
      score = 1;
      totalImportance += parseInt(importance);
    } else if (criteria.selectedCheckFail) {
      score = 0;
      totalImportance += parseInt(importance);
    } else if (criteria.selectedRadio) {
      if (criteria.selectedRadio !== 'N/A') {
        totalImportance += parseInt(importance);
        score = parseFloat(parseInt(criteria.selectedRadio) / radioScore);
      }
    }

    if (!isNaN(score)) {
      criteria.criteriaScore = (importance > 0) ? (score * importance) : 0;
      finalGrade += criteria.criteriaScore;
    } else {
      criteria.criteriaScore = 0;
    }
    criteria.score = score;
    criteria.criteriaScore = Math.round(parseFloat((criteria.criteriaScore)).toFixed(2));
  });

  _.map(data.scoreCardRating, function (criteria) {
    var importance = criteria.importance;
    var radioScoreForCriteria = 0;
    if (criteria.ctype === 'scale_0-3') {
      radioScoreForCriteria = 3;
      criteria.radioOptionsLength = 3;
    } else if (criteria.ctype === 'scale_0-5') {
      radioScoreForCriteria = 5;
      criteria.radioOptionsLength = 5;
    } else {
      radioScoreForCriteria = 10;
      criteria.radioOptionsLength = 10;
    }
    if (criteria.selectedCheckPass) {
      var score = parseInt(importance);
      return criteria.criteriaScore = Math.round(parseFloat(score / parseInt(criteria.importance) * 100).toFixed(2));
    } else if (criteria.selectedCheckFail) {
      var score = 0;
      return criteria.criteriaScore = 0;
    } else if (criteria.selectedCheckNa) {
      var score = parseInt(importance);
      return criteria.criteriaScore = Math.round(parseFloat(score / parseInt(criteria.importance) * 100).toFixed(2));
    } else if (criteria.selectedRadio) {
      if (criteria.selectedRadio === 'N/A') {
        score = Math.round((parseFloat(parseInt(criteria.radioOptionsLength) / radioScoreForCriteria) * 100).toFixed(2));
      } else {
        score = Math.round((parseFloat(parseInt(criteria.selectedRadio) / radioScoreForCriteria) * 100).toFixed(2));
      }
      return criteria.criteriaScore = score;
    }
  })

  if (finalGrade == 0 && totalImportance == 0) {
    finalScore = 0;
  } else {
    finalScore = Math.round(parseFloat(finalGrade / totalImportance * 100).toFixed(2));
    finalScore = parseFloat(finalScore);
  }
  if (Number(finalScore) === finalScore && finalScore % 1 === 0) {
    finalScore = parseInt(finalScore);
  }
  data.score = finalScore;
  return data;
}

module.exports = scorecard;



