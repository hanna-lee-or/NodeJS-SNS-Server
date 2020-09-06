/**
 * 스튜디오홈 스키마를 정의하는 모듈
 *
 * @date 2019-12-22
 * @author Sky
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 게시글 스키마 정의
	var studioHomeSchema = mongoose.Schema({
		// 회원만 게시글 작성 가능
        writer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
        , intro : {type: String}
        , notice : {type: String}
        , postPin : [{type: mongoose.Schema.Types.ObjectId, ref: 'posts'}]
	});
	
	studioHomeSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});
	
	console.log('studioHomeSchema 정의함.');

	return studioHomeSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

