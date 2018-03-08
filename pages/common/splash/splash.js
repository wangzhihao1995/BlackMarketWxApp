let app = getApp()
import wxw from '../../../utils/wrapper'
Page({
  data: {

  },
  onLoad: function(options) {
    // 页面初始化 options为页面跳转所带来的参数
    let that = this
    wxw.showLoading({
      title: 'Loading',
      mask: true
    })
    app.checkLogin()
      .then(data => {
        console.log("data: ", data)
        wxw.hideLoading()
        sleep(500)
        if (data && data.session && data.userInfo && data.bindInfo) {
          wx.switchTab({
            url: '/pages/item/index/index'
          })
        }

      })
      .catch(err => {
        console.error(err.stack)
      })
  },
  onReady: function() {
    // 页面渲染完成
  },
  onShow: function() {
    // 页面显示
  },
  onHide: function() {
    // 页面隐藏
  },
  onUnload: function() {
    // 页面关闭
  }

})

function sleep(numberMillis) {
  var now = new Date();
  var exitTime = now.getTime() + numberMillis;
  while (true) {
    now = new Date();
    if (now.getTime() > exitTime)
      return;
  }
}
