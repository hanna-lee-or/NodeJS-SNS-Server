/**
 * 검색 처리 모듈
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < router 목록 >
 * 1. /searchTitle : 제목 검색에 따른 게시글 조회
 * 2. /searchText : 내용 검색에 따른 게시글 조회
 *
 * @date 2020-1-13
 * @author Hanna
 */


module.exports = function (router) {
    console.log('new_search 호출됨.');

    // 제목 검색 목록
    router.route('/searchTitle').post(function (req, res) {
        console.log('/search 패스 요청됨.');

        // 페이지 조회
        //var userId = (req.user) ? req.user._id : null;
        var searchword = req.body.title;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.count({
                isPrivate: false,
                //$text: { $search: searchword},
                "content.title": {$regex: searchword},
                created_at: {
                    $lte: lastDate
                }
            },
            function (err, count) {
                if (err) {
                    console.error("검색 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isSearch: false,
                        errorMsg: "검색 목록 페이지 카운팅 에러"
                    });
                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isSearch: true,
                        posts: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.PostModel.find({
                    isPrivate: false,
                    //$text: { $search: searchword},
                    "content.title": {$regex: searchword},
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'writer_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(async function (err, lists) {
                    if (err) {
                        console.error("제목 검색 에러 : " + err.stack);

                        res.status(400).json({
                            isSearch: false,
                            errorMsg: "제목 검색 에러"
                        });

                        return;
                    }

                    var searchwordList = [];
                    for (var i = 0; i < lists.length; i++) {
                        var searchwordOne = {
                            _id: lists[i]._id,
                            w_id: lists[i].writer_id._id,
                            w_nickname: lists[i].writer_id.nickname,
                            w_userName: lists[i].writer_id.userName,
                            w_isBasicImg: lists[i].writer_id.isBasicImg,
                            w_cloudUrl: null,
                            like_count: lists[i].count.like_count,
                            comment_count: lists[i].count.comment_count,
                            title: lists[i].content.title,
                            created_at: lists[i].created_at,
                            thumbnail: null,
                        };
                        if (!lists[i].writer_id.isBasicImg)
                            searchwordOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;

                                    var numThumbnail = lists[i].thumbnail;
                                    if( numThumbnail >= 0 && lists[i].count.image_count >= numThumbnail){ //정상케이스
                                        // numThumbnail >= 0 //0과 같거나 클때 이미자가 있다.
                                        searchwordOne.thumbnail = lists[i].content.images[numThumbnail].cloudUrl;
                                    }
                        
                        searchwordList.push(searchwordOne);
                    }

                    res.status(200).json({
                        isSearch: true,
                        posts: searchwordList,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
        
            })
        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isSearch: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });

    // 내용 검색 목록
    router.route('/searchText').post(function (req, res) {
        console.log('/searchText 패스 요청됨.');

        // 페이지 조회
        //var userId = (req.user) ? req.user._id : null;
        var searchword = req.body.tag;
        var page = req.body.page;
        var lastDate = req.body.lastDate || new Date();
        if (lastDate == '0') {
            lastDate = new Date();
        }
        var limit = 20;

        // 데이터베이스 객체 참조
        var database = req.app.get('database');

        // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
        if (database.db) {
            database.PostModel.count({
                isPrivate: false,
                $text: { $search: searchword},
                //"content.title": {$regex: searchword},
                created_at: {
                    $lte: lastDate
                }
            },
            function (err, count) {
                if (err) {
                    console.error("검색 페이지 카운팅 에러 : " + err.stack);

                    res.status(400).json({
                        isSearch: false,
                        errorMsg: "검색 목록 페이지 카운팅 에러"
                    });
                    return;
                }

                var skip = (page == 1) ? 0 : 1;
                var remainPage = Math.ceil((count - skip) / limit);

                if (!count || count < 1 || (page != 1 && count <= 1)) {
                    res.status(200).json({
                        isSearch: true,
                        posts: null,
                        remainPage: remainPage,
                        totalNum: 0
                    });

                    return;
                }

                database.PostModel.find({
                    isPrivate: false,
                    $text: { $search: searchword},
                    //"content.title": {$regex: searchword},
                    "created_at": {
                        "$lte": lastDate
                    }
                }).populate({
                    path: 'writer_id',
                    select: ['_id', 'nickname', 'userName', 'isBasicImg', 'userImg']
                }).sort("-created_at").skip(skip).limit(limit).exec(async function (err, lists) {
                    if (err) {
                        console.error("내용 검색 에러 : " + err.stack);

                        res.status(400).json({
                            isSearch: false,
                            errorMsg: "내용 검색 에러"
                        });

                        return;
                    }

                    var searchwordList = [];
                    for (var i = 0; i < lists.length; i++) {
                        var searchwordOne = {
                            _id: lists[i]._id,
                            w_id: lists[i].writer_id._id,
                            w_nickname: lists[i].writer_id.nickname,
                            w_userName: lists[i].writer_id.userName,
                            w_isBasicImg: lists[i].writer_id.isBasicImg,
                            w_cloudUrl: null,
                            like_count: lists[i].count.like_count,
                            comment_count: lists[i].count.comment_count,
                            title: lists[i].content.title,
                            created_at: lists[i].created_at,
                            thumbnail: null,
                        };
                        if (!lists[i].writer_id.isBasicImg)
                            searchwordOne.w_cloudUrl = lists[i].writer_id.userImg.cloudUrl;

                                    var numThumbnail = lists[i].thumbnail;
                                    if( numThumbnail >= 0 && lists[i].count.image_count >= numThumbnail){ //정상케이스
                                        // numThumbnail >= 0 //0과 같거나 클때 이미자가 있다.
                                        searchwordOne.thumbnail = lists[i].content.images[numThumbnail].cloudUrl;
                                    }
                        
                        searchwordList.push(searchwordOne);
                    }

                    res.status(200).json({
                        isSearch: true,
                        posts: searchwordList,
                        remainPage: remainPage,
                        totalNum: count
                    });
                });
        
            })
        } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.status(500).json({
                isSearch: false,
                errorMsg: "데이터베이스 연결 실패"
            });
        }
    });
}