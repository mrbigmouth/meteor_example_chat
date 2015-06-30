//宣告訊息紀錄Collection
messageList = new Meteor.Collection('messageList');
//建立addMessage這個伺服器端與使用者端通用的方法
Meteor.methods({
  addMessage: function(messageText) {
      var message = {};
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
        message.time = messageList.findOne({}, {sort: {time: -1}}).time;
        message.time.setSeconds( message.time.getSeconds() + 1 );
      }
      //在伺服器端執行的時候，時間設定為當前系統時間
      else {
        message.time = new Date();
      }
      //將發言置入messageList Collection中
      messageList.insert( message );
  }
});

if (Meteor.isClient) {
  //註冊廣域helper -- 根據使用者id取得使用者暱稱
  Template.registerHelper('getUserNickName', function(userId) {
    var user = Meteor.users.findOne(userId);
    //預設使用者暱稱為無名氏
    var userNickName = '無名氏';
    //若存在使用者且有設定使用者暱稱，則改為使用使用者設定的暱稱
    if (user && user.profile && user.profile.nickName) {
      userNickName = user.profile.nickName;
    }
    return userNickName;
  });

  Template.chat_input.events({
    //設定使用者暱稱
    'click button': function(e, ins) {
      var userNickName = prompt('請輸入新的暱稱:');
      if (userNickName.length > 20 || userNickName < 1) {
        alert('使用者暱稱不可為空白、長度不可超過二十個字元！')
        return false;
      }
      //直接修改使用者暱稱
      Meteor.users.update(Meteor.userId(), {
        $set: {
          profile: {
            nickName: userNickName
          }
        }
      });
    },
    //處理註冊使用者發言
    'submit': function(e, ins) {
      var form = ins.firstNode;
      //呼叫addMessage方法，並產生錯誤時以alert顯示錯誤細節
      Meteor.call('addMessage', form.message.value, function(error) {
        if (error) {
          alert(error.reason + '\n' + error.details);
        }
      });
      //發完言後把輸入框裡的值清空
      form.message.value = '';
      //防止表單的預設送出動作
      e.preventDefault();
    }
  });

  //設定chat_message的helper
  Template.chat_message.helpers({
    message: function() {
      return messageList.find({}, {sort: {time: -1}});
    },
    formatDateTime: function(dateTime) {
      return dateTime.toLocaleString();
    }
  })
}