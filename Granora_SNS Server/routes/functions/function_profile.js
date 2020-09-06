/**
 * 프로필 정보 처리 함수
 * 데이터베이스 관련 객체들을 req.app.get('database')로 참조
 *
 * < fuction 목록 >
 * 1. getType() : enum 값 반환
 * 2. checkUserName(database, id, name, callback)
 *       : 프로필 아이디(이름) 중복 체크 함수
 * 3. getUserData(database, id, callback)
 *       : 프로필 이미지 아이디 찾기
 * 4. updateUser(database, type, id, user, callback)
 *       : 프로필 수정 함수
 * 5. setProfileErrorMsg(err)
 *       : 에러 메시지 처리
 *
 * @date 2019-11-13
 * @author Hanna
 */

// enum (이름 체크 함수 리턴 값에 사용)
var UPDATETYPE = Object.freeze({
    'BasicImg': 7,
    'ProfileImg': 6,
    'BasicBackgroundImg': 5,
    'BackgroundImg': 4,
    'Notice': 3,
    'Create': 2,
    'UpdateBasic': 1,
    'Update': 0
});

exports.getType = function() {
    return UPDATETYPE;
}

// 프로필 아이디(이름) 중복 체크 함수
exports.checkUserName = function (database, id, name, callback) {

    // UserModel을 이용해 사용자 조회
    database.UserModel.findOne({
        'userName': name
    }, function (err, user) {
        // 에러 처리
        if (err) {
            callback(err, null);
        }

        // 해당 아이디(이름)가 이미 데베상에 존재하는지 여부 반환
        if (!user || user._id == id) {
            callback(null, false);
        } else {
            callback(null, true);
        }

    });

}

// 프로필 이미지 아이디 찾기
exports.getUserData = function (database, id, callback) {

    // UserModel을 이용해 사용자 조회
    database.UserModel.findOne({
        '_id': id
    }, function (err, user) {
        // 에러 처리
        if (err) {
            callback(err, null);
        }

        callback(null, user);

    });

}

// 프로필 수정 함수
exports.updateUser = function (database, type, id, user, callback) {

    // UserModel을 이용해 업데이트
    var conditions = {
        "_id": id
    };

    var data;
    // 회원가입인 경우
    if (type == UPDATETYPE.Create) {
        data = {
            $set: {
                "userName": user.paramName,
                "nickname": user.paramNickname,
                "userInfo": user.paramInfo,
                "isNotice.isPushNotice": user.paramPushNotice,
                "isNotice.isEmailNotice": user.paramEmailNotice,
                "isAgree": user.paramAgree
            }
        }
    }
    // 프로필 수정인 경우
    else if (type == UPDATETYPE.Update) {
        data = {
            $set: {
                "userName": user.userName,
                "nickname": user.nickname,
                "userInfo": user.userInfo,
            }
        }
    }
    // 프로필 수정인 경우 + 기본 이미지로 되돌아간 경우
    else if (type == UPDATETYPE.UpdateBasic) {
        data = {
            $set: {
                "userName": user.userName,
                "nickname": user.nickname,
                "userInfo": user.userInfo,
                "isBasicImg": true,
                "userImg.imageName": null,
                "userImg.cloudUrl": null,
                "userImg.imageId": null
            }
        }
    }
    // 알림 수정인 경우
    else if (type == UPDATETYPE.Notice) {
        data = {
            $set: {
                "isNotice.isPushNotice": user.paramPushNotice,
                "isNotice.isEmailNotice": user.paramEmailNotice
            }
        }
    }
    // 프로필 이미지 수정인 경우 (이미지 있는 경우)
    else if (type == UPDATETYPE.ProfileImg) {
        data = {
            $set: {
                "userName": user.userName,
                "nickname": user.nickname,
                "userInfo": user.userInfo,
                "isBasicImg": user.isBasicImg,
                "userImg.imageName": user.userImg.imageName,
                "userImg.cloudUrl": user.userImg.cloudUrl,
                "userImg.imageId": user.userImg.imageId
            }
        }
    }
    // 배경화면 이미지 수정인 경우 (이미지 있는 경우)
    else if (type == UPDATETYPE.BackgroundImg) {
        data = {
            $set: {
                "isBackgroundImg": user.isBackgroundImg,
                "userBackgroundImg.imageName": user.userBackgroundImg.imageName,
                "userBackgroundImg.cloudUrl": user.userBackgroundImg.cloudUrl,
                "userBackgroundImg.imageId": user.userBackgroundImg.imageId
            }
        }
    }
     // 기본 배경화면 이미지 설정인 경우
     else if (type == UPDATETYPE.BasicBackgroundImg){
        data = {
            $set: {
                "isBackgroundImg": true,
                "userBackgroundImg.imageName": null,
                "userBackgroundImg.cloudUrl": null,
                "userBackgroundImg.imageId": null
            }
        }
    }
    // 기본 프로필 이미지 설정인 경우
    else {
        data = {
            $set: {
                "isBasicImg": true,
                "userImg.imageName": null,
                "userImg.cloudUrl": null,
                "userImg.imageId": null
            }
        }
    }
   

    var options = {
        // 수정 이후의 doc을 반환 : true
        new: true,
        // 수정 시 validators 적용 : true
        runValidators: true
    }

    database.UserModel.findOneAndUpdate(conditions, data, options, function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }

        callback(null, result);
    });
}

// 에러 메시지 처리
exports.setProfileErrorMsg = function (err) {
    var thisErrorMsg = {
        userName: null,
        nickname: null,
        userInfo: null
    };
    // 에러 메세지 설정
    try {
        thisErrorMsg.userName = err.errors.userName.message;
    } catch (e) { }
    try {
        thisErrorMsg.nickname = err.errors.nickname.message;
    } catch (e) { }
    try {
        thisErrorMsg.userInfo = err.errors.userInfo.message;
    } catch (e) { }

    return thisErrorMsg;
}
