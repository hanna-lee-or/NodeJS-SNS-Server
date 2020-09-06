/**
 * 패스포트 설정 파일
 *
 * 로컬 인증방식을 사용하는 패스포트 설정
 *
 * @date 2019-11-14
 * @author Hanna
 */

var LocalStrategy = require("passport-local").Strategy;

module.exports = new LocalStrategy(
	{
		usernameField: "email",
		passwordField: "password",
		passReqToCallback: true // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
	},
	// password 대신 token !!
	function (req, email, password, done) {
		console.log("passport의 local-login 호출됨 : " + email + ", " + password);
		
		//토큰 유효한지 확인!!
		var database = req.app.get("database");
		database.UserModel.findOne({ email: email, provider: "local" }, function (
			err,
			user
		) {
			if (err) {
				return done(err);
			}
			console.dir(req.body);
			// 등록된 사용자가 없는 경우
			if (!user) {
				//var paramID = req.body.ID;
				var database = req.app.get('database');
				//checkUserName(database, paramID, function (err, isExist) {
				//	if (err)
				//		return done(err);
					// 사용가능한 아이디이면
					//if (!isExist) {
						//var paramNick = req.body.nickname;
						//var paramIsEmailNotice = false;
						//if (req.body.isEmailNotice)
						//	paramIsEmailNotice = req.body.isEmailNotice;
						var thisEmail = email;
						var user = new database.UserModel({
							"email": thisEmail,
						//	"userName": defaultName,
						//	"nickname": paramNick,
						//	"isNotice.isEmailNotice": paramIsEmailNotice,
							"provider": "local"
						});

						user.save(function (err) {
							if (err) console.log(err);
							database.StudioHomeModel.create({
								"writer_id": user._id
							}).then((res) => {
								return done(err, user);
							}).catch((err) => {
								return done(err);
							})
						});
					//}
					// 사용 불가능한 아이디이면 에러처리
				// 	else {
				// 		console.log("중복되는 아이디.");
				// 		err = "아이디 중복";
				// 		return done(err);
				// 	}
				// });
			} else {
				// 비밀번호 비교하여 맞지 않는 경우
				// var authenticated = user.authenticate(
				// 	password,
				// 	user._doc.salt,
				// 	user._doc.hashed_password
				// );
				// if (password != "abc1234") {
				// 	console.log("비밀번호 일치하지 않음.");
				// 	err = "비밀번호 오류";
				// 	return done(err);
				// }
				return done(err, user);
			}
		});
	}
);

// 프로필 아이디(이름) 중복 체크 함수
var checkUserName = function (database, name, callback) {
	console.log('checkUserName 호출됨.');

	// UserModel을 이용해 사용자 조회
	database.UserModel.findOne({
		'userName': name
	}, function (err, user) {
		// 에러 처리
		if (err) {
			callback(err, null);
		}

		// 해당 아이디(이름)가 이미 데베상에 존재하는지 여부 반환
		if (!user) {
			callback(null, false);
		} else {
			callback(null, true);
		}

	});

}
