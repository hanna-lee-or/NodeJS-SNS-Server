/**
 * 회원가입 라우터
 * @date 2020-01-20
 *
 */

// IMPORT CLOUDINARY CONFIG HERE
var cloud = require("../cloudinary_config");

const nodemailer = require('nodemailer');

module.exports = function (router) {
    console.log("local_join 호출됨.");

    // 회원가입
    router.route("/join").post(cloud.Cloudinary("test_post", "post").array("photo"), function (req, res) {
        console.log("/join 패스 요청됨.");

        // 보내오는 파일이 없는 경우
        if (!req.file) {
            console.log(err);
            res.status(400).json({
                isJoin: false,
                errorMsg: '이미지 없음 (join)'
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
                        isJoin: false,
                        errorMsg: '이미지 삭제 오류 (join)'
                    });
                    return;
                }

                res.status(403).json({
                    isJoin: false,
                    errorMsg: '로그인 필요 (join)'
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
            userName: req.body.userName,
            nickname: req.body.nickname,
            userInfo: req.body.userInfo,
            isBasicImg: false,
            userImg: paramImg,
            isAgree: true,
            isNotice: {isEmailNotice: req.body.isEmailNotice }
        }

        
/*
        // nodemailer 모듈 사용
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'greenegoode11@gmail.com',
                pass: 'password'
            }
        });

        var mailOptions = {
            from: 'greenegoode11@gmail.com',
            to: email,
            subject: 'Verification for Catcher', //제목
            text: 'Welcom!' //내용

        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
            }else {
                console.log('Email sent: '+info.response);
            }
        });

        res.redirect('/');
*/

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            var conditions = {
                "_id" : paramID
            };

            var data = {
                $set: paramUser
            }

            var options = {
                new: true,
                runVaildators: true
            }


            database.UserModel.findOneAndUpdate(conditions, data, options, function (err, result) {
                    if (err) {
                        console.error(err);
                        res.status(400).json({
                            isJoin: false,
                            errorMsg: msg
                        });
                        return;
                    }

                    res.status(200).json({
                        isJoin: true
                    })

                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isJoin: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 회원가입
    router.route("/noImgJoin").post( function (req, res) {
        console.log("/no_img_join 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.error('사용자 인증 안된 상태임.');
            
            res.status(403).json({
                isJoin: false,
                errorMsg: '로그인 필요 (njoin)'
            });

            return;
        }

        // 파라미터 설정
        var paramID = req.user._id;

        var paramUser = {
            userName: req.body.userName,
            nickname: req.body.nickname,
            userInfo: req.body.userInfo,
            isBasicImg: true,
            isAgree: true,
            isNotice: {isEmailNotice: (req.body.isEmailNotice) == '1' }
        }

        
/*
        // nodemailer 모듈 사용
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'greenegoode11@gmail.com',
                pass: 'password'
            }
        });

        var mailOptions = {
            from: 'greenegoode11@gmail.com',
            to: email,
            subject: 'Verification for Catcher', //제목
            text: 'Welcom!' //내용

        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
            }else {
                console.log('Email sent: '+info.response);
            }
        });

        res.redirect('/');
*/

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            var conditions = {
                "_id" : paramID
            };

            var data = {
                $set: paramUser
            }

            var options = {
                new: true,
                runVaildators: true
            }


            database.UserModel.findOneAndUpdate(conditions, data, options, function (err, result) {
                    if (err) {
                        console.error(err);
                        res.status(400).json({
                            isJoin: false,
                            errorMsg: msg
                        });
                        return;
                    }

                    res.status(200).json({
                        isJoin: true
                    })

                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isJoin: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

}