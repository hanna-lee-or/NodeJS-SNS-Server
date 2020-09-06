/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-11-07
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 북마크(게시판) 스키마 정의
	var ClipPostSchema = mongoose.Schema({
		// 해당 게시판 글쓴이
		writer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		// 북마크 누른 게시판
		, post_id: {type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true}
		// 회원 아이디
		, user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		// 해당 게시글 삭제 여부
		, isRemovedPost: {type: Boolean, 'default': false, required: true}
		// 북마크 매긴 순으로 정렬하기 위해서
		, created_at: {type: Date, index: {unique: false}, 'default': Date.now}
	});
	
	ClipPostSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	ClipPostSchema.index({post_id: -1, user_id: 1}, {unique: true});
	
	console.log('ClipPostSchema 정의함.');

	return ClipPostSchema;
};

// module.exports에 ClipPostSchema 객체 직접 할당
module.exports = Schema;

