/**
 * 기본 설정
 *
 * @date 2019-11-13
 * @author Hanna
 */


// Express 기본 모듈 불러오기
var express = require('express'),
	http = require('http'),
	path = require('path');

/* https 설정을 위한 인증서
var https = require('https'),
	fs = require('fs');
const options = {
	key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
	cert: fs.readFileSync('test/fixtures/keys/agent2-cert.cert')
};*/

// Nodemailer 모듈 불러오기
var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');

var smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: 'Gmail',
    host:'smtp.gmail.com',
    auth: {
        user: 'dalha.vv@gmail.com',
        pass: 'password'
    }
}));

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	static = require('serve-static'),
	errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);

//===== Passport 사용 =====//
var passport = require('passport');
var flash = require('connect-flash');

//클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원
var cors = require('cors');


// 모듈로 분리한 설정 파일 불러오기
var config = require('./config/config');

// 모듈로 분리한 데이터베이스 파일 불러오기
var database = require('./database/database');

// 모듈로 분리한 라우팅 파일 불러오기
var route_loader = require('./routes/route_loader');


//=======소셜로그인========//
var app = express();
const {google} = require('googleapis');
var googleClient = require('./config/client_secret_google.json');

const googleConfig = {
	clientId : googleClient.web.client_id,
	clientSecret : googleClient.web.client_secret,
	redirect: googleClient.web.redirect_uris[0]
};

const scopes = [
	'https://www.googleapis.com/auth/plus.me'
];

const oauth2Client = new google.auth.OAuth2 (
	googleConfig.clientId,
	googleConfig.clientSecret,
	googleConfig.redirect
);

const url = oauth2Client.generateAuthUrl({
	access_type : 'offline',
	scope: scopes
});
function getGooglePlusApi (auth) {
	return google.plus({ version: 'v1', auth});
}

async function googleLogin(code) {
	const {tokens} = await oauth2Client.getToken(code);
	oauth2Client.setCredentials(tokens);
	oauth2Client.on('tokens', (token) => {
		if(tokens.refresh_token) {
			console.log("리프레시 토큰 : ", tokens.refresh_token);
		}
		console.log("액세스 토큰 : ", tokens.access_token);
	});
	const plus = getGooglePlusApi(oauth2Client);
	const res = await plus.people.get({ userId: 'me'});
	console.log(`Hello ${res.data.displayName}! ${res.data.id}`);
	return res.data.displayName;
}

app.get('/login2', function(req,res) {
	res.redirect(url);
});

app.get("/auth/google/callback", async function(req,res) {
	const displayName = await googleLogin(req.query.code);
	console.log(displayName);

	res.redirect("http://localhost:3000");
})

app.get('/', function(req,res) {
	res.send('Hello World!');
	console.log("로그인해서 홈으로 돌아옴");
});


// 익스프레스 객체 생성
var app = express();


//===== 뷰 엔진 설정 =====//
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');


//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
app.set('port', process.env.PORT || 3000);

// favicon 설정
var favicon = require('serve-favicon');
app.use(favicon('./public/images/favicon.ico'));


// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({
	extended: false,
	limit: "50mb"
}))

// body-parser를 이용해 application/json 파싱
//app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser.json())

// public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));

// cookie-parser 설정
app.use(cookieParser());

// 세션 설정
app.use(expressSession({
	secret: '&Gra!NorA#CaTcHer@KeY$',
	resave: false,
	saveUninitialized: true,
	store: new MongoStore({
		url: config.db_url,
		collection: "sessions"
	}),
	// 유효시간 : 하루
	cookie: {
		maxAge: 24 * 60 * 60 * 1000
	}
}));



//===== Passport 사용 설정 =====//
// Passport의 세션을 사용할 때는 그 전에 Express의 세션을 사용하는 코드가 있어야 함
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



//라우팅 정보를 읽어들여 라우팅 설정
var router = express.Router();
route_loader.init(app, router);


// 패스포트 설정
var configPassport = require('./config/passport');
configPassport(app, passport);

// 패스포트 라우팅 설정
var userPassport = require('./routes/user_passport');
userPassport(router, passport);

// 프로필 라우팅 설정
var userProfile = require('./routes/user_profile');
userProfile(router);

// 게시글 라우팅 설정
var userPosting = require('./routes/user_posting');
userPosting(router);

// 게시글 라우팅 설정
var userPostingPlus = require('./routes/user_postingPlus');
userPostingPlus(router);

// 댓글/대댓글 라우팅 설정
var userMent = require('./routes/user_ment');
userMent(router);

// 좋아요 라우팅 설정
var userLikey = require('./routes/user_likey');
userLikey(router);

// 북마크 라우팅 설정
var userClip = require('./routes/user_clip');
userClip(router);

// 팔로우 라우팅 설정
var userFollow = require('./routes/user_follow');
userFollow(router);

// 테스트 라우팅 설정
var routeTest = require('./routes/route_test');
routeTest(router);

// 스튜디오-다른사람 최근 작품 탭 라우팅 설정
var showPosts = require('./routes/new_showPost');
showPosts(router);

// 스튜디오-다른사람 최근 작품 탭 라우팅 설정
var mystduioHome = require('./routes/new_showPost');
mystduioHome(router);

// 회원가입 라우팅 설정
var join = require('./config/passport/local_join');
join(router);

// 검색 라우팅 설정
var searchTitle = require('./routes/new_search');
searchTitle(router);

//===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
	static: {
		'404': './public/404.html'
	}
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);


//클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원
app.use(cors());


//===== 서버 시작 =====//

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	console.log('uncaughtException 발생함 : ' + err);
	console.log('서버 프로세스 종료하지 않고 유지함.');

	console.log(err.stack);
});

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
	console.log("프로세스가 종료됩니다.");
	app.close();
});

app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
	if (database.db) {
		database.db.close();
	}
});

// 시작된 서버 객체를 리턴받도록 합니다. 
var serverHttp = http.createServer(app).listen(app.get('port'), function () {
	console.log('HTTP 서버가 시작되었습니다. 포트 : ' + app.get('port'));

	// 데이터베이스 초기화
	database.init(app, config);

});

/*
var serverHttps = https.createServer(option, app).listen(app.get('port2'), function () {
	console.log('HTTPS 서버가 시작되었습니다. 포트 : ' + app.get('port2'));

	// 데이터베이스 초기화
	// database.init(app, config);

});*/