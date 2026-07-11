const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dp5r0dqqh', 
  api_key: '783458634783412', 
  api_secret: '9n3VWGL93rnhw4_bB9SRBSej6n8' 
});

cloudinary.uploader.upload('D:\\NexTalk\\NexTalk_Logo_NoText.png', { folder: "nextalk" })
  .then(result => {
    console.log(result.secure_url);
  })
  .catch(error => {
    console.error(error);
  });
