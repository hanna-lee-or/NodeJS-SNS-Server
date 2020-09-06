/**
 * 패스포트 라우팅 함수 정의
 *
 * < router 목록 >
 * 1. / : 홈페이지 (로그인 여부 알림)
 * 2. /profile : 마이 프로필 조회
 * 3. /logout : 로그아웃
 * 4-1. /auth/twitter : 트위터 로그인
 * 4-2. /auth/twitter/callback : 트위터 로그인 콜백
 * 5-1. /auth/google : 구글 로그인
 * 5-2. /auth/google/callback : 구글 로그인 콜백
 * 6-1. /auth/naver : 네이버 로그인
 * 6-2. /auth/naver : 네이버 로그인 콜백
 * 7. /login : 테스트용 로그인
 * 
 * [x] /secession : 유저 정보 삭제 (미완 탈퇴 기능) - 약관에 따른 처리 필요
 *
 * @date 2019-11-13
 * @author Hanna
 */

module.exports = function (router, passport) {
    console.log("user_passport 호출됨.");

    // 홈 화면
    router.route("/").get(function (req, res) {
        console.log("/ 패스 요청됨.");

        console.log("req.user의 정보");
        console.dir(req.user);

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(200).json({
                isLogin: false,
                _id: "존재하지 않습니다.",
                provider: "test",
                email: "test@granora.com"
            });
        } else {
            res.status(200).json({
                isLogin: true,
                _id: req.user._id,
                provider: req.user.provider,
                email: req.user.email
            });
        }
    });

    // 프로필 화면
    router.route("/profile").get(function (req, res) {
        console.log("/profile 패스 요청됨.");

        // 인증된 경우, req.user 객체에 사용자 정보 있으며, 인증안된 경우 req.user는 false값임
        // console.log('req.user 객체의 값');
        // console.dir(req.user);

        // 인증 안된 경우
        if (!req.user) {
            console.error("사용자 인증 안된 상태임.");
            res.status(403).json({
                isLogin: false,
                errorMsg: "로그인 필요 (profile)"
            });
        } else {

            // 데이터베이스 객체 참조 (해당 id 유저의 프로필 정보)
            var database = req.app.get("database");
            database.UserModel.findOne({ _id: req.user._id }, function (err, user) {
                if (err) {
                    console.error("프로필 불러오기 중 에러 발생 : " + err.stack);

                    res.status(400).json({
                        isLogin: false,
                        errorMsg: "프로필 불러오기 중 에러 발생"
                    });

                    return;
                }

                console.log("프로필 정보");
                //기획에 따라 수정 필요함!
                res.status(200).json({
                    isLogin: true,
                    provider: user.provider,
                    email: user.email,
                    userName: user.userName,
                    nickname: user.nickname,
                    isBasicImg: user.isBasicImg,
                    ImgName: user.userImg.imageName,
                    ImgUrl: user.userImg.cloudUrl,
                    userInfo: user.userInfo,
                    tag: user.tag,
                    isStore: user.isStore,
                    PushNotice: user.isNotice.isPushNotice,
                    EmailNotice: user.isNotice.isEmailNotice,
                    isAgree: user.isAgree,
                    newMsg_count: user.count.newMsg_count,
                    board_count: user.count.board_count,
                    follower_count: user.count.follower_count,
                    following_count: user.count.following_count
                });
            });
        }
    });

    // 타인 프로필 화면 조회
    //user_follow.js 에 getOtherProfil 라우터 있음.

    // 로그아웃
    router.route("/logout").get(function (req, res) {
        console.log("/logout 패스 요청됨.");
        req.session.destroy();
        res.status(200).json({
            isLogin: false,
            msg: "로그아웃"
        });
        req.logout();
    });

    /* 탈퇴
    router.route("/secession").get(function (req, res) {
        console.log("/secession 패스 요청됨.");

        var thisID = req.user._id;
        req.session.destroy();
        req.logout();

        var database = req.app.get("database");

        // 유저 정보만 삭제
        if (database.db) {
            database.UserModel.findOneAndRemove({ _id: thisID }, function (err) {
                if (err) {
                    console.log("탈퇴 중 에러 발생 : " + err.stack);
                    res.status(400).json({
                        isDelete: false,
                        errorMsg: "탈퇴 실패"
                    });
                    return;
                }

                res.status(200).json({
                    isDelete: true
                });
            });
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isDelete: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });*/

    // 패스포트 - 트위터 인증 라우팅
    router.route("/auth/twitter").get(
        passport.authenticate("twitter", {
            scope: "email"
        })
    );

    // 패스포트 - 트위터 인증 콜백 라우팅
    router.route("/auth/twitter/callback")
        .get(passport.authenticate("twitter"), function (req, res) {
            if (!req.user) {
                res.status(200).json({
                    isLogin: false,
                    errorMsg: "로그인 실패"
                });
            } else {
                res.status(200).json({
                    isLogin: true
                });
            }
        });

    // 패스포트 - 구글 인증 라우팅
    router.route("/auth/google").get(
        passport.authenticate("google", {
            scope: ["email", "profile"]
        })
    );

    // 패스포트 - 구글 인증 콜백 라우팅
    router.route("/auth/google/callback").get(
        passport.authenticate("google"), function (req, res) {
            if (!req.user) {
                res.status(200).json({
                    isLogin: false,
                    errorMsg: "로그인 실패"
                });
            } else {
                res.status(200).json({
                    isLogin: true
                });
            }
        });

    // 패스포트 - 네이버 인증 라우팅
    router.route("/auth/naver").get(
        passport.authenticate("naver", {
            scope: ["email", "profile"]
        })
    );

    // 패스포트 - 네이버 인증 콜백 라우팅
    router.route("/auth/naver/callback").get(
        passport.authenticate("naver"), function (req, res) {
            if (!req.user) {
                res.status(200).json({
                    isLogin: false,
                    errorMsg: "로그인 실패"
                });
            } else {
                res.status(200).json({
                    isLogin: true
                });
            }
        });

    // 로그인 인증 (테스트용)
    router.route('/login').post(passport.authenticate('local_test'),
        function (req, res) {
            if (!req.user) {
                res.status(200).json({
                    isLogin: false,
                    errorMsg: "로그인 실패"
                });
            } else {
                var database = req.app.get("database");
                
                database.UserModel.findOne({
                    '_id': req.user._id
                }, function(err, user){
                    if(err) {
                        res.status(200).json({
                            isLogin: false,
                            errorMsg: "로그인 오류"
                        })
                        return;
                    }
                    res.status(200).json({
                        isLogin: true,
                        isAgree: user.isAgree
                        //isAgree가 false이면 프론트에서 회원가입 절차로 넘긴다.
                        //join 또는 noImgJoin 으로 나눠서 프론트에서 처리한다.
                    })

                })
            }
    });

};
