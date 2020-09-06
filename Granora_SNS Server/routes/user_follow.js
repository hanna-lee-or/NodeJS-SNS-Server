/**
 * 유저 follow 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /getFollowingList : 팔로잉 목록 조회
 * 2. /getFollowerList : 팔로워 목록 조회
 * 3. /flipFollow/:Id : 사용자 follow
 * 4. /getUsers/:page : 유저 목록 조회
 * 5. /getOtherProfile/:id : 유저 프로필 조회
 * 
 * < function 목록 >
 * 1. setFollow(database, receiverID, senderID, callback)
 *      : 팔로우 여부에 따라 정보 수정
 * 2. getIsFollow(database, receiverID, senderID, callback)
 *      : 팔로우 여부 반환
 * 3. updateUserCount(database, isAdd, receiverID, senderID, callback)
 *      : 유저 count 값 수정
 *
 * @date 2019-11-13
 * @author Hanna
 */

module.exports = function (router) {
    console.log("user_follow 호출됨.");

    // 팔로잉 목록
    router.route("/getFollowingList").post(function (req, res) {
        console.log("getFollowingList 호출됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isGetFollow: false,
                errorMsg: '로그인 필요 (getFollowingList)'
            });
            return;
        }

        // 페이지 조회
        var userId = req.user._id;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            database.UserFollowModel.count({
                "sender_id": userId,
                "created_at": {
                    "$lte": lastDate
                }
            }, function (err, count) {
                if (err) {
                    console.error("팔로잉 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isGetFollow: false,
                        errorMsg: "팔로잉 페이지 카운팅 에러"
                    });

                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isGetFollow: true,
                        users: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.UserFollowModel.find({
                    "sender_id": userId,
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'receiver_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(function (err, lists) {
                    if (err) {
                        console.error("팔로잉 목록 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetFollow: false,
                            errorMsg: "팔로잉 목록 조회 에러"
                        });

                        return;
                    }

                    var userList = [], newLastDate;
                    for (var i = 0; i < lists.length; i++) {
                        var userOne = {
                            _id: lists[i].receiver_id._id,
                            nickname: lists[i].receiver_id.nickname,
                            userName: lists[i].receiver_id.userName,
                            isBasicImg: lists[i].receiver_id.isBasicImg,
                            cloudUrl: null
                        };
                        if (!userOne.isBasicImg)
                            userOne.cloudUrl = lists[i].receiver_id.userImg.cloudUrl;

                        if (i == lists.length - 1) {
                            newLastDate = lists[i].created_at;
                        }

                        userList.push(userOne);
                    }

                    res.status(200).json({
                        isGetFollow: true,
                        users: userList,
                        newLastDate: newLastDate,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetFollow: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 팔로워 목록
    router.route("/getFollowerList").post(function (req, res) {
        console.log('/getFollowerList 호출됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isGetFollow: false,
                errorMsg: '로그인 필요 (getFollowerList)'
            });
            return;
        }

        // 페이지 조회
        var userId = req.user._id;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            database.UserFollowModel.count({
                "receiver_id": userId,
                "created_at": {
                    "$lte": lastDate
                }
            }, function (err, count) {
                if (err) {
                    console.error("팔로워 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isGetFollow: false,
                        errorMsg: "팔로워 페이지 카운팅 에러"
                    });

                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isGetFollow: true,
                        users: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.UserFollowModel.find({
                    "receiver_id": userId,
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'sender_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(function (err, lists) {
                    if (err) {
                        console.error("팔로워 목록 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetFollow: false,
                            errorMsg: "팔로워 목록 조회 에러"
                        });

                        return;
                    }

                    var userList = [], newLastDate;
                    for (var i = 0; i < lists.length; i++) {
                        var userOne = {
                            _id: lists[i].sender_id._id,
                            nickname: lists[i].sender_id.nickname,
                            userName: lists[i].sender_id.userName,
                            isBasicImg: lists[i].sender_id.isBasicImg,
                            cloudUrl: null
                        };
                        if (!userOne.isBasicImg)
                            userOne.cloudUrl = lists[i].sender_id.userImg.cloudUrl;

                        if (i == lists.length - 1) {
                            newLastDate = lists[i].created_at;
                        }

                        userList.push(userOne);
                    }

                    res.status(200).json({
                        isGetFollow: true,
                        users: userList,
                        newLastDate: newLastDate,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetFollow: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 팔로우
    router.route("/flipFollow/:Id").get(function (req, res) {
        console.log("/flipFollow/" + req.params.Id + " 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isUserFollow: false,
                errorMsg: "로그인 필요 (flipFollow)"
            });
            return;
        }

        // 파라미터 설정
        var paramSenderId = req.user._id;
        var paramReceiverId = req.params.Id;

        // 자기 자신을 팔로우 하는 경우
        if (paramSenderId == paramReceiverId) {
            res.status(403).json({
                isUserFollow: false,
                errorMsg: "팔로우 할 수 없는 대상입니다. (flipFollow)"
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        if (database.db) {
            // 팔로우 설정/해제
            setFollow(database, paramReceiverId, paramSenderId, function (err, result, isFollow) {
                if (err) {
                    res.status(403).json({
                        isUserFollow: false,
                        errorMsg: err.stack
                    });
                }

                // 팔로우 설정이면 1, 해제면 0
                var isStatus = isFollow ? 1 : 0;
                res.status(200).json({
                    isUserFollow: true,
                    status: isStatus
                });
            });

        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isUserFollow: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 유저 목록
    router.route("/getUsers/:page").get(function (req, res) {
        console.log("/getUsers 패스 요청됨.");

        // 페이지 조회
        var page = Math.max(1, req.params.page);
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        if (database.db) {

            database.UserModel.count({}, function (err, count) {
                if (err) {
                    console.error("사용자 목록 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isGetUser: false,
                        errorMsg: "사용자 목록 페이지 카운팅 에러"
                    });

                    return;
                }

                var skip = page == 1 ? 0 : 1;
                var maxPage = Math.ceil(count / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isGetUser: true,
                        users: null,
                        page: page,
                        maxPage: maxPage,
                        totalNum: 0
                    });

                    return;
                }

                database.UserModel.find({}).skip(skip).limit(limit)
                    .exec(function (err, lists) {
                        if (err) {
                            console.error("유저 목록 조회 에러 : " + err.stack);

                            res.status(400).json({
                                isGetUser: false,
                                errorMsg: "유저 목록 조회 에러"
                            });

                            return;
                        }

                        var userList = [];
                        for (var i = 0; i < lists.length; i++) {
                            var userOne = {
                                _id: lists[i]._id,
                                nickname: lists[i].nickname,
                                userName: lists[i].userName,
                                isBasicImg: lists[i].isBasicImg,
                                cloudUrl: null,
                                board_count: lists[i].count.board_count,
                                follower_count: lists[i].count.follower_count,
                                following_count: lists[i].count.following_count,
                                userInfo: lists[i].userInfo
                            };
                            if (!lists[i].isBasicImg)
                                userOne.cloudUrl = lists[i].userImg.cloudUrl;
                            userList.push(userOne);
                        }

                        res.status(200).json({
                            isGetUser: true,
                            users: userList,
                            page: page,
                            maxPage: maxPage,
                            totalNum: count
                        });

                    });
            });

        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetUser: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 유저 프로필 조회
    router.route("/getOtherProfile/:id").get(function (req, res) {
        console.log("/getUsers 패스 요청됨.");

        // 데이터베이스 객체 참조
        var database = req.app.get("database");
        var paramId = req.params.id;

        if (database.db) {

            database.UserModel.findOne({ "_id": paramId }).then((result) => {
                res.status(200).json({
                    isGetUser: true,
                    _id: result._id,
                    nickname: result.nickname,
                    userName: result.userName,
                    isBasicImg: result.isBasicImg,
                    cloudUrl: (!result.isBasicImg) ? result.userImg.cloudUrl : null,
                    board_count: result.count.board_count,
                    follower_count: result.count.follower_count,
                    following_count: result.count.following_count,
                    userInfo: result.userInfo
                });
            }).catch((err) => {
                res.status(400).json({
                    isGetUser: false,
                    errorMsg: "유저 프로필 조회 에러"
                });
            });


        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetUser: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });
};



// 팔로우 여부에 따라 정보 수정
var setFollow = function (database, receiverID, senderID, callback) {

    // 해당 게시글 정보 반환
    getIsFollow(database, receiverID, senderID, function (err, isFollow) {
        // 에러 처리
        if (err) {
            callback(err, null);
            return;
        }

        if (!isFollow) {
            // 팔로우 정보 생성, count 조정
            database.UserFollowModel.create({
                receiver_id: receiverID,
                sender_id: senderID
            }).then((res1) => {
                updateUserCount(database, true, receiverID, senderID, function (err, result) {
                    if (err)
                        callback(err, null, null);
                    callback(err, true, true);
                });
            }).catch((err) => {
                callback(err, null, null);
            });
        }
        else {
            // 팔로우 정보 삭제, count 조정
            database.UserFollowModel.findOneAndRemove({
                receiver_id: receiverID,
                sender_id: senderID
            }).then((res1) => {
                updateUserCount(database, false, receiverID, senderID, function (err, result) {
                    if (err)
                        callback(err, null, null);
                    callback(err, true, false);
                });
            }).catch((err) => {
                callback(err, null, null);
            });
        }

    });
};

// 팔로우 여부 반환
var getIsFollow = function (database, receiverID, senderID, callback) {

    // 그 전에 팔로우한 대상인지 여부 반환
    database.UserFollowModel.findOne(
        {
            receiver_id: receiverID,
            sender_id: senderID
        }).then((res1) => {
            if (!res1) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        }).catch((err) => {
            callback(err, null);
        });
};

// 유저 count 값 수정
var updateUserCount = function (database, isAdd, receiverID, senderID, callback) {

    // UserModel을 이용해 업데이트
    var conditionR = {
        _id: receiverID
    };

    var conditionS = {
        _id: senderID
    };

    var dataR, dataS;
    // 게시글 생성, 유저의 board_count + 1
    if (isAdd) {
        dataR = {
            $inc: {
                "count.follower_count": 1
            }
        };
        dataS = {
            $inc: {
                "count.following_count": 1
            }
        };
    }
    // 게시글 삭제 시, 유저의 board_count - 1
    else {
        dataR = {
            $inc: {
                "count.follower_count": -1
            }
        };
        dataS = {
            $inc: {
                "count.following_count": -1
            }
        };
    }

    var options = {
        new: true,
        runValidators: true
    };

    database.UserModel.findOneAndUpdate(conditionR, dataR, options)
        .then((res1) => {
            database.UserModel.findOneAndUpdate(conditionS, dataS, options)
                .then((res2) => {
                    callback(null, true);
                }).catch((err) => {
                    callback(err, null);
                });
        }).catch((err) => {
            callback(err, null);
        });
};