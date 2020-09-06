/**
 * 댓글, 대댓글 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /getUpMents : 댓글 목록 조회
 * 2. /getDownMents : 대댓글 목록 조회
 * 3. /writeUpMent : 댓글 작성
 *                   + 해당 게시글 comment_count + 1
 * 4. /writeDownMent : 대댓글 작성
 *                   + 해당 게시글 및 부모 댓글 comment_count + 1
 * 5. /removeUpment/:upmentId : 댓글 삭제 (대댓글 존재 시, 삭제아닌 내용수정)
 *                   + 해당 게시글 comment_count - 1
 * 6. /removeDownment/:downmentId : 대댓글 삭제
 *                   + 해당 게시글 및 부모 댓글 comment_count -  1
 *
 * @date 2019-11-13
 * @author Hanna
 */

var mentAPI = require("./functions/function_ment");

module.exports = function (router) {
    console.log('user_ment 호출됨.');

    // 최근 댓글 목록
    router.route('/getUpMents').post(function (req, res) {
        console.log('/getUpMents 패스 요청됨.');

        // 페이지 조회
        var userId = (req.user) ? req.user._id : null;
        var postId = req.body.postId;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 10;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            // 카운트하기 전에 해당 게시글이 존재하는 확인하는 코드 넣기
            database.UpmentModel.count({
                "post_id": postId,
                "created_at": {
                    "$lte": lastDate
                }
            }, function (err, count) {
                if (err) {
                    console.error("댓글 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isGetMent: false,
                        errorMsg: "댓글 목록 페이지 카운팅 에러"
                    });

                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isGetMent: true,
                        ments: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.UpmentModel.find({
                    "post_id": postId,
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'writer_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(async function (err, lists) {
                    if (err) {
                        console.error("댓글 목록 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetMent: false,
                            errorMsg: "댓글 목록 조회 에러"
                        });

                        return;
                    }

                    var mentList = [];
                    for (var i = 0; i < lists.length; i++) {
                        var mentOne = {
                            _id: lists[i]._id,
                            w_id: lists[i].writer_id._id,
                            w_nickname: lists[i].writer_id.nickname,
                            w_userName: lists[i].writer_id.userName,
                            w_isBasicImg: lists[i].writer_id.isBasicImg,
                            w_cloudUrl: null,
                            like_count: lists[i].count.like_count,
                            comment_count: lists[i].count.comment_count,
                            text: lists[i].text,
                            created_at: lists[i].created_at,
                            isLike: false,
                            isMyment: false
                        };
                        if (!lists[i].writer_id.isBasicImg)
                            mentOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;
                        if (mentOne.w_id.equals(userId))
                            mentOne.isMyment = true;

                        // 로그인되어 있는 경우에 한해
                        // 내가 좋아요한 댓글인지 판단
                        if (userId) {
                            try {
                                await database.LikeUpmentModel.findOne({
                                    post_id: postId,
                                    upment_id: mentOne._id,
                                    user_id: userId
                                }).then((res) => {
                                    if (res)
                                        mentOne.isLike = true;
                                });
                            } catch (err) {
                                console.error("댓글 목록 조회 에러 : " + err.stack);

                                res.status(400).json({
                                    isGetMent: false,
                                    errorMsg: "댓글 목록 조회 에러"
                                });

                                return;
                            }
                        }

                        mentList.push(mentOne);
                    }

                    res.status(200).json({
                        isGetMent: true,
                        ments: mentList,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetMent: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 최근 대댓글 목록
    router.route('/getDownMents').post(function (req, res) {
        console.log('/getDownMents 패스 요청됨.');

        // 페이지 조회
        var userId = (req.user) ? req.user._id : null;
        var parentId = req.body.parentId;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 10;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            database.DownmentModel.count({
                "parent_id": parentId,
                "created_at": {
                    "$lte": lastDate
                }
            }, function (err, count) {
                if (err) {
                    console.error("대댓글 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isGetMent: false,
                        errorMsg: "대댓글 목록 페이지 카운팅 에러"
                    });

                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isGetMent: true,
                        ments: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.DownmentModel.find({
                    "parent_id": parentId,
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'writer_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(async function (err, lists) {
                    if (err) {
                        console.error("대댓글 목록 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetMent: false,
                            errorMsg: "대댓글 목록 조회 에러"
                        });

                        return;
                    }

                    var mentList = [];
                    for (var i = 0; i < lists.length; i++) {
                        var mentOne = {
                            _id: lists[i]._id,
                            w_id: lists[i].writer_id._id,
                            w_nickname: lists[i].writer_id.nickname,
                            w_userName: lists[i].writer_id.userName,
                            w_isBasicImg: lists[i].writer_id.isBasicImg,
                            w_cloudUrl: null,
                            like_count: lists[i].count.like_count,
                            text: lists[i].text,
                            created_at: lists[i].created_at,
                            isLike: false,
                            isMyment: false
                        };
                        if (!lists[i].writer_id.isBasicImg)
                            mentOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;
                        if (mentOne.w_id.equals(userId)) {
                            mentOne.isMyment = true;
                        }

                        // 로그인되어 있는 경우에 한해
                        // 내가 좋아요한 댓글인지 판단
                        if (userId) {
                            try {
                                await database.LikeDownmentModel.findOne({
                                    downment_id: mentOne._id,
                                    user_id: userId
                                }).then((res) => {
                                    if (res)
                                        mentOne.isLike = true;
                                });
                            } catch (err) {
                                console.error("대댓글 목록 조회 에러 : " + err.stack);

                                res.status(400).json({
                                    isGetMent: false,
                                    errorMsg: "대댓글 목록 조회 에러"
                                });

                                return;
                            }
                        }

                        mentList.push(mentOne);
                    }

                    res.status(200).json({
                        isGetMent: true,
                        ments: mentList,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetMent: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 댓글 작성
    router.route('/writeUpMent').post(function (req, res) {
        console.log('/writeUpMent 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isUpMent: false,
                errorMsg: '로그인 필요 (writeUpMent)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPostID = req.body.postId;
        var paramText = req.body.text;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            database.UpmentModel.create({
                "post_id": paramPostID,
                "writer_id": paramID,
                "text": paramText
            }, function (err, ment) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isUpMent: false,
                        errorMsg: err.stack
                    });
                };

                if (ment) {
                    // 게시글 생성 후, post의 comment_count 증가시키기
                    mentAPI.updateCount(database, true, mentAPI.COUNTTYPE.Post, paramPostID, function (err, result) {
                        if (err) {
                            console.error("comment_count 처리 실패 (UpMent's post) : " + err.stack);
                            res.status(400).json({
                                isUpMent: false,
                                errorMsg: "comment_count 처리 오류 (UpMent's post)"
                            });
                            return;
                        }

                        if (!result) {
                            res.status(400).json({
                                isUpMent: false,
                                errorMsg: "삭제된 게시글입니다."
                            });
                        } else {
                            res.status(200).json({
                                isUpMent: true
                            });
                        }
                    });
                } else {
                    res.status(500).json({
                        isUpMent: false,
                        errorMsg: "댓글 작성 실패 (writeUpMent)"
                    });
                }

            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isUpMent: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });

    // 대댓글 작성
    router.route('/writeDownMent').post(function (req, res) {
        console.log('/writeDownMent 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isDownMent: false,
                errorMsg: '로그인 필요 (writeDownMent)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPostID = req.body.postId;
        var paramParentID = req.body.parentId;
        var paramText = req.body.text;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            database.DownmentModel.create({
                "post_id": paramPostID,
                "parent_id": paramParentID,
                "writer_id": paramID,
                "text": paramText
            }, function (err, ment) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isDownMent: false,
                        errorMsg: err.stack
                    });
                };

                if (ment) {
                    // 대댓글 삭제 후, upment & post의 comment_count 감소시키기
                    mentAPI.updateCount(database, true, mentAPI.COUNTTYPE.Upment, paramParentID, function (err, result) {
                        if (err) {
                            res.status(400).json({
                                isDownMent: false,
                                errorMsg: err.stack
                            });
                            return;
                        }

                        mentAPI.updateCount(database, true, mentAPI.COUNTTYPE.Post, paramPostID, function (err, result) {
                            if (err) {
                                res.status(400).json({
                                    isDownMent: false,
                                    errorMsg: err.stack
                                });
                                return;
                            }

                            if (!result) {
                                res.status(400).json({
                                    isDownMent: false,
                                    errorMsg: "삭제된 게시글입니다."
                                });
                            } else {
                                res.status(200).json({
                                    isDownMent: true
                                });
                            }
                        });
                    });
                } else {
                    res.status(500).json({
                        isDownMent: false,
                        errorMsg: "댓글 작성 실패 (post)"
                    });
                }

            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isDownMent: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });

    // 댓글 삭제
    router.route('/removeUpment/:upmentId').get(function (req, res) {
        console.log('/removeUpment/:upmentId 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isRemoveUpment: false,
                errorMsg: '로그인 필요 (removeUpment)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramUpmentId = req.params.upmentId;

        if (!paramUpmentId) {
            res.status(403).json({
                isRemoveUpment: false,
                errorMsg: '파라미터 필요 (removeUpment)'
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            // 댓글 작성자 _id와 paramID가 일치하는지 확인하기
            mentAPI.getMent(database, true, paramUpmentId, function (err, result) {
                // 에러 처리
                if (err) {
                    console.error(err.stack);
                    res.status(400).json({
                        isRemoveUpment: false,
                        errorMsg: err.stack
                    });
                    return;
                }

                if (!result) {
                    res.status(400).json({
                        isRemoveUpment: false,
                        errorMsg: "존재하지 않는 댓글입니다."
                    });
                    return;
                }

                if (result.writer_id != paramID) {
                    res.status(400).json({
                        isRemoveUpment: false,
                        errorMsg: "접근 권한이 없는 유저입니다."
                    });
                    return;
                }

                // 대댓글 없어 삭제하면 되는 경우
                if (result.count.comment_count < 1) {
                    mentAPI.removeMent(database, true, result, function (err, result) {
                        if (err) {
                            res.status(400).json({
                                isRemoveUpment: false,
                                errorMsg: err.stack
                            });
                            return;
                        }

                        if (!result) {
                            res.status(400).json({
                                isRemoveUpment: false,
                                errorMsg: "삭제된 게시글입니다."
                            });
                        } else {
                            res.status(200).json({
                                isRemoveUpment: true
                            });
                        }

                    });
                }
                // 대댓글이 있어 삭제가 아닌 내용 수정
                else {
                    var data = {
                        $set: {
                            "text": "<삭제된 댓글입니다.>"
                        }
                    }

                    var options = {
                        new: true,
                        runValidators: true
                    }

                    database.UpmentModel.findOneAndUpdate({
                        _id: result._id
                    }, data, options, function (err, result) {
                        if (err) {
                            res.status(400).json({
                                isRemoveUpment: false,
                                errorMsg: err.stack
                            });
                            return;
                        }

                        res.status(200).json({
                            isRemoveUpment: true
                        });
                    });
                }

            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isRemoveUpment: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });

    // 대댓글 삭제
    router.route('/removeDownment/:downmentId').get(function (req, res) {
        console.log('/removeDownment/:downmentId 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isRemoveDownment: false,
                errorMsg: '로그인 필요 (removeDownment)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramDownmentId = req.params.downmentId;

        if (!paramDownmentId) {
            res.status(403).json({
                isRemoveDownment: false,
                errorMsg: '파라미터 필요 (removeDownment)'
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {

            // 대댓글 작성자 _id와 paramID가 일치하는지 확인하기
            mentAPI.getMent(database, false, paramDownmentId, function (err, result) {
                // 에러 처리
                if (err) {
                    console.error(err.stack);
                    res.status(400).json({
                        isRemoveDownment: false,
                        errorMsg: err.stack
                    });
                    return;
                }

                if (!result) {
                    res.status(400).json({
                        isRemoveDownment: false,
                        errorMsg: "존재하지 않는 댓글입니다."
                    });
                    return;
                }

                if (result.writer_id != paramID) {
                    res.status(400).json({
                        isRemoveDownment: false,
                        errorMsg: "접근 권한이 없는 유저입니다."
                    });
                    return;
                }

                // 대댓글 삭제
                mentAPI.removeMent(database, false, result, function (err, result) {
                    if (err) {
                        res.status(400).json({
                            isRemoveDownment: false,
                            errorMsg: err.stack
                        });
                        return;
                    }

                    if (!result) {
                        res.status(400).json({
                            isRemoveDownment: false,
                            errorMsg: "삭제된 게시글입니다."
                        });
                    } else {
                        res.status(200).json({
                            isRemoveDownment: true
                        });
                    }

                });

            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isRemoveDownment: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });

}