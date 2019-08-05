import MediaQueue from './MediaQueue'

export default class MusicBot {
  constructor(mediaFetcher) {
    this.mediaFetcher = mediaFetcher;
    this.mediaQueue = new MediaQueue();

    this._currentVC = null;
  }

  async handleMessage(message) {
    const { chatRoom, content } = message;
    const contentArgs = content.split(' ');
    //I'm smelling a refactor soon
    if(contentArgs[0] === '!ping'){
      chatRoom.sendMessage('pong');
    }
    else if(contentArgs[0] === '!joinvc') {
      try {
        chatRoom.joinVoiceChannel();
        chatRoom.sendMessage('Joining VC');
      }
      catch {
        chatRoom.sendMessage(`Can't join voice chat. Are you in one?`);
      }
    }
    else if(contentArgs[0] === '!queue') {
      const url = contentArgs[1];
      if(url) {
        const stream = this.mediaFetcher.fetchStream(url);
        if(stream){
          this.mediaQueue.addStream(stream);
        }
      }
    }
    else if(contentArgs[0] === '!play') {
      const url = contentArgs[1];
      if(url) {
        const stream = this.mediaFetcher.fetchStream(url);

        if(stream){
          this.mediaQueue.addStream(stream);
          if(!this._currentVC){
            this._currentVC = await chatRoom.joinVoiceChannel();
          }
          this.mediaQueue.play(this._currentVC);
        }
        else {
          chatRoom.sendMessage('URL specified is not valid');
        }
        
      }
      else {
        chatRoom.sendMessage('No url specified.');
      }
    }
    else if(contentArgs[0] === '!skip') {
      this.mediaQueue.skip();
    }
  }
}