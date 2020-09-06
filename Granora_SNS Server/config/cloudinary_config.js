/**
 * Cloudinary 설정 파일
 * 
 * 이미지, 영상 파일을 관리할 Clodinary 설정
 *
 * @date 2019-11-13
 * @author Hanna
 */

const cloudinary = require('cloudinary');
var multer = require('multer');
var cloudinaryStorage = require('multer-storage-cloudinary');
const config = require('./config');


cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

/**
  * NOTE: cloudinary 기본 세팅
  * @param {string, string} 등록할 폴더명, 이미지 타임 (썸네일...)
  */
module.exports.Cloudinary = function(dir, type){

    var storage = cloudinaryStorage({
        cloudinary: cloudinary,
        folder: dir,
        allowedFormats: ["jpeg", "jpg", "png", "gif"],
        transformation: function(req, file, cb){ // 이미지 변환
            if(type == 'thumbnail'){
                // 예로 썸네일 이미지일경우 크기 조정 후 업로드
                // 프론트단에서 정사각형으로 보내주기로 함 
                cb(null, [{width: 100, height: 100, crop:"fill", quality : "auto" , fetch_format : "auto"}]);
            }else{
                cb(null, [{quality : "auto" , fetch_format : "auto"}]);
            }
        },
        filename: function (req, file, cb) { // 스토리지에 저장할 때 변환할 이미지명
            cb(null, Date.now());
        }
    });

    return multer({storage: storage});
}

/**
  * NOTE: cloudinary 내 이미지 삭제
  * @param {string, function} 이미지 ID, 콜백 함수
  */
module.exports.Remove = function(imageId, cb) {

    cloudinary.v2.uploader.destroy(imageId, (error, result) => {
        if (error) {
            cb (error, null);
            return;
        }
        
        console.log(result); // { result: 'ok' }
        cb (null, result);
    });

}