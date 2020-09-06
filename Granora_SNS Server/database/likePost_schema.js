/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-10-10
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 좋아요(게시판) 스키마 정의
	var LikePostSchema = mongoose.Schema({
		// 좋아요 누른 게시판
		post_id: {type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true}
		// 회원 아이디
		, user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
	});
	
	LikePostSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	LikePostSchema.index({post_id: -1, user_id: 1}, {unique: true});
	
	console.log('LikePostSchema 정의함.');

	return LikePostSchema;
};

// module.exports에 LikePostSchema 객체 직접 할당
module.exports = Schema;

