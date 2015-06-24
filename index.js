if (Meteor.isClient) {
  //訊息紀錄
  var messageList = new ReactiveVar([]);
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
      var message = {};
      var newMessageList = messageList.get();
      message.speaker = userName.get();
      message.message = form.message.value;
      message.time = new Date();

      //將最新發言置入訊息列最前方
      newMessageList.unshift(message);
      messageList.set( newMessageList );

      //發完言後把輸入框裡的值清空
      form.message.value = '';
      //防止表單的預設送出動作
      e.preventDefault();
    }
  });

  //設定chat_message的helper
  Template.chat_message.helpers({
    message: function() {
      return messageList.get();
    },
    formatDateTime: function(date) {
      return date.toLocaleString();
    }
  })
}