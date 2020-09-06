/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-01
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 게시글 스키마 정의
	var PostSchema = mongoose.Schema({
		// 회원만 게시글 작성 가능
		writer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		// 공개 여부 (true : 나만 보기)
		, isPrivate: {type: Boolean, required: true, 'default': false}
		// 핀되어 있는 글인지 여부
		, isPin : {type: Boolean, required: true, 'default': false}
		// 신고에 의한 비공개 상태 여부 (true : 비공개 처리)
		, isComplaint: {type: Boolean, required: true, 'default': false}
		// 댓글 알림 설정 여부
		, isNotice: {type: Boolean, required: true, 'default': true}
		// 대표 이미지 (-1이면 없는거)
		, thumbnail: {type: Number, 'default': '-1'}
		, content: {
			images: [new mongoose.Schema({
						sequenceId: {type: Number},
						cloudUrl: {type: String},
						imageId: {type: String}
					}, { _id: false })],
			imageOrder: [Number],
			video: {
				cloudUrl: {type: String},
				videoId: {type: String}
			},
			title: {type: String, required: true, trim: true, 'default': '제목 없음',
				validate :
				{ validator : val => LengthValidator(val, 1, 50),
					msg : '제목은 1자~50자여야합니다.'
				}},
			text: {type: String,
				validate :
				{ validator : val => LengthValidator(val, 0, 2000),
					msg : '글은 최대 2000자까지 작성 가능합니다.'
				}},
		}
		, tag: [String]
		// 이미지 여러장 / 영상 하나 중 택 1
		, count: {
			image_count: {type: Number, required: true, 'default': 0},
			video_count: {type: Number, required: true, 'default': 0},
			comment_count: {type: Number, required: true, 'default': 0},
			like_count: {type: Number, required: true, 'default': 0},
			complain_count: {type: Number, required: true, 'default': 0}
		}
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
	PostSchema.static('findByID', function(writer_id, callback) {
		return this.find({writer_id: writer_id}, callback);
	});
	
	PostSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	PostSchema.index({"content.title":"text", "tag":"text"})
	
	console.log('PostSchema 정의함.');

	return PostSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

