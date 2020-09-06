/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-20
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 대댓글 스키마 정의
	var DownmentSchema = mongoose.Schema({
		// 해당 게시글 아이디
		post_id: {type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true}
		// 부모 댓글 아이디
		, parent_id: {type: mongoose.Schema.Types.ObjectId, ref: 'upments', required: true}
		// 회원만 게시글 작성 가능
		, writer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		, text: {type: String, required: true, trim: true,
			validate :
			{ validator : val => LengthValidator(val, 1, 200),
				msg : '댓글 길이는 1자~200자여야 합니다.'
			}
		}
		// 좋아요 수, 신고 수
		, count: {
			like_count: {type: Number, required: true, 'default': 0},
			complain_count: {type: Number, required: true, 'default': 0}
		}
		// 작성 날짜
	    , created_at: {type: Date, index: {unique: false}, 'default': Date.now}
	});

	// validate (길이체크)
	function LengthValidator(v, min, max) {
		if (min != 0 && (v.length < min || v.length > max))
			return null;
		else
			return true;
	};
	
	// 모델 객체에서 사용할 수 있는 메소드 정의
	DownmentSchema.static('findByID', function(writer_id, callback) {
		return this.find({writer_id: writer_id}, callback);
	});
	
	DownmentSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});
	
	console.log('DownmentSchema 정의함.');

	return DownmentSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

