//宣告訊息紀錄Collection
messageList = new Meteor.Collection('messageList');
//建立addMessage這個伺服器端與使用者端通用的方法
Meteor.methods({
  addMessage: function(speaker, messageText) {
      var message = {};
      message.speaker = speaker;
      message.message = messageText;
      message.time = new Date();
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
      //呼叫addMessage方法
      Meteor.call('addMessage', userName.get(), form.message.value);
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