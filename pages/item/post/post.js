// post.js
import wxw from '../../../utils/wrapper'
import {
  ErrorTypes
} from '../../../utils/exception'
import moment from '../../../utils/moment'

let app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    err: 0,
    postId: 0,
    post: {},
    courses: {},
    types: [],
    typeIndex: [],
    bindInfo: null,
    init: true,
    hasViewedContact: false,

    showTopTips: false,
    TopTips: '出现错误',

    remainingViewCount: 0
  },

  refreshGoodsPost(id) {
    let that = this
    console.log("refreshGoodsPost")
    // wx.showNavigationBarLoading()
    wxw.showLoading()
    wxw.getGoodsPost(app.globalData.session, id)
      .then(res => {
        console.log(res)
        app.processData([res], null, true)
        that.setData({
          post: res,
          hasViewedContact: res.hasViewedContact || res.student.id === app.globalData.bindInfo.id,
        })
        // wx.hideNavigationBarLoading()
        wxw.hideLoading()
      })
      .catch(err => {
        this.setData({
          err: 2
        })
        // wx.hideNavigationBarLoading()
        wxw.hideLoading()
      })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this
    this.setData({
      bindInfo: app.globalData.bindInfo,
      postId: options.id,
      types: app.globalData.types,
      typeIndex: app.globalData.typeIndex
    })
    if (!options.id) {
      this.setData({
        err: 1
      })
    } else {
      (app.globalData.courseNames.length > 0 ? Promise.resolve({
        data: app.globalData.courses
      }) : wxw.getGoodsCourses(app.globalData.session))
      .then(res => {
        let courses = {}
        res.data.forEach(item => {
          courses[item.id] = item
        })
        that.setData({
          courses: courses,
        })
      })

      wxw.getGoodsPostRemainingViewCount(app.globalData.session)
        .then(res => {
          that.setData({
            remainingViewCount: res.remainingViewCount,
          })
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
    if (this.data.init || app.globalData.needRefresh) {
      this.refreshGoodsPost(this.data.postId)
      if (this.data.init) this.setData({
        init: false
      })
      if (app.globalData.needRefresh) app.globalData.needRefresh = false
    }
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
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    let that = this
    let title = (this.data.post.demand.course) ? ('求一门“' + this.data.courses[this.data.post.demand.course.id].name + '”') :
      ('送你一门“' + this.data.courses[this.data.post.supply.course.id].name + '”')
    return {
      title: title,
      desc: '快来和我换课吧',
      path: '/pages/course/share/sharedPost?id=' + encodeURIComponent(this.data.post.fuzzy_id),
      success(res) {
        wxw.GoodsPostShare(that.data.postId, 1, app.globalData.bindInfo.id)
      }
    }
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

  bindDialMobile(e) {
    let that = this
    if (this.data.hasViewedContact) {
      if (this.data.post.mobileSwitch === 1) {
        wx.showModal({
          title: '拨打电话',
          content: '你确定要拨打"' + this.data.post.student.username + '"的电话"' + this.data.post.student.mobile + '"么？',
          confirmText: '确定',
          cancelText: '取消',
          success(res) {
            if (res.confirm) {
              wx.makePhoneCall({
                phoneNumber: that.data.post.student.mobile
              })
            }
          }
        })
      } else {
        wxw.showMessage('该用户电话已隐藏')
      }
    } else {
      this.viewContact()
    }
  },

  bindCopyWechat(e) {
    if (this.data.hasViewedContact) {
      wxw.setClipboardData({
        data: this.data.post.wechat,
        success(res) {
          wx.showToast({
            title: '微信号已复制',
            icon: 'success',
            duration: 1000
          })
        }
      })
    } else {
      this.viewContact()
    }
  },

  viewContact() {
    let that = this
    if (!this.data.hasViewedContact) {
      wx.showModal({
        title: '查看联系方式',
        content: '今天还有' + this.data.remainingViewCount + '次查看机会，确定要查看"' + this.data.post.student.username + '"的联系方式么？',
        confirmText: '确定',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            wx.showNavigationBarLoading()
            wxw.viewGoodsPostContact(app.globalData.session, that.data.postId)
              .then(res => {
                console.log(res)
                that.setData({
                  hasViewedContact: true
                })
                wx.hideNavigationBarLoading()
              })
              .catch(err => {
                wx.hideNavigationBarLoading()
                if (err.type && err.type === ErrorTypes.Response) {
                  wxw.showMessage(err.data.error.message)
                } else {
                  wxw.showMessage('出现错误，请重新尝试')
                }
              })
          }
        }
      })
    }
  },

  sharePost(e) {
    let that = this
    wx.showModal({
      content: '将打开的图片保存后，可进行分享',
      showCancel: false,
      complete() {
        wxw.showLoading()
        wxw.getSharedPostImage(that.data.post, that.data.bindInfo.id)
          .then(res => {
            wxw.hideLoading()
            wx.previewImage({
              urls: [res.tempFilePath]
            })
          })
          .catch(err => {
            wxw.hideLoading()
            console.log(err.message)
          })
        setTimeout(() => {
          wxw.hideLoading()
        }, 10000)
      }
    })
  },

  changePostStatus(e) {
    let that = this
    wx.showActionSheet({
      itemList: ['完成交易', '放弃交易'],
      success(res) {
        if (!res.cancel) {
          let status = 0
          if (res.tapIndex === 0) status = 1
          else if (res.tapIndex === 1) status = 2
          else status = 0
          let data = {
            status: status
          }
          wxw.editGoodsPost(app.globalData.session, data, that.data.postId)
            .then(res => {
              that.refreshGoodsPost(that.data.postId)
              app.globalData.needRefresh = true
            })
            .catch(err => {
              if (err.type && err.type === ErrorTypes.Response) {
                console.log(err)
                wxw.showMessage('关闭失败，请重新尝试')
              }
            })
        }
      }
    })
  },

  editPost(e) {
    wx.navigateTo({
      url: '../add_post/add_post?edit=1&id=' + this.data.post.id
    })
  }
})
