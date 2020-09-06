/**
 * 게시글 정보 처리 모듈 (첨부 이미지 있는 경우)
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 > - 태그 처리는 아직 X
 * 1. /createPostPlus : 게시글 작성 (첨부 이미지 있는 경우)
 *                      대표 이미지 번호도 파라미터로 보내줘야 함.
 *                  + 유저 board_count + 1
 * 2. /createPostVideo : 게시글 작성 (첨부 영상 있는 경우)
 *                  + 유저 board_count + 1
 * 3. /createPost : 게시글 작성 (글만)
 *                  + 유저 board_count + 1
 * 4. /updatePost : 게시글 수정 (글만)
 * 5. /updatePostImg : 게시글 수정 (대표 이미지 및 이미지 순서 값)
 *
 * @date 2019-11-22
 * @author Hanna
 */

// IMPORT CLOUDINARY CONFIG HERE
var cloud = require("../config/cloudinary_config");
var postAPI = require("./functions/function_posting");

module.exports = function (router) {
    console.log("user_postingPlus 호출됨.");

    // 게시글 작성 (이미지 있는 경우)
    router.route("/createPostPlus").post(cloud.Cloudinary("test_post", "post").array("photo"), function (req, res) {
        console.log("/createPostPlus 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            for (var i = 0; i < req.files.length; i++) {
                console.log(i + "번째 : " + req.files[i].public_id);
                cloud.Remove(req.files[i].public_id, function (err, result) {
                    if (err) {
                        console.error(err);
                        res.status(400).json({
                            isPost: false,
                            errorMsg: '이미지 삭제 오류 (createPostPlus)'
                        });
                        return;
                    }

                    res.status(403).json({
                        isPost: false,
                        errorMsg: '로그인 필요 (createPostPlus)'
                    });
                });
            }
            return;
        } 

        // 파라미터 설정
        var files = [], fileOrder = [], filesLeng = req.files.length; // 이미지들
        var paramID = req.user._id;
        var paramTitle = req.body.title;
        var paramText = (req.body.text)? req.body.text : " ";
        var paramThumbnail = (req.body.thumbnail)? req.body.thumbnail : 0;

        // console.dir(req.files);
        // console.dir(req.body.title);
        // console.dir(req.body.text);
        

        for (var i = 0; i < filesLeng; i++) {
            var photoOne = {
                sequenceId: i,
                cloudUrl: req.files[i].secure_url,
                imageId: req.files[i].public_id
            }
            //console.dir(i + "번째 : " + photoOne);
            files.push(photoOne);
            fileOrder.push(i);
        }

        //console.dir(files);

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.create({
                "writer_id": paramID,
                "content.title": paramTitle,
                "content.text": paramText,
                "content.images": files,
                "content.imageOrder": fileOrder,
                "count.image_count": filesLeng,
                "thumbnail": paramThumbnail
            },
                function (err, post) {
                    if (err) {
                        console.error(err);
                        var msg = setPostErrorMsg(err);
                        res.status(400).json({
                            isPost: false,
                            errorMsg: msg
                        });
                    }

                    if (post) {
                        // 게시글 생성 후, user의 board_count 증가시키기
                        postAPI.updateUserCount(database, true, paramID, function (err, result) {
                            if (err) {
                                console.error("board_count 처리 실패 (create) : " + err.stack);
                                res.status(400).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 오류 (create)"
                                });
                                return;
                            }

                            if (result) {
                                res.status(200).json({
                                    isPost: true
                                });
                            } else {
                                res.status(500).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 실패 (create)"
                                });
                            }
                        });
                    } else {
                        res.status(500).json({
                            isPost: false,
                            errorMsg: "게시글 작성 실패 (create)"
                        });
                    }
                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 게시글 작성 (영상 있는 경우)
    router.route("/createPostVideo").post(cloud.Cloudinary("test_postVideo", "post").single("video"), function (req, res) {
        console.log("/createPostPlus 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            cloud.Remove(req.file.public_id, function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isPost: false,
                        errorMsg: '영상 삭제 오류 (createPostVideo)'
                    });
                    return;
                }

                res.status(403).json({
                    isPost: false,
                    errorMsg: '로그인 필요 (createPostVideo)'
                });
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramTitle = req.body.title;
        var paramText = req.body.text;

        var video = {
            cloudUrl: req.file.secure_url,
            videoId: req.file.public_id
        }
        console.dir("video : " + video);

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.create({
                "writer_id": paramID,
                "content.title": paramTitle,
                "content.text": paramText,
                "content.images": files,
                "count.video_count": 1
            },
                function (err, post) {
                    if (err) {
                        console.error(err);
                        var msg = setPostErrorMsg(err);
                        res.status(400).json({
                            isPost: false,
                            errorMsg: msg
                        });
                    }

                    if (post) {
                        // 게시글 생성 후, user의 board_count 증가시키기
                        postAPI.updateUserCount(database, true, paramID, function (err, result) {
                            if (err) {
                                console.error("board_count 처리 실패 (create) : " + err.stack);
                                res.status(400).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 오류 (create)"
                                });
                                return;
                            }

                            if (result) {
                                res.status(200).json({
                                    isPost: true
                                });
                            } else {
                                res.status(500).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 실패 (create)"
                                });
                            }
                        });
                    } else {
                        res.status(500).json({
                            isPost: false,
                            errorMsg: "게시글 작성 실패 (create)"
                        });
                    }
                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 게시글 작성 (이미지 없는 경우)
    router.route("/createPost").post(function (req, res) {
        console.log("/createPost 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isPost: false,
                errorMsg: "로그인 필요 (createPost)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramTitle = req.body.title;
        var paramText = req.body.text;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.create({
                writer_id: paramID,
                "content.title": paramTitle,
                "content.text": paramText
            },
                function (err, post) {
                    if (err) {
                        console.error(err);
                        var msg = setPostErrorMsg(err);
                        res.status(400).json({
                            isPost: false,
                            errorMsg: msg
                        });
                    }

                    if (post) {
                        // 게시글 생성 후, user의 board_count 증가시키기
                        postAPI.updateUserCount(database, true, paramID, function (err, result) {
                            if (err) {
                                console.error("board_count 처리 실패 (create) : " + err.stack);
                                res.status(400).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 오류 (create)"
                                });
                                return;
                            }

                            if (result) {
                                res.status(200).json({
                                    isPost: true
                                });
                            } else {
                                res.status(500).json({
                                    isPost: false,
                                    errorMsg: "board_count 처리 실패 (create)"
                                });
                            }
                        });
                    } else {
                        res.status(500).json({
                            isPost: false,
                            errorMsg: "게시글 작성 실패 (create)"
                        });
                    }
                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 게시글 수정 (제목, 글만 수정 가능)
    router.route("/updatePost").post(function (req, res) {
        console.log("/updatePost 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isUpdatePost: false,
                errorMsg: "로그인 필요 (updatePost)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPost = {
            postId: req.body.postId,
            title: req.body.title,
            text: req.body.text
        };

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 게시글 작성자 _id와 paramID가 일치하는지 확인하기
            postAPI.checkPostUser(database, paramPost.postId, paramID, function (err, result) {
                // 에러 처리
                if (result < 0) {
                    console.error(err.stack);
                    res.status(400).json({
                        isUpdatePost: false,
                        errorMsg: err.stack
                    });
                } else if (result == 0) {
                    console.error(err);
                    res.status(400).json({
                        isUpdatePost: false,
                        errorMsg: err
                    });
                }
                // 정상적인 접근 (result == 1)
                else {
                    // 일치하면 게시글 수정 진행
                    postAPI.updatePost(database, postAPI.getType().Update, paramPost, function (
                        err,
                        updatedPost
                    ) {
                        // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                        if (err) {
                            console.error("게시글 수정 중 에러 발생");
                            var msg = setPostErrorMsg(err);
                            res.status(400).json({
                                isUpdatePost: false,
                                errorMsg: msg
                            });

                            return;
                        }

                        // 결과 객체 있으면 성공 응답 전송
                        if (updatedPost) {
                            res.status(200).json({
                                isUpdatePost: true
                            });
                        } else {
                            // 결과 객체가 없으면 실패 응답 전송
                            res.status(500).json({
                                isUpdatePost: false,
                                errorMsg: "게시글 수정 실패"
                            });
                        }
                    });
                }
            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isUpdatePost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 게시글 수정 (대표이미지번호 및 이미지 순서 수정 가능)
    router.route("/updatePostImg").post(function (req, res) {
        console.log("/updatePostImg 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isUpdatePost: false,
                errorMsg: "로그인 필요 (updatePostImg)"
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramPost = {
            postId: req.body.postId,
            thumbnail: req.body.thumbnail,
            imageOrder: req.body.imageOrder
        };

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 게시글 작성자 _id와 paramID가 일치하는지 확인하기
            postAPI.checkPostUser(database, paramPost.postId, paramID, function (err, result) {
                // 에러 처리
                if (result < 0) {
                    console.error(err.stack);
                    res.status(400).json({
                        isUpdatePost: false,
                        errorMsg: err.stack
                    });
                } else if (result == 0) {
                    console.error(err);
                    res.status(400).json({
                        isUpdatePost: false,
                        errorMsg: err
                    });
                }
                // 정상적인 접근 (result == 1)
                else {
                    // 일치하면 게시글 수정 진행
                    postAPI.updatePost(database, postAPI.getType().Update, paramPost, function (
                        err,
                        updatedPost
                    ) {
                        // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                        if (err) {
                            console.error("게시글 수정 중 에러 발생");
                            var msg = setPostErrorMsg(err);
                            res.status(400).json({
                                isUpdatePost: false,
                                errorMsg: msg
                            });

                            return;
                        }

                        // 결과 객체 있으면 성공 응답 전송
                        if (updatedPost) {
                            res.status(200).json({
                                isUpdatePost: true
                            });
                        } else {
                            // 결과 객체가 없으면 실패 응답 전송
                            res.status(500).json({
                                isUpdatePost: false,
                                errorMsg: "게시글 수정 실패"
                            });
                        }
                    });
                }
            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isUpdatePost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

}