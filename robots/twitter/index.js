const Twitter = require('twitter');
const fs = require('fs');
const config  = require('../../config');
//set client of twitter
const client = new Twitter({
  consumer_key: config.twitter.consumer_key,
  consumer_secret: config.twitter.consumer_secret,
  access_token_key: config.twitter.access_token_key,
  access_token_secret: config.twitter.access_token_secret
});

//
async function createTweets() {

  const tweetCreate = {
    status:'testando criação de tweet pelo bot'
  }

  await client.post(config.tweet,tweetCreate);
  console.log(criacaoTweet);
}
async function createTweetsWithMedia() {
  try {
    //image in base64
    const mediaCreate = await fs.readFileSync('sources/threads/01.gif');
    //api of upload medias twitter
    const media = await client.post(config.upload,{media:mediaCreate});
    //if not media our not found 
    if(!media || !media.media_id_string) throw new Error('not found media');
    if(media || media.media_id_string) console.log('media send with success!');
    // creating tweet with media id
    let tweetCreate = {
      status:'testando criação de tweet com media pelo bot com gif',
      media_ids:media.media_id_string
    }
    //post tweet in twitter 
    await client.post(config.tweet,tweetCreate);
    console.log('tweet send');
  } catch(e) {
    console.error('\x1b[41m Erro:',e,'\x1b[0m');
  }
  
}

async function postTweetsWithJson() {
  
}
postTweetsWithJson();