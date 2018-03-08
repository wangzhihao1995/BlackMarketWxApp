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
    courses: [{
      credit: 0,
      id: 0,
      name: '（无）',
      schedules: [],
      teacher: '（无）',
    }],
    courseNames: ['（无）'],
    demandIndex: 0,
    supplyIndex: 0,

    message: '',
    messageLength: 0,

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
    (app.globalData.courses.length > 0 ? Promise.resolve({
      data: app.globalData.courses
    }) : wxw.getCourses(app.globalData.session))
    .then(res => {
        let courses = this.data.courses
        let courseNames = this.data.courseNames
        res.data.forEach(item => {
          courses.push(item)
          courseNames.push(item.name)
        })
        that.setData({
          courses,
          courseNames,
          bindInfo: app.globalData.bindInfo
        })
      })
      .catch(err => {
        console.error(err)
      })

    if (options.edit && options.id) {
      wx.setNavigationBarTitle({
        title: '编辑信息'
      })
      wxw.getCoursePost(app.globalData.session, options.id)
        .then(res => {
          console.log(res)
          let data = {
            edit: true,
            postId: res.id
          }
          if (res.demand) data.demandIndex = res.demand.id
          if (res.supply) data.supplyIndex = res.supply.id
          data.mobileSwitch = (res.mobileSwitch === 1)
          data.wechatNo = res.wechat
          data.message = res.message
          data.messageLength = data.message.length
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

  bindCommentChange(e) {
    this.setData({
      message: e.detail.value,
      messageLength: e.detail.value.length,
    })
  },

  checkInfo() {
    if (!this.data.mobileSwitch && !this.data.wechatNo) {
      this.showTopTips('请至少填写一种联系方式')
    } else if (this.data.supplyIndex === 0 && this.data.demandIndex === 0) {
      this.showTopTips('请在需求和供给中至少选择一种')
    } else if (this.data.supplyIndex === this.data.demandIndex) {
      this.showTopTips('需求和供给不能相同')
    } else if (this.data.message.trim().length === 0) {
      this.showTopTips('留言不能为空')
    } else {
      return true
    }
    return false
  },

  /**
   * 提交需求信息
   * {
   *   supply: supplyIndex,
   *   demand: demandIndex,
   *   switch: mobileSwitch,
   *   mobile: app.globalData.bindInfo.mobile,
   *   wechat: wechat_no,
   *   message
   * }
   */
  submitCreatePost(e) {
    let that = this
    if (this.checkInfo()) {
      let content = []
      if (this.data.demandIndex !== 0) content.push('需求：' + this.data.courseNames[this.data.demandIndex])
      if (this.data.supplyIndex !== 0) content.push('供给：' + this.data.courseNames[this.data.supplyIndex])
      content.push('供求一经发布不能修改，仅能修改联系方式与留言')
      wx.showModal({
        title: '发布确认',
        content: content.join("\n"),
        confirmText: '发布',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            let data = {
              student_id: app.globalData.bindInfo.id.toString(),
              supply: Number.parseInt(that.data.supplyIndex),
              demand: Number.parseInt(that.data.demandIndex),
              mobileSwitch: that.data.mobileSwitch ? 1 : 0,
              mobile: that.data.mobileSwitch ? app.globalData.bindInfo.mobile : '',
              wechat: that.data.wechatNo,
              message: that.data.message,
            }
            wxw.createCoursePost(app.globalData.session, data)
              .then(res => {
                app.globalData.needRefresh = true
                wx.showToast({
                  title: '添加成功',
                  icon: 'success',
                  duration: 2000,
                  complete() {
                    setTimeout(() => {
                      wx.switchTab({
                        url: '/pages/course/index/index'
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
        message: that.data.message,
      }
      wxw.editCoursePost(app.globalData.session, data, this.data.postId)
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
            console.log(err)
            wxw.showMessage(err.message, '错误')
          }
        })
    }
  },

  bindDemandChange(e) {
    this.setData({
      demandIndex: Number.parseInt(e.detail.value)
    })
  },

  bindSupplyChange(e) {
    this.setData({
      supplyIndex: Number.parseInt(e.detail.value),
    })
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
