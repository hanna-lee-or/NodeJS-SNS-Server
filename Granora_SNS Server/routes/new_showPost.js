/**
 * < router 목록 >
 * 1. /mystudioHome : 자신의 스튜디오 홈
 * 2. /showPosts : 마이스튜디오 작품 탭 //post요청. targetId, page, lastDate를 보내줘야 함. (최신 게시물 받는거랑 유사한 구조인데 targetId 는 설명.)
 * 3. /showSeries/:id : 시리즈 탭 (작업중)
 * 4. /showItem/:id : 제작 탭 (작업중)
 *
 * @date 2019-12-22
 * @author Hanna
 */

module.exports = function(router) {
    console.log('showPosts 호출됨');

    // 다른 사람 프로필 조회시, 최근 게시글 목록(작품 탭)
    router.route("/showPosts").post(function (req, res) {
        console.log("/showPosts 패스 요청됨.");

        //인증 안된 경우
        if (!req.body.targetId) {
            console.log("타겟 아이디 오류");
            res.status(403).json({
                isGetPost: false,
                errorMsg: "타겟 아이디 오류"
            });
            return;
        }

        // 페이지 조회
        var targetId = req.body.targetId; //사용자가 접근하려는 프로필 유저아이디
        // var targetId = (req.user) ? req.user._id : null; //내가 셀프 테스트할때
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }

        var limit = 8; //받아올 게시물의 수


        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.count({
                    isPrivate: false,
                    created_at: {
                        $lte: lastDate
                    },
                    writer_id : targetId //objectId 를 보내달라고 프론트에 요청
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
                            },
                            writer_id : targetId
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

                            var postList = [];
                            for (var i = 0; i < lists.length; i++) {

                                var postOne = {
                                    _id: lists[i]._id,
                                    title: lists[i].content.title,
                                    thumbnail: null,
                                    created_at: lists[i].created_at,
                                    
                                };
                                var numThumbnail = lists[i].thumbnail;
                                if( numThumbnail >= 0 && lists[i].count.image_count >= numThumbnail){ //정상케이스
                                    // numThumbnail >= 0 //0과 같거나 클때 이미자가 있다.
                                    postOne.thumbnail = lists[i].content.images[numThumbnail].cloudUrl;
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
                }
            );
        } else {
            // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송 //끊어졌거나 디비연결안하고 실행됐을 때
            res.status(500).json({
                isGetPost: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 자신의 프로필 조회시, 스튜디오 홈 스키마 접근
    router.route("/mystduioHome/1").get(function (req, res) {
        console.log("/mystduioHome 패스 요청됨.");

        // 인증 안된 경우
        if (!req.user) {
            console.log("사용자 인증 안된 상태임.");
            res.status(403).json({
                isShowPost: false,
                errorMsg: "로그인 필요 (showPosts)"
            });
            return;
        }
        // 파라미터 설정
        var paramID = req.user._id; //세션 패스포트 거쳐서 해온 유저 아이디.

        // 데이터베이스 객체 참조
        var database = req.app.get("database");

        database.StudioHomeModel.findOne({
            writer_id: paramID
        }).then((res) => {
            //마이스튜디오 홈 핀 작업중!!

        }).catch((err) => {
            res.status(400).json({
                isShowPost: false,
                errorMsg: "마이스튜디오 홈 - 유저 정보 조회 에러"
            });
        });
    });
}