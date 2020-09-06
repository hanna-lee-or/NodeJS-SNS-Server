/**
 * 사용자 정보 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /modifyUserPlus : 프로필 수정 (프로필 이미지 수정하는 경우)
 *                 + 비로그인 시 업로드 진행된 이미지 삭제
 * 2. /modifyUser : 프로필 수정 (프로필 이미지 수정 안하거나 기본 프로필 설정 시)
 * 3. /checkUserName/:name : 아이디(이름) 중복 체크
 * 4. /modifyNotice : 알림 설정, 이메일 수신 동의 여부 수정
 * 5. /SignUp : 회원가입 - 수정해야 됨. (11/13 : 아직 안함)
 *
 * @date 2019-11-13
 * @author Hanna
 */

// IMPORT CLOUDINARY CONFIG HERE
var cloud = require('../config/cloudinary_config');
var profileAPI = require('./functions/function_profile');

module.exports = function (router) {
    console.log('user_profile 호출됨.');

    // 프로필 수정 (프로필 이미지 수정하는 경우)
    router.route('/modifyUserPlus').post(cloud.Cloudinary("test_profile", "thumbnail").single("photo"), function (req, res) {
        console.log('/updateImg 패스 요청됨.');

        // 보내오는 파일이 없는 경우
        if (!req.file) {
            console.log(err);
            res.status(400).json({
                isProfileImg: false,
                errorMsg: '이미지 없음 (updateImg)'
            });
            return;
        }

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            cloud.Remove(req.file.public_id, function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isProfileImg: false,
                        errorMsg: '이미지 삭제 오류 (updateImg)'
                    });
                    return;
                }

                res.status(403).json({
                    isProfileImg: false,
                    errorMsg: '로그인 필요 (updateImg)'
                });
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramImg = {
            imageName: req.file.originalname,
            cloudUrl: req.file.secure_url,
            imageId: req.file.public_id
        }

        var paramUser = {
            userName: req.body.name,
            nickname: req.body.nickname,
            userInfo: req.body.info,
            isBasicImg: false,
            userImg: paramImg
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 기존 프로필 이미지 아이디 찾음.
            profileAPI.getUserData(database, paramID, function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isProfileImg: false,
                        errorMsg: '이미지 아이디 찾기 오류 (isProfileImg)'
                    });
                    return;
                }

                // 기본 프로필 이미지인 경우
                if (result.isBasicImg) {
                    // 삭제 완료 후, 새로운 프로필 이미지 정보 넘기기
                    profileAPI.updateUser(database, profileAPI.getType().ProfileImg, paramID, paramUser, function (err, updatedUser) {
                        // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                        if (err) {
                            console.error('프로필 이미지 수정 중 에러 발생');

                            res.status(400).json({
                                isProfileImg: false,
                                errorMsg: err.stack
                            });

                            return;
                        }

                        // 결과 객체 있으면 성공 응답 전송
                        if (updatedUser) {
                            res.status(200).json({
                                isProfileImg: true
                            })
                        } else { // 결과 객체가 없으면 실패 응답 전송
                            res.status(500).json({
                                isProfileImg: false,
                                errorMsg: "프로필 이미지 수정 실패"
                            });
                        }
                    });
                }
                
                // 기존 프로필 이미지가 있는 경우
                else {
                    // cloudinary 상의 해당 프로필 사진 삭제
                    cloud.Remove(result.userImg.imageId, function (err, result) {
                        if (err) {
                            console.error(err);
                            res.status(400).json({
                                isProfileImg: false,
                                errorMsg: '이미지 삭제 오류 (isProfileImg)'
                            });
                            return;
                        }

                        // 삭제 완료 후, 새로운 프로필 이미지 정보 넘기기
                        profileAPI.updateUser(database, profileAPI.getType().ProfileImg, paramID, paramUser, function (err, updatedUser) {
                            // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                            if (err) {
                                console.error('프로필 이미지 수정 중 에러 발생');

                                res.status(400).json({
                                    isProfileImg: false,
                                    errorMsg: err.stack
                                });

                                return;
                            }

                            // 결과 객체 있으면 성공 응답 전송
                            if (updatedUser) {
                                res.status(200).json({
                                    isProfileImg: true
                                })
                            } else { // 결과 객체가 없으면 실패 응답 전송
                                res.status(500).json({
                                    isProfileImg: false,
                                    errorMsg: "프로필 이미지 수정 실패"
                                });
                            }
                        });
                    });
                }
            });
        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isProfileImg: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });

    // 프로필 수정 (프로필 이미지 수정 안하거나 기본 프로필 설정 시)
    router.route('/modifyUser').post(function (req, res) {
        console.log('/modifyUser 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isUpdateUser: false,
                errorMsg: '로그인 필요 (modifyUser)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramIsBasicImg = req.body.isBasicImg;
        var paramUser = {
            userName: req.body.name,
            nickname: req.body.nickname,
            userInfo: req.body.info
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 수정 시, 기본 프로필 이미지 설정을 했다면
            if (paramIsBasicImg) {
                profileAPI.getUserData(database, paramID, function (err, result) {
                    if (err) {
                        console.error(err);
                        res.status(400).json({
                            isUpdateUser: false,
                            errorMsg: '이미지 아이디 찾기 오류 (setBasicImg)'
                        });
                        return;
                    }

                    // 이미 기본 이미지일 경우
                    if (result.isBasicImg) {
                        profileAPI.updateUser(database, profileAPI.getType().Update, paramID, paramUser, function (err, updatedUser) {
                            // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                            if (err) {
                                console.error('프로필 수정 중 에러 발생');

                                var msg = setProfileErrorMsg(err);
                                res.status(400).json({
                                    isUpdateUser: false,
                                    errorMsg: msg
                                });

                                return;
                            }

                            // 결과 객체 있으면 성공 응답 전송
                            if (updatedUser) {
                                res.status(200).json({
                                    isUpdateUser: true
                                })
                            } else { // 결과 객체가 없으면 실패 응답 전송
                                res.status(500).json({
                                    isUpdateUser: false,
                                    errorMsg: "아이디(이름) 수정 실패"
                                });
                            }
                        });
                        return;
                    }

                    // cloudinary 상의 해당 프로필 사진 삭제
                    cloud.Remove(result.userImg.imageId, function (err, result) {
                        if (err) {
                            console.error(err);
                            res.status(400).json({
                                isUpdateUser: false,
                                errorMsg: '이미지 삭제 오류 (setBasicImg)'
                            });
                            return;
                        }

                        profileAPI.updateUser(database, profileAPI.getType().UpdateBasic, paramID, paramUser, function (err, updatedUser) {
                            // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                            if (err) {
                                console.error('프로필 수정 중 에러 발생');

                                var msg = setProfileErrorMsg(err);
                                res.status(400).json({
                                    isUpdateUser: false,
                                    errorMsg: msg
                                });

                                return;
                            }

                            // 결과 객체 있으면 성공 응답 전송
                            if (updatedUser) {
                                res.status(200).json({
                                    isUpdateUser: true
                                })
                            } else { // 결과 객체가 없으면 실패 응답 전송
                                res.status(500).json({
                                    isUpdateUser: false,
                                    errorMsg: "아이디(이름) 수정 실패"
                                });
                            }
                        });
                    });
                });
            }
            else {
                profileAPI.updateUser(database, profileAPI.getType().Update, paramID, paramUser, function (err, updatedUser) {
                    // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                    if (err) {
                        console.error('프로필 수정 중 에러 발생');

                        var msg = setProfileErrorMsg(err);
                        res.status(400).json({
                            isUpdateUser: false,
                            errorMsg: msg
                        });

                        return;
                    }

                    // 결과 객체 있으면 성공 응답 전송
                    if (updatedUser) {
                        res.status(200).json({
                            isUpdateUser: true
                        })
                    } else { // 결과 객체가 없으면 실패 응답 전송
                        res.status(500).json({
                            isUpdateUser: false,
                            errorMsg: "아이디(이름) 수정 실패"
                        });
                    }
                });
            }
        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isUpdateUser: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 알림설정, 이메일 수신 동의 여부 수정
    router.route('/modifyNotice').post(function (req, res) {
        console.log('/modifyNotice 패스 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            res.status(403).json({
                isModifyNotice: false,
                errorMsg: '로그인 필요 (modifyNotice)'
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramUser = {
            paramPushNotice: (req.body.pushNotice) == '1',
            paramEmailNotice: (req.body.emailNotice) == '1'
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            profileAPI.updateUser(database, profileAPI.getType().Notice, paramID, paramUser, function (err, updatedUser) {
                // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                if (err) {
                    console.error('설정 수정 중 에러 발생');

                    var msg = setProfileErrorMsg(err);
                    res.status(400).json({
                        isModifyNotice: false,
                        errorMsg: msg
                    });

                    return;
                }

                // 결과 객체 있으면 성공 응답 전송
                if (updatedUser) {
                    res.status(200).json({
                        isModifyNotice: true
                    })
                } else { // 결과 객체가 없으면 실패 응답 전송
                    res.status(500).json({
                        isModifyNotice: false,
                        errorMsg: "설정 수정 수정 실패"
                    });
                }
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isModifyNotice: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 프로필 아이디(이름) 중복 체크 (검색용은 따로 만들어야 함.)
    router.route('/checkUserName/:name').get(function (req, res) {
        console.log('/checkUserName 패스 요청됨.');

        var paramID = req.user._id;
        var paramName = req.params.name;
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            profileAPI.checkUserName(database, paramID, paramName, function (err, result) {
                if (err) {
                    console.error("아이디(이름) 조회 중 에러 발생 : " + err.stack);
                    res.status(400).json({
                        isCheck: false,
                        errorMsg: "아이디(이름) 조회 실패"
                    });
                    return;
                }

                // 해당 아이디(이름)이 이미 데베상에 존재하는지 여부 반환
                if (result) {
                    res.status(200).json({
                        isCheck: true,
                        isExist: true
                    });
                } else {
                    res.status(200).json({
                        isCheck: true,
                        isExist: false
                    });
                }
            });

        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isCheck: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // // 회원가입 - 수정해야 됨. (11/13 : 아직 안함)
    // router.route('/SignUp').post(function (req, res) {
    //     console.log('/SignUp 패스 요청됨.');

    //     // 인증 안된 경우
    //     if (!req.user) {
    //         console.error('사용자 인증 안된 상태임.');
    //         res.status(403).json({
    //             isSignUp: false,
    //             errorMsg: '로그인 필요 (CreateUser)'
    //         });
    //         return;
    //     }
    //     // 약관 동의 안한 경우
    //     var thisAgree = (req.body.isAgree) == '1';
    //     if (!thisAgree) {
    //         console.log('약관 동의 안된 상태임.');
    //         res.status(400).json({
    //             isSignUp: false,
    //             errorMsg: '약관동의 필요 (CreateUser)'
    //         });
    //         return;
    //     }

    //     // 파라미터 설정
    //     var paramID = req.user._id;
    //     var paramUser = {
    //         paramName: req.body.name,
    //         paramNickname: req.body.nickname,
    //         paramInfo: req.body.info,
    //         // paramImg = req.body.img || req.query.img;
    //         paramPushNotice: (req.body.pushNotice) == '1',
    //         paramEmailNotice: (req.body.emailNotice) == '1',
    //         paramAgree: thisAgree
    //     }

    //     // 데이터베이스 객체 참조
    //     var database = req.app.get('database');

    //     // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
    //     if (database.db) {
    //         profileAPI.updateUser(database, profileAPI.getType().Create, paramID, paramUser, function (err, updatedUser) {
    //             // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
    //             if (err) {
    //                 console.error('아이디(이름) 수정 중 에러 발생');

    //                 var msg = setProfileErrorMsg(err);
    //                 res.status(400).json({
    //                     isSignUp: false,
    //                     errorMsg: msg
    //                 });

    //                 return;
    //             }

    //             // 결과 객체 있으면 성공 응답 전송
    //             if (updatedUser) {
    //                 res.status(200).json({
    //                     isSignUp: true
    //                 })
    //             } else { // 결과 객체가 없으면 실패 응답 전송
    //                 res.status(500).json({
    //                     isSignUp: false,
    //                     errorMsg: "회원가입 실패"
    //                 });
    //             }
    //         });

    //     } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    //         res.status(500).json({
    //             isSignUp: false,
    //             errorMsg: "데이터베이스 연결 실패"
    //         });
    //     }
    // });

}