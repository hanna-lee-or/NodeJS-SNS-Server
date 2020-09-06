/**
 * 패스포트 설정 파일
 * 
 * 구글 인증 방식에 사용되는 패스포트 설정
 *
 * @date 2019-09-01
 * @author Hanna
 */

var GoogleStrategy = require('passport-google-oauth20').Strategy;
// var {google} = require('googleapis');
var config = require('../config');

module.exports = function(app, passport) {
	return new GoogleStrategy({
    	clientID: config.google.clientID,
    	clientSecret: config.google.clientSecret,
    	callbackURL: config.google.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		console.log('passport의 google 호출됨.');
		console.dir(profile);

		if (!profile._json.email_verified) {
			console.log("email_verified is false.");
			return done(err);
		}
		
		var database = app.get('database');
	    database.UserModel.findOne({'email': profile.emails[0].value, 'provider': 'google'}, function (err, user) {
			if (err) return done(err);
      
			// 같은 이메일이어도 소셜 장소가 다르면 회원가입 ok
			if (!user) {
				var thisEmail = profile.emails[0].value;
				var splitEmail = thisEmail.split('@');
				var defaultName = splitEmail[0] + "_g";
				var user = new database.UserModel({
					email: thisEmail,
					userName: defaultName,
			        provider: 'google'
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
			} else {
				return done(err, user);
			}
	    });
	});
};
