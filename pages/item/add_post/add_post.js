// add_post.js
import wxw from '../../../utils/wrapper'
import {
  ErrorTypes
} from '../../../utils/exception'

let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    contentLength: 0,

    showTopTips: false,
    TopTips: '信息不完整',

    mobileSwitch: true,
    wechatNo: '',
    bindInfo: {},
    edit: false,
    postId: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    that.setData({bindInfo: app.globalData.bindInfo})
    if (options.edit && options.id) {
      wx.setNavigationBarTitle({
        title: '编辑信息'
      })
      wxw.getGoodsPost(app.globalData.session, options.id)
        .then(res => {
          console.log(res)
          let data = {
            edit: true,
            postId: res.id,
            bindInfo: app.globalData.bindInfo
          }
          data.mobileSwitch = (res.mobileSwitch === 1)
          data.wechatNo = res.wechat
          data.content = res.content
          data.contentLength = data.content.length
          that.setData(data)
        })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  showTopTips: function(tip) {
    let that = this
    this.setData({
      TopTips: tip || that.data.TopTips,
      showTopTips: true,
    })
    setTimeout(function() {
      that.setData({
        showTopTips: false,
      })
    }, 3000)
  },

  bindContentChange(e) {
    this.setData({
      content: e.detail.value,
      contentLength: e.detail.value.length,
    })
  },

  checkInfo() {
    if (!this.data.mobileSwitch && !this.data.wechatNo) {
      this.showTopTips('请至少填写一种联系方式')
    } else if (this.data.content.trim().length === 0) {
      this.showTopTips('内容不能为空')
    } else {
      return true
    }
    return false
  },

  /**
   * 提交需求信息
   * {
   *   switch: mobileSwitch,
   *   mobile: app.globalData.bindInfo.mobile,
   *   wechat: wechat_no,
   *   content
   * }
   */
  submitCreatePost(e) {
    let that = this
    if (this.checkInfo()) {
      let content = []
      content.push('确认发布此信息吗？')
      wx.showModal({
        title: '发布确认',
        content: content.join("\n"),
        confirmText: '发布',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            let data = {
              student_id: app.globalData.bindInfo.id.toString(),
              mobileSwitch: that.data.mobileSwitch ? 1 : 0,
              mobile: that.data.mobileSwitch ? app.globalData.bindInfo.mobile : '',
              wechat: that.data.wechatNo,
              content: that.data.content,
            }
            wxw.createGoodsPost(app.globalData.session, data)
              .then(res => {
                app.globalData.needRefresh = true
                wx.showToast({
                  title: '添加成功',
                  icon: 'success',
                  duration: 2000,
                  complete() {
                    setTimeout(() => {
                      wx.switchTab({
                        url: '../index/index'
                      })
                    }, 2000)
                  }
                })
              })
              .catch(err => {
                console.log("createPost error")
                console.error(err)
                if (err && err.data && err.data.message) {
                  wxw.showMessage(err.data.message, '错误')
                }
              })
          }
        }
      })

    }
  },

  submitEditPost(e) {
    let that = this
    if (this.checkInfo()) {
      let data = {
        mobileSwitch: that.data.mobileSwitch ? 1 : 0,
        mobile: that.data.mobileSwitch ? app.globalData.bindInfo.mobile : '',
        wechat: that.data.wechatNo,
        content: that.data.content,
      }
      wxw.editGoodsPost(app.globalData.session, data, this.data.postId)
        .then(res => {
          app.globalData.needRefresh = true
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000,
            complete() {
              setTimeout(() => {
                wx.navigateBack()
              }, 2000)
            }
          })
        })
        .catch(err => {
          if (err.type && err.type === ErrorTypes.Response) {
            wxw.showMessage(err.message, '错误')
          }
        })
    }
  },

  bindmobileSwitchChange(e) {
    this.setData({
      mobileSwitch: e.detail.value,
    })
  },

  bindWechatChange(e) {
    this.setData({
      wechatNo: e.detail.value,
    })
  },
  goBack(e) {
    wx.navigateBack()
  },
})
