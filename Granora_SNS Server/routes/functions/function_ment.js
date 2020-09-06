/**
 * 댓글, 대댓글 정보 처리 함수
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < fuction 목록 >
 * 1. updateCount(database, isAdd, type, ID, callback)
 *       : 게시글/댓글 count 값 수정
 * 2. getMent(database, isUpment, mentId, callback)
 *       : 댓글 정보 조회
 * 3. removeMent(database, isUpment, ment, callback)
 *       : 댓글/대댓글 삭제
 *
 * @date 2019-11-13
 * @author Hanna
 */

// enum (카운팅 함수 파라미터 값에 사용)
const COUNTTYPE = Object.freeze({
    'Post': 1,
    'Upment': 0
});

// 게시글/댓글 count 값 수정
var updateCount = function (database, isAdd, type, ID, callback) {
    console.log('updateCount 호출됨.');

    // UserModel을 이용해 업데이트
    var conditions = {
        "_id": ID
    };

    var data;
    // 댓글 추가, 게시글의 comment_count + 1
    // 또는 대댓글 추가, 댓글의 comment_count + 1
    if (isAdd) {
        data = {
            $inc: {
                "count.comment_count": 1
            }
        }
    }
    // 댓글 삭제, 게시글의 comment_count - 1
    // 또는 대댓글 삭제, 댓글의 comment_count - 1
    else {
        data = {
            $inc: {
                "count.comment_count": -1
            }
        }
    }

    var options = {
        new: true,
        runValidators: true
    }

    // 게시글의 경우
    if (type == COUNTTYPE.Post) {
        database.PostModel.findOneAndUpdate(conditions, data, options, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    }
    // 댓글의 경우
    else {
        database.UpmentModel.findOneAndUpdate(conditions, data, options, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, result);
        });
    }

}

// 댓글 정보 조회
var getMent = function (database, isUpment, mentId, callback) {
    console.log('getMent 호출됨.');

    if (isUpment) {
        // 해당 댓글 정보 반환
        database.UpmentModel.findOne({
            '_id': mentId
        }, function (err, ment) {
            // 에러 처리
            if (err) {
                callback(err, null);
            }

            callback(null, ment)

        });
    } else {
        // 해당 대댓글 정보 반환
        database.DownmentModel.findOne({
            '_id': mentId
        }, function (err, ment) {
            // 에러 처리
            if (err) {
                callback(err, null);
            }

            callback(null, ment)

        });
    }
}

// 댓글/대댓글 삭제
var removeMent = function (database, isUpment, ment, callback) {
    console.log('removeMent 호출됨.');

    if (isUpment) {
        // 일치하면 댓글 삭제 진행
        database.UpmentModel.findOneAndRemove({
            "_id": ment._id
        }, function (err) {
            if (err) {
                callback(err, null);
                return;
            }

            // 댓글 삭제 후, post의 comment_count 감소시키기
            updateCount(database, false, COUNTTYPE.Post, ment.post_id, function (err, result) {
                if (err) {
                    callback(err, null);
                    return;
                }

                callback(null, result);
            });
        });
    } else {
        // 대댓글 삭제
        database.DownmentModel.findOneAndRemove({
            "_id": ment._id
        }, function (err) {
            if (err) {
                callback(err, null);
                return;
            }

            // 대댓글 삭제 후, upment & post의 comment_count 감소시키기
            updateCount(database, false, COUNTTYPE.Upment, ment.parent_id, function (err, result) {
                if (err) {
                    callback(err, null);
                    return;
                }

                updateCount(database, false, COUNTTYPE.Post, ment.post_id, function (err, result) {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    callback(null, result);
                });
            });
        });
    }

}

module.exports = {COUNTTYPE, updateCount, getMent, removeMent};
