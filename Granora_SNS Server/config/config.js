/**
 * 설정 파일
 *
 * @date 2019-11-13
 * @author Hanna
 */

module.exports = {
	server_port: 3000,
	// local MongoDB와 연동 시
	db_url: 'mongodb://localhost:27017/local',
	// 클라우드 MongoDB와 연동 시
	//db_url: 'mongodb+srv://...',
	db_schemas: [
		{file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'},
		{file:'./post_schema', collection:'posts', schemaName:'PostSchema', modelName:'PostModel'},
		{file:'./userTrace_schema', collection:'userTraces', schemaName:'UserTraceSchema', modelName:'UserTraceModel'},
		{file:'./upment_schema', collection:'upments', schemaName:'UpmentSchema', modelName:'UpmentModel'},
		{file:'./downment_schema', collection:'downments', schemaName:'DownmentSchema', modelName:'DownmentModel'},
		{file:'./likePost_schema', collection:'likePosts', schemaName:'LikePostSchema', modelName:'LikePostModel'},
		{file:'./likeUpment_schema', collection:'likeUpments', schemaName:'LikeUpmentSchema', modelName:'LikeUpmentModel'},
		{file:'./likeDownment_schema', collection:'likeDownments', schemaName:'LikeDownmentSchema', modelName:'LikeDownmentModel'},
		{file:'./userFollow_schema', collection:'userFollows', schemaName:'UserFollowSchema', modelName:'UserFollowModel'},
		{file:'./removedPost_schema', collection:'removedPosts', schemaName:'RemovedPostSchema', modelName:'RemovedPostModel'},
		{file:'./clipPost_schema', collection:'clipPosts', schemaName:'ClipPostSchema', modelName:'ClipPostModel'},
		{file:'./studioHome_schema', collection:'studioHomes', schemaName:'StudioHomeSchema', modelName:'StudioHomeModel'},
	],
	route_info: [
        //{file:'./user', path:'/process/modifyUser', method:'modifyUser', type:'post'}
	],
	cloudinary: {
		cloud_name: 'testcatcher',
		api_key: '...',
		api_secret: '...'	
	},
	twitter: {		// passport twitter
		clientID: '...',
		clientSecret: '...',
		callbackURL: '/auth/twitter/callback'
	},
	google: {		// passport google
		clientID: '...',
		clientSecret: '...',
		callbackURL: '/auth/google/callback'
	},
	naver: {
		clientID : '...',
		clientSecret : '...',
		callbackURL : '/auth/naver/callback'
	  }
	// facebook: {		// passport facebook
	// 	clientID: '...',
	// 	clientSecret: '...',
	// 	callbackURL: '/auth/facebook/callback'
	// },
}