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

  //顯示可見訊息數
  Template.chat_input.helpers({
    viewMessageNumber: function() {
      return Session.get('viewMessageNumber');
    }
  });
  Template.chat_input.events({
    //設定使用者暱稱
    'click button': function() {
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
    //設定所見訊息數
    'change input[type="number"]': function(e) {
      var value = e.currentTarget.value;
      var viewMessageNumber = parseInt(value, 10);
      //只有可以正確轉為整數的字串才可以設定為viewMessageNumber
      if ('' + viewMessageNumber === value) {
        Session.set('viewMessageNumber', viewMessageNumber);
      }
      else {
        return false;
      }
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
    },
    canEdit: function() {
      return this.user === Meteor.userId();
    }
  });
  Template.chat_message.events({
    'click button': function(e, ins) {
      var originMessageText = this.message;
      var newMessageText = prompt('修改新訊息', originMessageText);
      messageList.update(this._id, {
        $set: {
          message: newMessageText
        }
      }, function(error) {
        if (error) {
          alert(error.reason + '\n' + error.details);
        }
      });
    }
  });
}