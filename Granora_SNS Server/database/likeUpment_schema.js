/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-10-10
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 좋아요(댓글) 스키마 정의
	var LikeUpmentSchema = mongoose.Schema({
		// 댓글의 소속 게시판
		post_id: {type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true}
		// 좋아요 누른 댓글
		, upment_id: {type: mongoose.Schema.Types.ObjectId, ref: 'upments'}
		// 회원 아이디
		, user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
	});
	
	LikeUpmentSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	LikeUpmentSchema.index({upment_id: -1, user_id: 1}, {unique: true});
	
	console.log('LikeUpmentSchema 정의함.');

	return LikeUpmentSchema;
};

// module.exports에 LikeUpmentSchema 객체 직접 할당
module.exports = Schema;

