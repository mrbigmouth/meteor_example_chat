//宣告訊息紀錄Collection
messageList = new Meteor.Collection('messageList');

//建立addMessage這個伺服器端與使用者端通用的方法
Meteor.methods({
  addMessage: function(messageText) {
      var message = {};
      var lastMessage;
      //防止惡意操作的型別檢查
      if (Meteor.isServer) {
        check(messageText, String);
      }
      if (messageText.length < 1 || messageText.length > 255) {
        throw new Meteor.Error(403, '發言內容不合法', '發言內容應至少一個字元，至多兩百五十五個字元！');
      }
      //設定發言者為當前登入的使用者id
      message.user = this.userId;
      message.message = messageText;
      //在使用者端執行的時候，時間自動視為最新message的時間+1秒
      if (Meteor.isClient) {
        lastMessage = messageList.findOne({}, {sort: {time: -1}});
        if (lastMessage) {
          message.time = messageList.findOne({}, {sort: {time: -1}}).time;
          message.time.setSeconds( message.time.getSeconds() + 1 );
        }
        else {
          message.time = new Date();
        }
      }
      //在伺服器端執行的時候，時間設定為當前系統時間
      else {
        message.time = new Date();
      }
      //將發言置入messageList Collection中
      messageList.insert( message );
  }
});

//在伺服器端建立messageList的 CUD 權限審核
if (Meteor.isServer) {
  messageList.allow({
    //否定所有插入的請求，因為我們已經有了addMessage方法，禁止一切不按規章來的資料庫插入訊息！
    insert: function() {
      return false;
    },
    //只有發言人自己在發言時間未滿一分鐘的情況下才可以修改發言內容
    update: function(userId, message, fields, modifier) {
      if (userId === message.user && fields === 'message' && Date.now() - message.time.getTime() < 60000) {
        return true;
      }
      return false;
    },
    //所有人都不允許刪除messageList裡面的資料
    remove: function() {
      return false;
    }
  });

  //發布所有聊天訊息
  Meteor.publish('allMessage', function() {
    //發布所有messageList資料集合內的訊息
    return messageList.find();
  });

  //發布所有「已發言者」的暱稱資料
  Meteor.publish('speakerNickName', function() {
    //從所有訊息中取得所有已發言人
    var alreadySpeaker = messageList.find().map(function(message) {
      return message.user;
    });
    //去除重複的發言者
    alreadySpeaker = _.uniq(alreadySpeaker);

    //發布所有已發言人的暱稱資料
    return Meteor.users.find(
      {
        _id: {
          $in: alreadySpeaker
        }
      },
      {
        fields: {
          profile: 1
        }
      }
    );
  });
}
else {
  //訂閱所有聊天訊息
  Meteor.subscribe('allMessage');
  //訂閱所有已發言人的暱稱資料
  Meteor.subscribe('speakerNickName');
}