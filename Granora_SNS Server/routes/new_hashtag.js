// 해시태그 검색
// HashtagModel 만들어야 함
// UserModel 작성자 정보를 조인?

// 데이터베이스 객체 참조
// var database = req.app.get('database');


// router.get('/hashtag', async(req, res, next)=>{
//     const query = req.query.hashtag;
//     if(!query) {
//         return res.redirect('/');
//     }
//     try {
//         const hashtag = await database.HashtagModel.find({ where: {title: query}});
//         let posts = [];
//         if(hashtag){
                // 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져온다.
//             posts = await hashtag.getPosts({ include: [{ moedl: User }] });
//         }
//         return res.status(200).json({
//             title: `${query}`,
//             user: req.user,
//             post: posts
//         });
//     } catch (error) {
//         console.error(error);
//         return next(error);
//     }
// });