const Twitter = require('twitter');
const fs = require('fs');
const config = require('../../config');
//set client of twitter
const client = new Twitter({
  consumer_key: config.twitter.consumer_key,
  consumer_secret: config.twitter.consumer_secret,
  access_token_key: config.twitter.access_token_key,
  access_token_secret: config.twitter.access_token_secret
});

//
async function createTweets(reply, text) {
  try {
    //creating tweets
    let tweetCreate = {
      status: text
    }
    if (reply) tweetCreate.in_reply_to_status_id = reply;
    const tweet = await client.post(config.twitter.tweet, tweetCreate);
    console.log('tweet send, id:',tweet.id_str);
    return tweet;
  } catch (e) {
    console.error('\x1b[41m Error:', e, '\x1b[0m');
    throw new Error(e);
  }

}
async function createTweetsWithMedia(reply, image, text) {
  try {
    //image in base64
    const mediaCreate = await fs.readFileSync(config.dir.content + config.folder + '/' + image);
    //api of upload medias twitter
    const media = await client.post(config.twitter.upload, { media: mediaCreate });
    //if not media our not found 
    if (!media || !media.media_id_string) throw new Error('not found media');
    if (media || media.media_id_string) console.log('media send with success!');
    // creating tweet with media id
    let tweetCreate = {
      status: text,
      media_ids: media.media_id_string
    }
    if (reply) tweetCreate.in_reply_to_status_id = reply;
    //post tweet in twitter 
    const tweet = await client.post(config.twitter.tweet, tweetCreate);
    console.log('tweet send with media, id:',tweet.id_str);
    //return
    return tweet
  } catch (e) {
    console.error('\x1b[41m Erro:', e, '\x1b[0m');
    throw new Error(e);
  }

}

async function robot() {
  try {
    //localizando arquivos json
    let files = await fs.readdirSync(config.dir.finished);
    //armazenando dado do arquvio
    let state = await fs.readFileSync(config.dir.finished + files[0], 'utf8');
    //salvando como objeto
    state = JSON.parse(state);
    //percorrendo objetos para criar os tweets

    let isReply = [];
    let idxTweets = 0;
    for (const t of state) {
        if (isReply[idxTweets]) isReply[idxTweets] = {};
        if (idxTweets == 0) {
          if (t.image) {
            isReply[idxTweets] = await createTweetsWithMedia(false, t.image, t.text);
          }
          else {
            isReply[idxTweets] = await createTweets(false, t.text);
          }
        } else {
          if (t.image) {
            isReply[idxTweets] = await createTweetsWithMedia(isReply[idxTweets - 1].id_str, t.image, t.text);
          }
          else {
            isReply[idxTweets] = await createTweets(isReply[idxTweets - 1].id_str, t.text)
          }
        }
        idxTweets++;
    }
    console.log('Thread FINISHED-');
    //apagando arquivo que não será usado novamente
    await fs.unlinkSync(config.dir.finished + files[0]);
  } catch (e) {
    console.error('\x1b[41m Error:', e, '\x1b[0m');
  }

}
module.exports = robot;