/**
 * 게시글 정보 처리 함수
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < fuction 목록 >
 * 1. getType() : enum 값 리턴
 * 2. checkPostUser(database, postId, userId, callback)
 *       : 게시글 작성자 조회
 * 3. updatePost(database, type, post, callback)
 *       : 게시글 수정 함수
 * 4. updateUserCount(database, isCreate, userId, callback)
 *       : 유저 count 값 수정
 * 5. setPostErrorMsg(err) : 에러 메시지 처리
 * 6-1. removeMentPost(database, postId, callback)
 *       : 댓글, 대댓글 삭제
 * 6-2. movePost(database, postId, callback)
 *       : 게시글 삭제 게시글판으로 이동
 * 6-3. removeLikePost(database, postId, callback)
 *       : 댓글/대댓글 삭제 & 삭제에 따른 북마크 처리
 *
 * @date 2019-11-13
 * @author Hanna
 */

// enum (이름 체크 함수 리턴 값에 사용)
const UPDATETYPE = Object.freeze({
    Tag: 4,
    Notice: 3,
    Private: 2,
    Update: 1,
    UpdateImg: 0
});

exports.getType = function () {
    return UPDATETYPE;
}

// 게시글 작성자 조회
exports.checkPostUser = function (database, postId, userId, callback) {
    //console.log("getUserData 호출됨.");

    // PostModel을 이용해 사용자 조회
    database.PostModel.findOne({
        _id: postId
    },
        function (err, post) {
            // 에러 처리
            if (err) {
                callback(err, -1);
            }

            if (!post) {
                callback("존재하지 않는 게시글입니다.", 0);
            } else if (post.writer_id != userId) {
                callback("접근 권한이 없는 유저입니다.", 0);
            } else {
                callback(null, 1);
            }
        }
    );
};

// 게시글 수정 함수
exports.updatePost = function (database, type, post, callback) {
    //console.log("updatePost 호출됨.");

    // PostModel을 이용해 업데이트
    var conditions = {
        _id: post.postId
    };

    var data;
    // 게시글 내용 수정
    if (type == UPDATETYPE.Update) {
        data = {
            $set: {
                "content.title": post.title,
                "content.text": post.text
            }
        };
    }
    // 게시글 이미지 수정
    else if (type == UPDATETYPE.UpdateImg) {
        data = {
            $set: {
                "thumbnail": post.thumbnail,
                "content.imageOrder": post.imageOrder
            }
        };
    }
    // 댓글 알림 등 설정 수정
    else if (type == UPDATETYPE.Notice) {
        data = {
            $set: {
                isNotice: post.isNotice
            }
        };
    }
    // 공개 여부 설정 수정
    else if (type == UPDATETYPE.Private) {
        data = {
            $set: {
                isPrivate: post.isPrivate
            }
        };
    }
    // 태그 수정
    else {
        data = {
            $set: {
                tag: post.tag
            }
        };
    }

    var options = {
        new: true,
        runValidators: true
    };

    database.PostModel.findOneAndUpdate(conditions, data, options, function (
        err,
        result
    ) {
        if (err) {
            callback(err, null);
            return;
        }

        //console.log("데이터베이스에서 게시글 수정함.");
        callback(null, result);
    });
};

// 유저 count 값 수정
exports.updateUserCount = function (database, isCreate, userId, callback) {
    //console.log("updateUserCount 호출됨.");

    // UserModel을 이용해 업데이트
    var conditions = {
        _id: userId
    };

    var data;
    // 게시글 생성, 유저의 board_count + 1 & lastPosting_at 갱신
    if (isCreate) {
        data = {
            $inc: {
                "count.board_count": 1
            },
            'lastPosting_at' : Date.now()
        };
    }
    // 게시글 삭제 시, 유저의 board_count - 1
    else {
        data = {
            $inc: {
                "count.board_count": -1
            }
        };
    }

    var options = {
        new: true,
        runValidators: true
    };

    database.UserModel.findOneAndUpdate(conditions, data, options, function (
        err,
        result
    ) {
        if (err) {
            callback(err, null);
            return;
        }

        //console.log("게시글 수정에 따라 유저 데이터 수정 (board_count).");

        callback(null, result);
    });
};

// 에러 메시지 처리
exports.setPostErrorMsg = function (err) {
    var thisErrorMsg = {
        title: null,
        text: null
    };
    // 에러 메세지 설정
    try {
        thisErrorMsg.title = err.errors.content.title.message;
    } catch (e) { }
    try {
        thisErrorMsg.text = err.errors.content.text.message;
    } catch (e) { }

    return thisErrorMsg;
};

// 댓글/대댓글 삭제
exports.removeMentPost = function (database, postId, callback) {
    //console.log("removeMentPost 호출됨.");

    // 소속 대댓글 삭제
    database.DownmentModel.remove({
        post_id: postId
    },
        function (err) {
            if (err) {
                callback(err);
                return;
            }

            // 소속 댓글 삭제
            database.UpmentModel.remove({
                post_id: postId
            },
                function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // 게시글 삭제 단계로
                    movePost(database, postId, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }

                        callback(null);
                    });


                    /* 게시글 삭제
                    database.PostModel.findOneAndRemove({
                            _id: postId
                        },
                        function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }

                            removeLikePost(database, postId, function (err) {
                                if (err) {
                                    callback(err);
                                    return;
                                }

                                callback(null);
                            });
                        }
                    );*/
                }
            );
        }
    );
};

// 게시글 삭제 게시글판으로 이동
var movePost = function (database, postId, callback) {
    //console.log("movePost 호출됨.");

    // 게시글 조회
    database.PostModel.findOne({
        _id: postId
    }).then((res1) => {

        // 삭제 게시판에 생성
        database.RemovedPostModel.create({
            writer_id: res1.writer_id,
            "content": res1.content,
            "tag": (!res1.tag) ? null : res1.tag,
            "count": res1.count

        }).then((res2) => {

            // 게시글 삭제
            database.PostModel.findOneAndRemove({
                _id: postId
            }).then((res3) => {
                // 관련 좋아요 삭제 처리
                removeLikePost(database, postId, function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    callback(null);
                });

            }).catch((err) => {
                callback(err);
            });

        }).catch((err) => {
            callback(err);
        });

    }).catch((err) => {
        callback(err);
    });
}

// 댓글/대댓글 삭제 & 삭제에 따른 북마크 처리
var removeLikePost = function (database, postId, callback) {
    //console.log("removeLikePost 호출됨.");

    // 소속 대댓글 좋아요 삭제
    database.LikeDownmentModel.remove({
        post_id: postId
    },
        function (err) {
            if (err) {
                callback(err);
                return;
            }

            // 소속 댓글 좋아요 삭제
            database.LikeUpmentModel.remove({
                post_id: postId
            },
                function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // 게시글 좋아요 삭제
                    database.LikePostModel.remove({
                        post_id: postId
                    },
                        function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }

                            // 북마크 처리
                            database.ClipPostModel.update({
                                post_id: postId
                            }, {
                                $set: {
                                    isRemovedPost: true
                                }
                            }, {
                                multi: true
                            })
                                .then((res) => {
                                    callback(null);
                                }).catch((err) => {
                                    callback(err);
                                });;
                        }
                    );
                }
            );
        }
    );
};