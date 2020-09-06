/**
 * 게시글 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 > - 이미지 및 태그 처리 X
 * 1. POST /getPosts : 최신 게시글 목록 (비공개 게시글은 불러오지 않음)
 * 2. /getMyPosts/:page : 내 게시글 목록
 * 3. /getPost/:postId : 게시글 조회
 * 4. /flipPostPrivate/:postId/:isPrivate : 게시글 비공개 설정 변경
 *                                     (isPrivate가 1이면 비공개 상태로)
 * 5. /removePost/:postId : 게시글 삭제
 *                  + 유저 board_count - 1
 *
 * @date 2019-11-13
 * @author Hanna
 */

var postAPI = require("./functions/function_posting");

module.exports = function (router) {
    console.log("user_posting 호출됨.");

    // 최근 게시글 목록
    router.route("/getPosts").post(function (req, res) {
        console.log("/getPosts 패스 요청됨.");
        console.log("Cookies : ");
        console.dir(req.cookies);

        // 페이지 조회
        var userId = (req.user) ? req.user._id : null;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }

        var limit = 20;


        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.count({
                    isPrivate: false,
                    created_at: {
                        $lte: lastDate
                    }
                },
                function (err, count) {
                    if (err) {
                        console.error("게시글 페이지 카운팅 에러 : " + err.stack);

                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "게시글 목록 페이지 카운팅 에러"
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

                    database.PostModel.find({
                            isPrivate: false,
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
                        .exec(async function (err, lists) {
                            if (err) {
                                console.error("게시글 목록 조회 에러 : " + err.stack);

                                res.status(400).json({
                                    isGetPost: false,
                                    errorMsg: "게시글 목록 조회 에러"
                                });

                                return;
                            }
                            // console.dir(lists[0]);

                            var postList = [];
                            for (var i = 0; i < lists.length; i++) {

                                if (lists[i].writer_id._id != null){ //유저랑 글정보 미스매치일때 스킵하도록
                                    //null 이 아닐때로 처리해야 함!
                                var postOne = {
                                    _id: lists[i]._id,
                                    w_id: lists[i].writer_id._id,
                                    w_nickname: lists[i].writer_id.nickname,
                                    w_userName: lists[i].writer_id.userName,
                                    w_isBasicImg: lists[i].writer_id.isBasicImg,
                                    w_cloudUrl: null,
                                    like_count: lists[i].count.like_count,
                                    comment_count: lists[i].count.comment_count,
                                    title: lists[i].content.title,
                                    // text부분을  thumnail로 변경해야함!! //??
                                    thumbnail: null,
                                    // text: lists[i].content.text,
                                    created_at: lists[i].created_at,
                                    isLike: false,
                                    isClip: false
                                };
                                if (!lists[i].writer_id.isBasicImg)
                                    postOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;

                                    var numThumbnail = lists[i].thumbnail;
                                    if( numThumbnail >= 0 && lists[i].count.image_count >= numThumbnail){ //정상케이스
                                        // numThumbnail >= 0 //0과 같거나 클때 이미자가 있다.
                                        postOne.thumbnail = lists[i].content.images[numThumbnail].cloudUrl;
                                    }

                                // 로그인되어 있는 경우에 한해
                                // 내가 좋아요, 북마크한 게시글인지 판단
                                if (userId) {
                                    try {
                                        await Promise.all([database.LikePostModel.findOne({
                                                post_id: postOne._id,
                                                user_id: userId
                                            }), database.ClipPostModel.findOne({
                                                post_id: postOne._id,
                                                user_id: userId
                                            })])
                                            .then(values => {
                                                const [res1, res2] = values;
                                                if (res1)
                                                    postOne.isLike = true;
                                                if (res2)
                                                    postOne.isClip = true;
                                            });
                                    } catch (err) {
                                        console.error("게시글 페이지 카운팅 에러 : " + err.stack);

                                        res.status(400).json({
                                            isGetPost: false,
                                            errorMsg: "게시글 목록 조회 에러"
                                        });
                                        return;
                                    }
                                }

                                postList.push(postOne);
                            }
                            }

                            res.status(200).json({
                                isGetPost: true,
                                posts: postList,
                                remainPage: remainPage,
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

    // 내 게시글 목록
    router.route("/getMyPosts/:page").get(function (req, res) {
        console.log("/getMyPosts 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.log("사용자 인증 안된 상태임.");
            res.status(403).json({
                isGetPost: false,
                errorMsg: "로그인 필요 (getMyPosts)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;

        // 페이지 조회
        var page = Math.max(1, req.params.page);
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.count({
                    writer_id: paramID
                },
                function (err, count) {
                    if (err) {
                        console.error("내 게시글 페이지 카운팅 에러 : " + err.stack);

                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "내 게시글 목록 페이지 카운팅 에러"
                        });

                        return;
                    }

                    var skip = (page - 1) * limit;
                    var maxPage = Math.ceil(count / limit);

                    if (!count || count < 1) {
                        //console.log("내 게시글 Count : " + count);
                        res.status(200).json({
                            isGetPost: true,
                            posts: null,
                            user: null,
                            page: page,
                            maxPage: maxPage,
                            totalNum: 0
                        });

                        return;
                    }

                    if (page > maxPage) {
                        //console.log("페이지 초과 (" + page + ">" + maxPage + ")");
                        res.status(200).json({
                            isGetPost: true,
                            posts: null,
                            user: null,
                            page: page,
                            maxPage: maxPage,
                            totalNum: count
                        });

                        return;
                    }

                    database.PostModel.find({
                            writer_id: paramID
                        })
                        .sort("-created_at")
                        .skip(skip)
                        .limit(limit)
                        .exec(async function (err, lists) {
                            if (err) {
                                res.status(400).json({
                                    isGetPost: false,
                                    errorMsg: "내 게시글 목록 조회 에러"
                                });
                                return;
                            }

                            if (!lists) {
                                // 작성 게시글이 없는 경우
                                res.status(200).json({
                                    isGetPost: true,
                                    posts: null,
                                    user: null,
                                    page: page,
                                    maxPage: maxPage,
                                    totalNum: count
                                });
                            } else {

                                var postList = [];
                                for (var i = 0; i < lists.length; i++) {
                                    var postOne = {
                                        _id: lists[i]._id,
                                        like_count: lists[i].count.like_count,
                                        comment_count: lists[i].count.comment_count,
                                        title: lists[i].content.title,
                                        thumbnail: null,
                                        // text: lists[i].content.text,
                                        created_at: lists[i].created_at,
                                        isLike: false,
                                        isClip: false
                                    };
                                    // if (!lists[i].writer_id.isBasicImg)
                                    // postOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;

                                    var numThumbnail = lists[i].thumbnail;
                                    if( numThumbnail >= 0 && lists[i].count.image_count >= numThumbnail){ //정상케이스
                                        // numThumbnail >= 0 //0과 같거나 클때 이미자가 있다.
                                        postOne.thumbnail = lists[i].content.images[numThumbnail].cloudUrl;
                                    }

                                    // 내가 좋아요, 북마크한 게시글인지 판단
                                    try {
                                        await Promise.all([database.LikePostModel.findOne({
                                                post_id: postOne._id,
                                                user_id: paramID
                                            }), database.ClipPostModel.findOne({
                                                post_id: postOne._id,
                                                user_id: paramID
                                            })])
                                            .then(values => {
                                                const [res1, res2] = values;
                                                if (res1)
                                                    postOne.isLike = true;
                                                if (res2)
                                                    postOne.isClip = true;
                                            });
                                    } catch (err) {
                                        console.error("내 게시글 페이지 카운팅 에러 : " + err.stack);

                                        res.status(400).json({
                                            isGetPost: false,
                                            errorMsg: "내 게시글 목록 - 유저 정보 조회 에러"
                                        });
                                        return;
                                    }
                                    postList.push(postOne);
                                }

                                // 해당 유저 정보도 같이
                                // update하는 이유는 데이터베이스 상에서 게시글 삭제한 경우와 같이
                                // 실제 게시글 수와 user 데이터 상의 게시글 수가 달라지는 경우가 있어서
                                // 안전장치 느낌으로 넣어놓음.
                                database.UserModel.findOneAndUpdate({
                                        _id: paramID
                                    }, {
                                        "count.board_count": count
                                    }, {
                                        new: true
                                    },
                                    function (err, user) {
                                        if (err) {
                                            res.status(400).json({
                                                isGetPost: false,
                                                errorMsg: "내 게시글 목록 - 유저 정보 조회 에러"
                                            });
                                            return;
                                        }

                                        if (!user) {
                                            var thisUser = {
                                                userName: "(None)",
                                                nickname: "(None)",
                                                isBasicImg: true,
                                                userImg: null
                                            };
                                            res.status(200).json({
                                                isGetPost: true,
                                                posts: postList,
                                                user: thisUser,
                                                page: page,
                                                maxPage: maxPage,
                                                totalNum: count
                                            });
                                        } else {
                                            var thisUser = {
                                                _id: user._id,
                                                userName: user.userName,
                                                nickname: user.nickname,
                                                isBasicImg: user.isBasicImg,
                                                cloudUrl: user.userImg.cloudUrl
                                            };
                                            res.status(200).json({
                                                isGetPost: true,
                                                posts: postList,
                                                user: thisUser,
                                                page: page,
                                                maxPage: maxPage,
                                                totalNum: count
                                            });
                                        }
                                    }
                                );
                            }
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

    // 게시글 조회
    router.route("/getPost/:postId").get(function (req, res) {
        console.log("/getPost 패스 요청됨.");

        // 파라미터 설정
        var userId = (req.user) ? req.user._id : null;
        var paramPostId = req.params.postId;
        if (!paramPostId) {
            res.status(403).json({
                isGetPost: false,
                errorMsg: "파라미터 필요 (getPost)"
            });
            return;
        }

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.findOne({
                    _id: paramPostId
                })
                .populate({
                    path: "writer_id",
                    select: ["userName", "nickname", "isBasicImg", "userImg"]
                })
                .exec(async function (err, post) {
                    if (err) {
                        console.error("게시글 조회 에러 : " + err.stack);

                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "게시글 조회 에러 (getPost)"
                        });

                        return;
                    }

                    if (!post) {
                        res.status(400).json({
                            isGetPost: false,
                            errorMsg: "삭제된 게시글입니다."
                        });
                    } else {

                        var postOne = {
                            _id: post._id,
                            w_id: post.writer_id._id,
                            w_nickname: post.writer_id.nickname,
                            w_userName: post.writer_id.userName,
                            w_isBasicImg: post.writer_id.isBasicImg,
                            w_cloudUrl: null,
                            like_count: post.count.like_count,
                            comment_count: post.count.comment_count,
                            title: post.content.title,
                            images: [], //링크배열
                            text: post.content.text,
                            created_at: post.created_at,
                            isLike: false,
                            isClip: false,
                            isMyPost: false
                        };
                        // for문 길이는 post.count.image_count 
                        // image for문, push(post.content.images[i].cloudUrl)
                        //여기는 postOne[i]가 아닌데 바로 넣는게 나은지 리스트로 푸시하는게 나은지??
                        //sky 이미지 리스트 추가
                        var postImgList = [];
                        for(var i=0;i<post.count.image_count;i++){
                                postImgList[i] = post.content.images[i].cloudUrl
                                postOne.images.push(postImgList);
                            }
                        }
                        //postOne.images = postImgList;
                        /* */

                        if (!post.writer_id.isBasicImg)
                            postOne.w_cloudUrl = post.writer_id.userImg.cloudUrl;
                        if (postOne.w_id == userId) {
                            postOne.isMyPost = true;
                        }

                        // 로그인되어 있는 경우에 한해
                        // 내가 좋아요, 북마크한 게시글인지 판단
                        if (userId) {
                            try {
                                await Promise.all([database.LikePostModel.findOne({
                                        post_id: postOne._id,
                                        user_id: userId
                                    }), database.ClipPostModel.findOne({
                                        post_id: postOne._id,
                                        user_id: userId
                                    })])
                                    .then(values => {
                                        const [res1, res2] = values;
                                        if (res1)
                                            postOne.isLike = true;
                                        if (res2)
                                            postOne.isClip = true;
                                    });
                            } catch (err) {
                                console.error("게시글 조회 에러 : " + err.stack);

                                res.status(400).json({
                                    isGetPost: false,
                                    errorMsg: "게시글 목록 조회 에러"
                                });
                                return;
                            }
                        }

                        res.status(200).json({
                            isGetPost: true,
                            post: postOne
                        });
                });
        
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isGetPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 내 게시글 비공개 설정
    router.route("/flipPostPrivate/:postId/:isPrivate").get(function (req, res) {
        console.log("/flipPostPrivate/:postId 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.log("사용자 인증 안된 상태임.");
            res.status(403).json({
                isSetPost: false,
                errorMsg: "로그인 필요 (flipPostPrivate)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPostId = req.params.postId;
        var paramPrivate = (req.params.isPrivate == 1) ? true : false;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            postAPI.checkPostUser(database, paramPostId, paramID, function (err, result) {
                // 에러 처리
                if (result < 0) {
                    console.error(err.stack);
                    res.status(400).json({
                        isSetPost: false,
                        errorMsg: err.stack
                    });
                } else if (result == 0) {
                    console.error(err);
                    res.status(400).json({
                        isSetPost: false,
                        errorMsg: err
                    });
                }
                // 정상적인 접근 (result == 1) 
                else {

                    var paramPost = {
                        isSetPost: paramPostId,
                        isPrivate: paramPrivate
                    }

                    // 일치하면 게시글 비공개 상태 수정
                    postAPI.updatePost(database, postAPI.getType().Private, paramPost, function (err, result) {

                        if (err) {
                            console.error(err.stack);
                            res.status(400).json({
                                isSetPost: false,
                                errorMsg: err.stack
                            });

                            return;
                        }

                        if (!result) {
                            res.status(400).json({
                                isSetPost: false,
                                errorMsg: "잘못된 게시글입니다."
                            });
                        } else {
                            res.status(200).json({
                                isSetPost: true,
                                isPrivate: result.isPrivate
                            });
                        }

                    });

                }
            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isSetPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 게시글 삭제 (이미지 없는 경우)
    router.route("/removePost/:postId").get(function (req, res) {
        console.log("/removePost/:postId 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.log("사용자 인증 안된 상태임.");
            res.status(403).json({
                isDeletePost: false,
                errorMsg: "로그인 필요 (removePost)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPostId = req.params.postId;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 게시글 작성자 _id와 paramID가 일치하는지 확인하기
            postAPI.checkPostUser(database, paramPostId, paramID, function (err, result) {
                // 에러 처리
                if (result < 0) {
                    console.error(err.stack);
                    res.status(400).json({
                        isDeletePost: false,
                        errorMsg: err.stack
                    });
                } else if (result == 0) {
                    console.error(err);
                    res.status(400).json({
                        isDeletePost: false,
                        errorMsg: err
                    });
                }
                // 정상적인 접근 (result == 1)
                else {
                    // 일치하면 게시글 삭제 진행
                    postAPI.removeMentPost(database, paramPostId, function (err) {
                        if (err) {
                            console.error("게시글 삭제 중 에러 발생 : " + err.stack);
                            res.status(400).json({
                                isDeletePost: false,
                                errorMsg: "게시글 삭제 실패"
                            });
                            return;
                        }

                        // 게시글 삭제 후, user의 board_count 감소시키기
                        postAPI.updateUserCount(database, false, paramID, function (err, result) {
                            if (err) {
                                console.error("board_count 처리 실패 (delete) : " + err.stack);
                                res.status(400).json({
                                    isDeletePost: false,
                                    errorMsg: "board_count 처리 오류 (delete)"
                                });
                                return;
                            }

                            if (result) {
                                res.status(200).json({
                                    isDeletePost: true
                                });
                            } else {
                                res.status(500).json({
                                    isDeletePost: false,
                                    errorMsg: "board_count 처리 실패 (delete)"
                                });
                            }
                        });
                    });
                }
            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isDeletePost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });
};