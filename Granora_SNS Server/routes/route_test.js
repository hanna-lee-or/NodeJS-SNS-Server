/**
 * 테스트 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. 
 *
 * @date 2019-09-16
 * @author Hanna
 */

// IMPORT CLOUDINARY CONFIG HERE
var cloud = require("../config/cloudinary_config");

module.exports = function (router) {
    console.log("route_test 호출됨.");

    // 프로필 화면
    router.route("/testPromise").get(async function (req, res) {
        console.log("/testPromise 패스 요청됨.");

        var userId = req.user._id;

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        try {
            
            await Promise.all([database.LikePostModel.findOne({
                user_id: userId
            }), database.ClipPostModel.findOne({
                user_id: userId
            })])
                .then(values => {
                    const [res1, res2] = values;
                    console.log("all done");
                    console.log(res1._id.toString());
                    console.log(res2._id.toString());
                    res.status(200).json({
                        isTestPost: true
                    });
                });
            console.log("all done??");
        } catch (err) {
            console.error(err);
        }

    });

    // 다중 이미지
    router.route('/updateImg_test').post(cloud.Cloudinary("test_flutter", "test").array("photo"), function (req, res) {
        console.log('/updateImg_test 패스 요청됨.');
        console.dir(req.files);
        //console.dir(req.body);

        res.status(200).json({
            isUpdateImg: true
        })

    });

    // 영상
    router.route('/updateMp4_test').post(cloud.Cloudinary("test_flutter", "test").single("video"), function (req, res) {
        console.log('/updateImg_test 패스 요청됨.');
        console.dir(req.file);
        console.dir(req.body);

        res.status(200).json({
            isUpdateMp4: true
        })

    });

    // 세션 값 확인
    router.route('/sessionTest').get(function (req, res) {
        console.log('/sessionTest 패스 요청됨.');
        console.dir(req.cookies);
        console.dir(req.session);

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.status(200).json({
                isSession: false
            });
            return;
        }

        res.status(200).json({
            isSession: true
        })

    });

};

