/**
 * 스튜디오 홈 배경화면 이미지 처리 모듈
 * 
 * <router 목록>
 * 1. /modifyBackImg : 프로필 배경화면 이미지 수정
 */

 // IMPORT CLOUDINARY CONFIG HERE
var cloud = require('../config/cloudinary_config');
var profileAPI = require('./functions/function_profile');

module.exports = function (router) {
    console.log('new_backImg 호출됨.');

    // 프로필 수정 (프로필 이미지 수정하는 경우)
    router.route('/modifyBackImg').post(cloud.Cloudinary("test_back", "background").single("photo"), function (req, res) {
        console.log('/updateBackImg 패스 요청됨.');

        // 보내오는 파일이 없는 경우
        if (!req.file) {
            console.log(err);
            res.status(400).json({
                isBackgroundImg: false,
                errorMsg: '배경화면 이미지 없음 (updateBackImg)'
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
                        isBackgroundImg: false,
                        errorMsg: '배경화면 이미지 삭제 오류 (updateBackImg)'
                    });
                    return;
                }

                res.status(403).json({
                    isBackgroundImg: false,
                    errorMsg: '로그인 필요 (updateBackImg)'
                });
            });
            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;
        var paramBackgroundImg = {
            imageName: req.file.originalname,
            cloudUrl: req.file.secure_url,
            imageId: req.file.public_id
        }

        var paramUser = {
            isBackgroundImg: false,
            userBackgroundImg: paramBackgroundImg
        }

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            // 기존 배경화면 이미지 아이디 찾음.
            profileAPI.getUserData(database, paramID, function (err, result) {
                if (err) {
                    console.error(err);
                    res.status(400).json({
                        isBackgroundImg: false,
                        errorMsg: '배경화면 이미지 아이디 찾기 오류 (isBackgroundImg)'
                    });
                    return;
                }

                // 기본 배경화면 이미지인 경우
                if (result.isBackgroundImg) {
                    // 삭제 완료 후, 새로운 배경화면 이미지 정보 넘기기
                    profileAPI.updateUser(database, profileAPI.getType().BackgroundImg, paramID, paramUser, function (err, updatedUser) {
                        // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                        if (err) {
                            console.error('배경화면 이미지 수정 중 에러 발생');

                            res.status(400).json({
                                isBackgroundImg: false,
                                errorMsg: err.stack
                            });

                            return;
                        }

                        // 결과 객체 있으면 성공 응답 전송
                        if (updatedUser) {
                            res.status(200).json({
                                isBackgroundImg: true
                            })
                        } else { // 결과 객체가 없으면 실패 응답 전송
                            res.status(500).json({
                                isBackgroundImg: false,
                                errorMsg: "프로필 이미지 수정 실패"
                            });
                        }
                    });
                }
                // 기존 배경화면 이미지가 있는 경우
                else {
                    // cloudinary 상의 해당 프로필 사진 삭제
                    cloud.Remove(result.userBackgroundImg.imageId, function (err, result) {
                        if (err) {
                            console.error(err);
                            res.status(400).json({
                                isBackgroundImg: false,
                                errorMsg: '배경화면 이미지 삭제 오류 (isBackgroundImg)'
                            });
                            return;
                        }

                        // 삭제 완료 후, 새로운 프로필 이미지 정보 넘기기
                        profileAPI.updateUser(database, profileAPI.getType().BackgroundImg, paramID, paramUser, function (err, updatedUser) {
                            // 동일한 id가 없는 경우 에러 발생 - 클라이언트로 에러 전송
                            if (err) {
                                console.error('배경화면 이미지 수정 중 에러 발생');

                                res.status(400).json({
                                    isBackgroundImg: false,
                                    errorMsg: err.stack
                                });

                                return;
                            }

                            // 결과 객체 있으면 성공 응답 전송
                            if (updatedUser) {
                                res.status(200).json({
                                    isBackgroundImg: true
                                })
                            } else { // 결과 객체가 없으면 실패 응답 전송
                                res.status(500).json({
                                    isBackgroundImg: false,
                                    errorMsg: "배경화면 이미지 수정 실패"
                                });
                            }
                        });
                    });
                }
            });
        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isBackgroundImg: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }

    });
}