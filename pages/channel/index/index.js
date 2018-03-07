//index.js
//获取应用实例
import wxw from '../../../utils/wrapper'
import {
  ErrorTypes
} from '../../../utils/exception'
import Promise from '../../../utils/es6-promise'

let app = getApp()
Page({
  data: {
    userInfo: {},
    loading: false,
    students: {},
  },

  onLoad(options) {
    let that = this
    if (app.globalData.session && app.globalData.userInfo && app.globalData.bindInfo) {
      this.setData(app.globalData)
    } else {
      wx.redirectTo({
        url: '../../common/splash/splash',
      })
    }
  },

  onShow() {
  },


  onReachBottom(e) {
  },

  onPullDownRefresh() {
  },

  toggleSort(e) {
  }
})