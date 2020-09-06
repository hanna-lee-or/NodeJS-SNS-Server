/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-10-10
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 사용자 팔로우 스키마 정의
	var UserFollowSchema = mongoose.Schema({
		// 팔로우 당한 사람
		receiver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		// 팔로우 한 사람
		, sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
		// 팔로우 시점 순으로 정렬하기 위해서
		, created_at: {type: Date, index: {unique: false}, 'default': Date.now}
	});
	
	UserFollowSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	UserFollowSchema.index({receiver_id: 1, sender_id: 1}, {unique: true});
	
	console.log('UserFollowSchema 정의함.');

	return UserFollowSchema;
};

// module.exports에 UserFollowSchema 객체 직접 할당
module.exports = Schema;

