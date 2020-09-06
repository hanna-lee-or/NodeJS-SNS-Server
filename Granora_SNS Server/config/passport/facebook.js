/**
 * 패스포트 설정 파일
 * 
 * 페이스북 인증 방식에 사용되는 패스포트 설정
 *
 * @date 2019-09-01
 * @author Hanna
 */

var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config');

module.exports = function(app, passport) {
	return new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		console.log('passport의 facebook 호출됨.');
		console.dir(profile);
		
		var database = app.get('database');
	    database.UserModel.findOne({'email': profile.emails[0].value, 'provider': 'facebook'}, function (err, user) {
			if (err) return done(err);
      
			// 같은 이메일이어도 소셜 장소가 다르면 회원가입 ok
			if (!user) {
				var user = new database.UserModel({
					id: profile.id,
					email: profile.emails[0].value,
					userName: profile.displayName,
					userImg: profile.photos[0].value,
					provider: 'facebook',
					authToken: accessToken
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
