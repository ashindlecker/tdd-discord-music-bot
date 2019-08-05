// Our main application, the bot
import MusicBot from '../src/MusicBot'
// Object/Class representing a message from a user
import Message from '../src/Message'
// Object/Class representing a chat room.
import ChatRoom, {VoiceChannel} from '../src/ChatRoom'

import MediaFetcher from '../src/MediaFetcher'
import Stream from 'stream';

describe("MusicBot Commands", () => {
  let bot;
  let chatRoom;
  let mediaFetcher;
  let voiceChannel;

  // Runs before each test. Used for cleaning up mocks and setting up variables that are often used
  beforeEach(() => {
    voiceChannel = new VoiceChannel(jest.fn());

    const mockJoinChannel = jest.fn().mockImplementation(() => {
      return voiceChannel;
    });

    chatRoom = new ChatRoom(jest.fn(), mockJoinChannel);

    const mockYouTubeFetcher = jest.fn().mockImplementation(() => {
      return new Stream.Readable();
    })
    const mockSoundCloudFetcher = jest.fn().mockImplementation(() => {
      return new Stream.Readable();
    })
    mediaFetcher = new MediaFetcher(mockYouTubeFetcher, mockSoundCloudFetcher);

    
    bot = new MusicBot(mediaFetcher);
  })

  const messageGenerator = (content) => new Message(chatRoom, content);
  
  test('!ping message should respond with "pong"', () => {
    const messageContent = '!ping';
    const expectedResponse = 'pong';
    const message = messageGenerator(messageContent);
    
    bot.handleMessage(message);

    // Only one message should be sent
    expect(chatRoom.sendMessage).toBeCalledTimes(1);
    // The message sent should be 'pong'
    expect(chatRoom.sendMessage).toBeCalledWith(expectedResponse);
  })

  test('Bot should NOT send a response if message is not a valid command', () => {
    const messageContent = 'Squad down for some CSGO tonight?';
    const message = messageGenerator(messageContent);

    bot.handleMessage(message);

    // No messages should be sent
    expect(chatRoom.sendMessage).toBeCalledTimes(0);
  });

  test('Music Commands: !play !queue !skip', async() => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=w2Ov5jzm3j8';
    const playSongMessage = messageGenerator(`!play ${youtubeUrl}`);

    await bot.handleMessage(playSongMessage);

    //Playing a valid url should join the voice channel, and stream audio
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(1);
    expect(voiceChannel.streamAudio).toBeCalledTimes(1);

    await bot.handleMessage(playSongMessage);
    //Playing another song while the bot is currently playing shouldn't change anything
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(1);
    expect(voiceChannel.streamAudio).toBeCalledTimes(1);

    //Skipping the song will move onto the next song. We shouldn't re-join the voice chat, but stream audio should be called again
    await bot.handleMessage(messageGenerator('!skip'));
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(1);
    expect(voiceChannel.streamAudio).toBeCalledTimes(2);

    //Skipping again should result in an empty queue, nothing should be called
    await bot.handleMessage(messageGenerator('!skip'));
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(1);
    expect(voiceChannel.streamAudio).toBeCalledTimes(2);

    //Adding a new song
    await bot.handleMessage(playSongMessage);
    expect(voiceChannel.streamAudio).toBeCalledTimes(3);
    await bot.handleMessage(playSongMessage);
    expect(voiceChannel.streamAudio).toBeCalledTimes(3);
  })

  test('Bot should notify users if failed joining VC', () => {
    let failedChatRoom = new ChatRoom(jest.fn(), jest.fn().mockImplementation(() => {
      throw new Error();
    }))

    const messageContent = '!joinvc';
    const message = new Message(failedChatRoom, messageContent);

    bot.handleMessage(message);
    expect(failedChatRoom.sendMessage).toBeCalledWith(`Can't join voice chat. Are you in one?`);
  })

  test('!play with no url should inform user and not join voice channel', async() => {
    const message = messageGenerator('!play');
    await bot.handleMessage(message);
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(0);
    expect(chatRoom.sendMessage).toBeCalledWith('No url specified.');
  })

  test('!play with non-valid url should inform user and not join voice channel', async() => {
    const message = messageGenerator('!play this is not a valid url');
    await bot.handleMessage(message);
    expect(chatRoom.joinVoiceChannel).toBeCalledTimes(0);
    expect(chatRoom.sendMessage).toBeCalledWith('URL specified is not valid');
  })
})