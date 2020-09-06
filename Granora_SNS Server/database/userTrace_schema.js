/**
 * 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-01
 * @author Hanna
 */

var Schema = {};

Schema.createSchema = function(mongoose) {
	
	// 유저 스키마 정의
	var UserTraceSchema = mongoose.Schema({
		// 회원 당 하나
		user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true}
		// 신고한 것들
		, complain_id: {
			post_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'posts'}],
			upment_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'upments'}],
			downment_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'downments'}]
		}
	});
	
	// 모델 객체에서 사용할 수 있는 메소드 정의
	UserTraceSchema.static('findById', function(user_id, callback) {
		return this.find({user_id: user_id}, callback);
	});
	
	UserTraceSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});
	
	console.log('UserTraceSchema 정의함.');

	return UserTraceSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

