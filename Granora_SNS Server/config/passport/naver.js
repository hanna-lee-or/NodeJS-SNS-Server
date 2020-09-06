/**
 * 패스포트 설정 파일
 * 
 * 네이버 인증 방식에 사용되는 패스포트 설정
 *
 * @date 2019-09-01
 * @author Hanna
 */

var NaverStrategy = require('passport-naver').Strategy;
var config = require('../config');

module.exports = function(app, passport) {
	return new NaverStrategy({
		clientID: config.naver.clientID,
		clientSecret: config.naver.clientSecret,
		callbackURL: config.naver.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		console.log('passport의 naver 호출됨.');
		console.dir(profile);
		
		var database = app.get('database');
	    database.UserModel.findOne({'email': profile.emails[0].value, 'provider': 'naver'}, function (err, user) {
			if (err) return done(err);
			
			// 같은 이메일이어도 소셜 장소가 다르면 회원가입 ok
			if (!user) {
				var thisEmail = profile.emails[0].value;
				var splitEmail = thisEmail.split('@');
				var defaultName = splitEmail[0] + "_n";
				var user = new database.UserModel({
					email: thisEmail,
					userName: defaultName,
			        provider: 'naver'
				});
        
				user.save(function (err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				return done(err, user);
			}
	    });
	});
};
