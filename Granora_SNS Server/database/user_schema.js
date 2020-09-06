/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-01
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 유저 스키마 정의
	var UserSchema = mongoose.Schema({
		email: {type: String, required: true, index: 'hashed'}
		, token: {type: String, index: 'hashed'}
		, userName: {type: String, index: 'hashed',
			validate: [
			{ validator : NameCharValidator, 
				msg : 'ID는 숫자 영어 . _ 만 허용됩니다.' }, 
			{ validator : val => LengthValidator(val, 2, 30),
				msg : 'ID 길이는 2자~30자여야 합니다.' }
			]
		}
		, nickname: {type: String, required: true, index: 'hashed', 'default': 'nickname', 
			validate: [
			{ validator : NicknameCharValidator, 
				msg : '닉네임은 숫자 영어 한글 _ 만 허용됩니다.' }, 
			{ validator : val => LengthValidator(val, 1, 20),
				msg : '닉네임 길이는 1자~20자여야 합니다.' }
			]
		}
		, isBasicImg: {type: Boolean, required: true, 'default': true}
		, userImg: {
			imageName: {type: String},
			cloudUrl: {type: String},
			imageId: {type: String}
		}
		, isBackgroundImg: {type: Boolean, required: true, 'default': true}
		, userBackgroundImg: {
			imageName: {type: String},
			cloudUrl: {type: String},
			imageId: {type: String}
		}
		, userInfo: {type: String, 'default': null, trim: true,
			validate :
			{ validator : val => LengthValidator(val, 0, 100),
				msg : '소개글은 최대 100자까지 작성 가능합니다.'
			}
		}
		, tag: [String]
		, isStore: {type: Boolean, required: true, 'default': false}
		, isAgree: {type: Boolean, required: true, 'default': false}
		, isNotice: {
			isPushNotice: {type: Boolean, required: true, 'default': true},
			isEmailNotice: {type: Boolean, required: true, 'default': false}
		}
		, count: {
			// 내가 팔로우 한 사람들
			following_count: {type: Number, required: true, 'default': 0},
			// 나를 팔로우 한 사람들
			follower_count: {type: Number, required: true, 'default': 0},
			board_count: {type: Number, required: true, 'default': 0},
			newMsg_count: {type: Number, required: true, 'default': 0}
		}
	    , created_at: {type: Date, index: {unique: false}, 'default': Date.now}
		, updated_at: {type: Date, 'default': Date.now}
		, lastPosting_at: {type: Date, 'default': Date.now}
		, provider: {type: String, required: true, enum : ['twitter', 'google', 'naver', 'local']}
		
	});

	// userName의 validate (문자체크)
	function NameCharValidator(userName) {
		return userName.match("[._0-9a-zA-Z]+");
	};
	
	// nickname의 validate (문자체크)
	function NicknameCharValidator(name) {
		return name.match("[_0-9a-zA-Z가-힣]+");
	};

	// validate (길이체크)
	function LengthValidator(v, min, max) {
		if (min != 0 && (v.length < min || v.length > max))
			return null;
		else
			return true;
	};
	
	// 입력된 칼럼의 값이 있는지 확인
	UserSchema.path('email').validate(function (email) {
		return email.length;
	}, 'email 칼럼의 값이 없습니다.');
	
	// 모델 객체에서 사용할 수 있는 메소드 정의
	UserSchema.static('findByName', function(name, callback) {
		return this.find({userName: name}, callback);
	});
	
	UserSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});
	
	console.log('UserSchema 정의함.');

	return UserSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

