/**
 * 좋아요 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /flipClip/:postId/:postWriter : 북마크 표기
 * 2. /getMyClips : 내 북마크 목록 조회 (page, lastDate 필요)
 * 
 * < function 목록>
 * 1. setClip(database, objectID, writerId, userID, callback)
 *      : 북마크 설정 및 해제
 *
 * @date 2019-11-13
 * @author Hanna
 */

module.exports = function (router) {
    console.log("user_clip 호출됨.");

    // 북마크 표기
    router.route("/flipClip/:postId/:postWriter").get(function (req, res) {
        console.log("/flipClip/:postId 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isClipPost: false,
                errorMsg: "로그인 필요 (flipClip)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPostId = req.params.postId;
        var paramWriterId = req.params.postWriter;

        if (!paramPostId) {
            res.status(403).json({
                isClipPost: false,
                errorMsg: "파라미터 필요 (flipClip)"
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        if (database.db) {
            // 좋아요 or 북마크 설정/해제
            setClip(database, paramPostId, paramWriterId, paramID, function (err, isAdd) {
                // 에러 처리
                if (err) {
                    console.error(err.stack);
                    res.status(400).json({
                        isClipPost: false,
                        errorMsg: err.stack
                    });
                    return;
                }

                var keyword = "> 북마크";
                if (isAdd) {
                    keyword = keyword + " 설정";
                } else {
                    keyword = keyword + " 해제";
                }
                console.log(keyword);
                res.status(200).json({
                    isClipPost: true,
                    status: isAdd ? 1 : 0,
                });

            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isClipPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 내 북마크 목록
    router.route("/getMyClips").post(function (req, res) {
        console.log("/getMyClips 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isGetPost: false,
                errorMsg: "로그인 필요 (getMyClips)"
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

        var limit = 10;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        if (database.db) {

            database.ClipPostModel.count({
                user_id: userId,
                created_at: {
                    $lte: lastDate
                }
            },
                function (err, count) {
                    if (err) {
                        console.error("북마크 페이지 카운팅 에러 : " + err.stack);

                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "북마크 목록 페이지 카운팅 에러"
                        });

                        return;
                    }

                    var skip = (page == 1) ? 0 : 1;
                    var remainPage = Math.ceil((count - skip) / limit);

                    if (!count || count < 1 || (page != 1 && count <= 1)) {
                        res.status(200).json({
                            isGetPost: true,
                            posts: null,
                            remainPage: remainPage,
                            totalNum: 0
                        });

                        return;
                    }

                    database.ClipPostModel.find({
                        user_id: userId,
                        created_at: {
                            $lte: lastDate
                        }
                    })
                        .populate({
                            path: "writer_id",
                            select: ["_id", "nickname", "userName", "isBasicImg", "userImg"]
                        })
                        .sort("-created_at")
                        .skip(skip)
                        .limit(limit)
                        .exec(function (err, clipLists) {
                            if (err) {
                                console.error("북마크 목록 조회 에러 : " + err.stack);

                                res.status(400).json({
                                    isGetPost: false,
                                    errorMsg: "북마크 목록 조회 에러"
                                });

                                return;
                            }

                            // 삭제되지 않은 게시글에 한해 게시글 내용 조회해 올거임.
                            var postIdList = [];
                            for (var i = 0; i < clipLists.length; i++) {
                                if (!clipLists[i].isRemovedPost) {
                                    postIdList.push(clipLists[i].post_id);
                                }
                            }

                            database.PostModel.find({
                                _id: {
                                    $in: postIdList
                                }
                            })
                                .exec(async function (err, postLists) {

                                    if (err) {
                                        console.error("북마크 목록 조회 에러 : " + err.stack);

                                        res.status(400).json({
                                            isGetPost: false,
                                            errorMsg: "북마크 목록 조회 에러"
                                        });

                                        return;
                                    }

                                    // index 매칭
                                    var order = [];
                                    for (var i = 0; i < clipLists.length; i++) {
                                        // 삭제된 게시글이 아닐 때
                                        if (!clipLists[i].isRemovedPost) {
                                            for (var j = 0; j < postLists.length; j++) {
                                                if (clipLists[i].post_id.equals(postLists[j]._id)) {
                                                    order.push(j);
                                                    break;
                                                }
                                            }
                                        }
                                        // 삭제된 게시글일 때
                                        else {
                                            order.push(-1);
                                        }
                                    }

                                    // 게시글 내용 붙여 결과 보내기
                                    var postList = [];
                                    for (var i = 0; i < clipLists.length; i++) {
                                        var postOne = {
                                            _id: clipLists[i].post_id,
                                            w_id: clipLists[i].writer_id._id,
                                            w_nickname: clipLists[i].writer_id.nickname,
                                            w_userName: clipLists[i].writer_id.userName,
                                            w_isBasicImg: clipLists[i].writer_id.isBasicImg,
                                            w_cloudUrl: null,
                                            like_count: 0,
                                            comment_count: 0,
                                            title: "삭제된 게시글입니다.",
                                            thumbnail: null,
                                            created_at: null,
                                            clip_at: clipLists[i].created_at,
                                            isLike: false
                                        };
                                        if (!clipLists[i].writer_id.isBasicImg)
                                            postOne.w_cloudUrl = clipLists[i].writer_id.userImg.cloudUrl;

                                        // 삭제된 게시글이 아니라면 불러온 게시글 내용 붙이기
                                        // 북마크리스트랑 게시글리스트가 따로 있어서, 연결해주는 부분. 최종결과물이 postOne
                                        if (!clipLists[i].isRemovedPost) {
                                            var tempi = order[i];
                                            postOne.like_count = postLists[tempi].count.like_count;
                                            postOne.comment_count = postLists[tempi].count.comment_count;
                                            postOne.title = postLists[tempi].content.title;
                                            var numThumbnail = postLists[tempi].thumbnail;
                                            if( numThumbnail >= 0 && postLists[tempi].count.image_count >= numThumbnail){ //정상케이스
                                                postOne.thumbnail = postLists[tempi].content.images[numThumbnail].cloudUrl;
                                            }
                                            //postOne.text = postLists[tempi].content.text;
                                            postOne.created_at = postLists[tempi].created_at;
                                            // 좋아요 여부도 붙이기
                                            try {
                                                await database.LikePostModel.findOne({
                                                    post_id: postOne._id,
                                                    user_id: userId
                                                }).then((res) => {
                                                    if (res)
                                                        postOne.isLike = true;
                                                });
                                            } catch (err) {
                                                console.error("북마크 목록 조회 에러 : " + err.stack);

                                                res.status(400).json({
                                                    isGetPost: false,
                                                    errorMsg: "북마크 목록 조회 에러"
                                                });
                                            }
                                        }
                                        postList.push(postOne);
                                    }
                                    res.status(200).json({
                                        isGetPost: true,
                                        posts: postList,
                                        remainPage: remainPage,
                                        totalNum: count
                                    });
                                });
                        });
                }
            );

        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });
};

// 북마크 설정 및 해제
var setClip = function (database, objectID, writerId, userID, callback) {

    // 북마크 되있는지 확인
    var conditions = {
        "post_id": objectID,
        "user_id": userID
    };
    database.ClipPostModel.findOne(conditions)
        .then((res1) => {
            // 만약 북마크 안되어있는 상태면
            if (!res1) {
                conditions = {
                    "writer_id": writerId,
                    "post_id": objectID,
                    "user_id": userID
                };
                database.ClipPostModel.create(conditions)
                    .then((res2) => {
                        callback(null, true);
                    }).catch((err) => {
                        callback(err, null);
                    });
            }
            // 되어있는 상태면
            else {
                database.ClipPostModel.findOneAndRemove(conditions)
                    .then((res2) => {
                        callback(null, false);
                    }).catch((err) => {
                        callback(err, null);
                    });
            }
        }).catch((err) => {
            callback(err, null);
        });
}

/* 내 북마크 목록 (하나의 테이블 내의 배열로써 북마크 목록이 존재할 때)
    router.route("/getMyClips/:page").get(function (req, res) {
        console.log("/getMyClips 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.log("사용자 인증 안된 상태임.");
            res.status(403).json({
                isGetPost: false,
                errorMsg: "로그인 필요 (getMyClips)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;

        // 페이지 조회
        var page = Math.max(1, req.params.page);
        var limit = 10;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        if (database.db) {
            database.UserTraceModel.findOne({
                    user_id: paramID
                }, {
                    clip_id: 1
                },
                function (err, result) {
                    if (err) {
                        console.error("북마크 목록 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "북마크 목록 조회 에러"
                        });

                        return;
                    }

                    var count = result.clip_id.post_id.length;
                    var skip = (page - 1) * limit;
                    var maxPage = Math.ceil(count / limit);
                    var final = skip + limit;
                    if (final > count) final = count;

                    if (!count || count < 1) {
                        console.log("북마크 Count : " + count);
                        res.status(200).json({
                            isGetPost: true,
                            posts: null,
                            page: page,
                            maxPage: maxPage,
                            totalNum: 0
                        });

                        return;
                    }

                    if (page > maxPage) {
                        console.log("페이지 초과 (" + page + ">" + maxPage + ")");
                        res.status(200).json({
                            isGetPost: true,
                            posts: null,
                            page: page,
                            maxPage: maxPage,
                            totalNum: count
                        });

                        return;
                    }

                    var postIdList = result.clip_id.post_id.slice(skip, final);

                    database.PostModel.find({
                            _id: {
                                $in: postIdList
                            }
                        })
                        .populate({
                            path: "writer_id",
                            select: ["nickname", "userName", "isBasicImg", "userImg"]
                        })
                        .exec(function (err, lists) {
                            if (err) {
                                res.status(400).json({
                                    isGetPost: false,
                                    errorMsg: "북마크 목록 조회 에러"
                                });
                                return;
                            }

                            var postList = [];
                            for (var i = 0; i < lists.length; i++) {
                                var postOne = {
                                    _id: lists[i]._id,
                                    w_nickname: lists[i].writer_id.nickname,
                                    w_userName: lists[i].writer_id.userName,
                                    w_isBasicImg: lists[i].writer_id.isBasicImg,
                                    w_cloudUrl: null,
                                    like_count: lists[i].count.like_count,
                                    comment_count: lists[i].count.comment_count,
                                    title: lists[i].content.title,
                                    text: lists[i].content.text,
                                    created_at: lists[i].created_at
                                };
                                if (!lists[i].writer_id.isBasicImg)
                                    postOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;
                                postList.push(postOne);
                            }

                            res.status(200).json({
                                isGetPost: true,
                                posts: postList,
                                page: page,
                                maxPage: maxPage,
                                totalNum: count
                            });
                        });
                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });
*/

/* 북마크 여부에 따른 userTrace 정보 수정 (하나의 테이블 내의 배열로써 북마크 목록이 존재할 때)
var setClip = function (database, objectID, userID, callback) {
    console.log("setClip 호출됨.");

    var conditions = {
        user_id: userID
    };
    var data;
    var isAdd;
    var options = {
        new: true
    };

    // 해당 게시글 정보 반환
    getUserTrace(database, objectID, userID, function (err, result) {
        if (err) {
            callback(err, null, null);
        }

        // 북마크 돼있으면 북마크 해제, 안돼있으면 북마크 설정
        if (result < 0) {
            data = {
                $push: {
                    "clip_id.post_id": [objectID]
                }
            };
            isAdd = true;
            console.log("> Post Clip ++");
        } else {
            data = {
                $pull: {
                    "clip_id.post_id": {
                        $in: [objectID]
                    }
                }
            };
            isAdd = false;
            console.log("> Post Clip --");
        }

        // 정보 업데이트
        database.UserTraceModel.findOneAndUpdate(conditions, data, options,
            function (err, res) {
                if (err) {
                    callback(err, null, null);
                }
                callback(null, true, isAdd);
            }
        );

    });
};

// 해당 유저 trace 정보 접근 후, 북마크 여부 반환
var getUserTrace = function (database, objectID, userID, callback) {
    console.log("getUserTrace 호출됨.");

    // 해당 유저 trace 정보 반환
    database.UserTraceModel.findOne(
        {
            user_id: userID
        },
        function (err, result) {
            // 에러 처리
            if (err) {
                callback(err, null);
                return;
            }

            if (!result) {
                // 없으면 새로 만듬
                database.UserTraceModel.create(
                    {
                        user_id: userID
                    },
                    function (err, trace) {
                        if (err) {
                            callback(err, null);
                            return;
                        }

                        if (!trace) {
                            callback("userTrace 데이터 생성 오류", null);
                        } else {
                            callback(null, -1);
                        }
                    }
                );
            } else {
                // true면 해당 index 반환. false면 -1 반환.
                var index;
                // 해당 북마크 여부 반환 (게시글)
                index = result.clip_id.post_id.indexOf(objectID);
                callback(null, index);
            }
        }
    );
};*/