/**
 * 패스포트 기본 설정 파일
 * 
 * 패스포트 설정을 위한 기본 파일로 passport 폴더에 있는 설정 파일들을 사용함
 * serializeUser, deserializeUser 메소드 설정
 *
 * @date 2019-09-01
 * @author Hanna
 */

// var facebook = require('./passport/facebook');
var twitter = require('./passport/twitter');
var google = require('./passport/google');
var naver = require('./passport/naver');
var local_test = require('./passport/local_login');

module.exports = function (app, passport) {
	console.log('config/passport 호출됨.');

    // 사용자 인증 성공 시 호출
    // 사용자 정보를 이용해 세션을 만듦
    // 로그인 이후에 들어오는 요청은 deserializeUser 메소드 안에서 이 세션을 확인할 수 있음
    passport.serializeUser(function(user, done) {
        console.log('Save passport session data.');

        var _user = {
            _id: user._id,
            email: user.email,
            provider: user.provider
        };

        done(null, _user);  // 이 인증 콜백에서 넘겨주는 user 객체의 정보를 이용해 세션 생성
    });

    // 사용자 인증 이후 사용자 요청 시마다 호출
    // user -> 사용자 인증 성공 시 serializeUser 메소드를 이용해 만들었던 세션 정보가 파라미터로 넘어온 것임
    passport.deserializeUser(function(user, done) {
        console.log('Get passport session data.');
        
        // 두 번째 파라미터로 지정한 사용자 정보는 req.user 객체로 복원됨
        done(null, user);  
    });

	// 인증방식 설정
	// passport.use('facebook', facebook(app, passport));
	passport.use('twitter', twitter(app, passport));
    passport.use('google', google(app, passport));
    passport.use('naver', naver(app, passport));
    passport.use('local_test', local_test);
	console.log('4가지 passport 인증방식 설정됨.');
	
};