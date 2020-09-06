/**
 * 좋아요 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /flipLike/:mode/:objectId/:postId : 좋아요 표기
 * 
 * < function 목록>
 * 1. setLike(database, type, paramPostId, objectID, userID, callback)
 *      : 좋아요 여부에 따른 LikePostModel 생성
 * 2. getUserLike(database, type, paramPostId, objectID, userID, callback)
 *      : 해당 유저의 좋아요 여부 반환
 * 3. updateCount(database, isAdd, type, ID, callback)
 *      : 게시글/댓글/대댓글 좋아요 count 값 수정
 *
 * @date 2019-10-10
 * @author Hanna
 */


// enum (이름 체크 함수 리턴 값에 사용)
const TYPE = Object.freeze({
    'Post': 2,
    'Upment': 1,
    'Downment': 0
});

module.exports = function (router) {
    console.log('user_likey 호출됨.');

    // 좋아요 표기
    router.route('/flipLike/:mode/:objectId/:postId').get(function (req, res) {
        console.log('/flipLike/' + req.params.mode + "/" + req.params.objectId + "/" + req.params.postId + '패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.status(403).json({
                isLike: false,
                errorMsg: '로그인 필요 (flipLike)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramMode = req.params.mode;
        var paramObjId = req.params.objectId;
        var paramPostId = req.params.postId;


        var modeType;
        // 댓글/대댓글은 소속 게시판 id도 있어야 함.
        if (paramMode == "post") {
            modeType = TYPE.Post;
        } else if (paramMode == "upment" && paramPostId) {
            modeType = TYPE.Upment;
        } else if (paramMode == "downment" && paramPostId) {
            modeType = TYPE.Downment;
        } else {
            res.status(403).json({
                isLike: false,
                errorMsg: '파라미터 에러 (flipLike)'
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        if (database.db) {

            // 좋아요 설정/해제
            setLike(database, modeType, paramPostId, paramObjId, paramID, function (err, result, isAdd, likeNum) {
                // 에러 처리
                if (err) {
                    console.error(err.stack);
                    res.status(400).json({
                        isLike: false,
                        errorMsg: err.stack
                    });
                    return;
                }

                var keyword = (modeType == TYPE.Post) ? "게시글" : (modeType == TYPE.Upment) ? "댓글" : "대댓글";
                if (result) {
                    keyword = keyword + " 좋아요";
                    if (isAdd) {
                        keyword = keyword + " 설정";
                    } else {
                        keyword = keyword + " 해제";
                    }
                    console.log(keyword);
                    res.status(200).json({
                        isLike: true,
                        status: isAdd ? 1 : 0,
                        likeNum: likeNum
                    });
                } else {
                    keyword = "삭제된 " + keyword + "입니다.";
                    res.status(200).json({
                        isLike: false,
                        errorMsg: keyword
                    });
                }

            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isLike: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });
}

// 좋아요 여부에 따른 LikePostModel 생성
var setLike = function (database, type, paramPostId, objectID, userID, callback) {

    var isAdd;
    if (type == TYPE.Post) {
        var conditions = {
            "post_id": objectID,
            "user_id": userID
        };
        // 해당 게시글 정보 반환
        getUserLike(database, type, objectID, userID, function (err, result) {
            if (err) {
                callback(err, null, null, null);
            }

            // 좋아요 돼있으면 좋아요 해제, 안돼있으면 좋아요 설정
            if (!result) {
                isAdd = true;
            } else {
                isAdd = false;
            }

            // 좋아요 개수 조작
            updateLikeCount(database, isAdd, type, objectID, function (err, result) {
                if (err) {
                    callback(err, null, null, null);
                }

                if (!result) {
                    // 게시글이 삭제된 경우
                    callback(null, false, null, null);
                } else {
                    var likeNum = result.count.like_count;
                    if (isAdd) {
                        // 좋아요 추가
                        database.LikePostModel.create(conditions, function (err, res) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            if (!res) {
                                callback("likePost 데이터 생성 오류", null, null, null);
                            } else {
                                callback(null, true, isAdd, likeNum);
                            }
                        }
                        );
                    }
                    else {
                        // 좋아요 삭제
                        database.LikePostModel.findOneAndRemove(conditions, function (err) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            callback(null, true, isAdd, likeNum);
                        }
                        );
                    }
                }
            });
        });
    } else if (type == TYPE.Upment) {
        var conditions = {
            "post_id": paramPostId,
            "upment_id": objectID,
            "user_id": userID
        };
        // 해당 게시글 정보 반환
        getUserLike(database, type, objectID, userID, function (err, result) {
            if (err) {
                callback(err, null, null, null);
            }

            // 좋아요 돼있으면 좋아요 해제, 안돼있으면 좋아요 설정
            if (!result) {
                isAdd = true;
            } else {
                isAdd = false;
            }

            // 좋아요 개수 조작
            updateLikeCount(database, isAdd, type, objectID, function (err, result) {
                if (err) {
                    callback(err, null, null, null);
                }

                if (!result) {
                    // 게시글이 삭제된 경우
                    callback(null, false, null, null);
                } else {
                    var likeNum = result.count.like_count;
                    if (isAdd) {
                        // 좋아요 추가
                        database.LikeUpmentModel.create(conditions, function (err, res) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            if (!res) {
                                callback("likePost 데이터 생성 오류", null);
                            } else {
                                callback(null, true, isAdd, likeNum);
                            }
                        }
                        );
                    }
                    else {
                        // 좋아요 삭제
                        database.LikeUpmentModel.findOneAndRemove(conditions, function (err) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            callback(null, true, isAdd, likeNum);
                        }
                        );
                    }
                }
            });
        });
    } else {
        var conditions = {
            "post_id": paramPostId,
            "downment_id": objectID,
            "user_id": userID
        };
        // 해당 게시글 정보 반환
        getUserLike(database, type, objectID, userID, function (err, result) {
            if (err) {
                callback(err, null, null);
            }

            // 좋아요 돼있으면 좋아요 해제, 안돼있으면 좋아요 설정
            if (!result) {
                isAdd = true;
            } else {
                isAdd = false;
            }

            // 좋아요 개수 조작
            updateLikeCount(database, isAdd, type, objectID, function (err, result) {
                if (err) {
                    callback(err, null, null, null);
                }

                if (!result) {
                    // 게시글이 삭제된 경우
                    callback(null, false, null, null);
                } else {
                    var likeNum = result.count.like_count;
                    if (isAdd) {
                        // 좋아요 추가
                        database.LikeDownmentModel.create(conditions, function (err, res) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            if (!res) {
                                callback("likePost 데이터 생성 오류", null);
                            } else {
                                callback(null, true, isAdd, likeNum);
                            }
                        }
                        );
                    }
                    else {
                        // 좋아요 삭제
                        database.LikeDownmentModel.findOneAndRemove(conditions, function (err) {
                            if (err) {
                                callback(err, null, null, null);
                                return;
                            }

                            callback(null, true, isAdd, likeNum);
                        }
                        );
                    }
                }
            });
        });
    }
}

// 해당 유저의 좋아요/북마크 여부 반환
var getUserLike = function (database, type, objectID, userID, callback) {

    if (type == TYPE.Post) {
        var conditions = {
            "post_id": objectID,
            "user_id": userID
        };
        database.LikePostModel.findOne(conditions, function (err, result) {
            if (err) {
                callback(err, null);
            }

            if (!result) {
                callback(null, false);
            }
            else {
                callback(null, true);
            }
        }
        );
    } else if (type == TYPE.Upment) {
        var conditions = {
            "upment_id": objectID,
            "user_id": userID
        };
        database.LikeUpmentModel.findOne(conditions, function (err, result) {
            if (err) {
                callback(err, null);
            }

            if (!result) {
                callback(null, false);
            }
            else {
                callback(null, true);
            }
        }
        );
    } else {
        var conditions = {
            "downment_id": objectID,
            "user_id": userID
        };
        database.LikeDownmentModel.findOne(conditions, function (err, result) {
            if (err) {
                callback(err, null);
            }

            if (!result) {
                callback(null, false);
            }
            else {
                callback(null, true);
            }
        }
        );
    }
}

// 게시글/댓글/대댓글 count 값 수정
var updateLikeCount = function (database, isAdd, type, ID, callback) {

    // UserModel을 이용해 업데이트
    var conditions = {
        "_id": ID
    };

    var data;
    // 좋아요 추가 like_count + 1
    if (isAdd) {
        data = {
            $inc: {
                "count.like_count": 1
            }
        }
    }
    // 좋아요 추가 like_count - 1
    else {
        data = {
            $inc: {
                "count.like_count": -1
            }
        }
    }

    var options = {
        new: true,
        runValidators: true
    }

    // 게시글의 경우
    if (type == TYPE.Post) {
        database.PostModel.findOneAndUpdate(conditions, data, options, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    }
    // 댓글의 경우
    else if (type == TYPE.Upment) {
        database.UpmentModel.findOneAndUpdate(conditions, data, options, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    }
    // 대댓글의 경우
    else {
        database.DownmentModel.findOneAndUpdate(conditions, data, options, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    }

}