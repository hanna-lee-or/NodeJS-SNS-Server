/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-01
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 게시글 스키마 정의
	var RemovedPostSchema = mongoose.Schema({
		// 회원만 게시글 작성 가능
		writer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		, content: {
			images: [new mongoose.Schema({
						sequenceId: {type: Number},
						imageName: {type: String},
						cloudUrl: {type: String},
						imageId: {type: String}
					}, { _id: false })],
			video: {
				videoName: {type: String},
				cloudUrl: {type: String},
				videoId: {type: String}
			},
			title: {type: String, required: true, trim: true,
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
	    , removed_at: {type: Date, index: {unique: false}, 'default': Date.now}
	});

	// validate (길이체크)
	function LengthValidator(v, min, max) {
		if (min != 0 && (v.length < min || v.length > max))
			return null;
		else
			return true;
	};
	
	RemovedPostSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});
	
	console.log('RemovedPostSchema 정의함.');

	return RemovedPostSchema;
};

// module.exports에 RemovedPostSchema 객체 직접 할당
module.exports = Schema;

