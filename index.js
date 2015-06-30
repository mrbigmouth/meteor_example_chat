//宣告訊息紀錄Collection
messageList = new Meteor.Collection('messageList');
//建立addMessage這個伺服器端與使用者端通用的方法
Meteor.methods({
  addMessage: function(speaker, messageText) {
      var message = {};
      var lastMessage;
      //防止惡意操作的型別檢查
      if (Meteor.isServer) {
        check(speaker, String);
        check(messageText, String);
      }
      if (speaker.length < 1 || speaker.length > 20) {
        throw new Meteor.Error(403, '使用者的名稱不合法', '使用者名稱應至少一個字元，至多二十個字元！');
      }
      if (messageText.length < 1 || messageText.length > 255) {
        throw new Meteor.Error(403, '發言內容不合法', '發言內容應至少一個字元，至多兩百五十五個字元！');
      }
      message.speaker = speaker;
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

if (Meteor.isClient) {
  //使用者暱稱預設為無名氏
  var userName = new ReactiveVar('無名氏');
  //當Meteor啟動時，詢問使用者暱稱
  Meteor.startup(function() {
    var inputUserName = window.prompt('請輸入您的暱稱');
    if (inputUserName) {
      userName.set( inputUserName );
    }
  });
  //設定chat_input的helper
  Template.chat_input.helpers({
    userName: function() {
      return userName.get();
    }
  });
  //設定chat_input的發言事件
  Template.chat_input.events({
    'submit': function(e, ins) {
      var form = ins.firstNode;
      //呼叫addMessage方法，並產生錯誤時以alert顯示錯誤細節
      Meteor.call('addMessage', userName.get(), form.message.value, function(error) {
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