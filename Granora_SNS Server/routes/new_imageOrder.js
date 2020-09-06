// /**
//  * 이미지 순서 변경 라우터
//  */

// module.exports = function (router) {
//     console.log('new_imageOrder 호출됨.');

//     // 제목 검색 목록
//     router.route('/imageOrder').post(function (req, res) {
//         console.log('/imageOrder 패스 요청됨.');


//         // imageNumList
//         var imageOrder = req.body.imageOrder;

//         // 인증 안된 경우
//         if (!req.user) {
//             console.log("사용자 인증 안된 상태임.");
//             res.status(403).json({
//                 isGetPost: false,
//                 errorMsg: "로그인 필요 (getMyPosts)"
//             });
//             return;
//         }

//         //작성자 여부 확인

//          // 파라미터 설정
//          var paramID = req.user._id;


//         // 데이터베이스 객체 참조
//         var database = req.app.get('database');

//         // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
//         if (database.db) {
//             database.PostModel.findOne({
//                 writer_id: req.user._id
//             },
//             function (err, count) {
//                 if (err) {
//                     console.error("작성자 조회 에러 : " + err.stack);

//                     res.status(400).json({
//                         isPost: false,
//                         errorMsg: "이미지 순서변경시 작성자 조회 에러"
//                     });
//                     return;
//                 }

//                 var skip = (page == 1) ? 0 : 1;
//                 var remainPage = Math.ceil((count - skip) / limit);

//                 if (!count || count < 1 || (page != 1 && count <= 1)) {
//                     res.status(200).json({
//                         isSearch: true,
//                         posts: null,
//                         remainPage: remainPage,
//                         totalNum: 0
//                     });

//                     return;
//                 }
//             }
//         }

//     }
// )}