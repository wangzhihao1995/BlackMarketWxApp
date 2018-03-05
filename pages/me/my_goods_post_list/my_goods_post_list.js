// my_goods_post_list.js

import wxw from '../../../utils/wrapper'

let app = getApp()
Page({
  data: {
    userInfo: {},
    filterShowed: false,
    sortShowed: false,
    sortState: 4,
    inputShowed: false,
    inputVal: '',
    hasMore: true,
    loading: false,
    students: {},
    posts: [],
    start: 0,
    limit: 10,
    order: 'desc',
    inited: false,

    onlyOpen: true,

    filterOnlyOpen: true,
    filtered: true
  },

  refreshPostList() {
    let that = this
    wx.showNavigationBarLoading()
    wxw.getMyGoodsPost(app.globalData.session, this.data.order, 0, this.data.limit, this.data.filterOnlyOpen ? 0 : null)
      .then(res => {
        let data = {
          start: res.length,
          loading: false,
          inited: true
        }
        data.hasMore = res.length >= that.data.limit;
        app.processData(res)
        data.posts = res
        that.setData(data)
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
        // wx.pageScrollTo({
        //   scrollTop: 0
        // })
      })
      .catch(err => {
        that.setData({
          loading: false
        })
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
      })
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
    if (app.globalData.needRefresh || !this.data.inited) {
      app.globalData.needRefresh = false
      this.refreshPostList()
    }
  },


  onReachBottom(e) {
    let that = this
    if (that.data.hasMore && !this.data.loading) {
      this.setData({
        loading: true,
      })
      wxw.getMyGoodsPost(app.globalData.session, this.data.order, this.data.start, this.data.limit, this.data.filterOnlyOpen ? 0 : null)
        .then(res => {
          let data = {
            start: that.data.start + res.length,
            posts: that.data.posts,
            loading: false,
          }
          if (res.length < that.data.limit) data.hasMore = false
          app.processData(res, item => {
            data.posts.push(item)
          })
          that.setData(data)
        })
        .catch(err => {
          that.setData({
            loading: false
          })
        })
    }
  },
  onPullDownRefresh() {
    let that = this
    this.setData({
      loading: true
    })
    this.refreshPostList()
  },
  toggleSort(e) {
    let that = this
    this.setData({
      sortShowed: !that.data.sortShowed,
    })
  },
  hideSort() {
    this.setData({
      sortShowed: false,
    })
  },
  hideFilter() {
    let data = {
      filterShowed: false
    }
    this.setData(data)
  },
  comfirmFilter(e) {
    let data = {
      filterShowed: false
    }
    let filterChanged = false
    if (this.data.onlyOpen !== this.data.filterOnlyOpen) {
      data.filterOnlyOpen = this.data.onlyOpen
      filterChanged = true
    }
    data.filtered = data.filterOnlyOpen

    this.setData(data)
    if (filterChanged) {
      this.refreshPostList()
    }
  },
  cancelMask() {
    if (this.data.sortShowed)
      this.hideSort()
    if (this.data.filterShowed)
      this.hideFilter()
  },
  setSortState(e) {
    if (e.currentTarget.dataset.state) {
      this.setData({
        sortState: Number.parseInt(e.currentTarget.dataset.state),
      })

    }
    this.cancelMask()
  },
  setFilterState(e) {

  },
  toggleFilter(e) {
    let data = {
      filterShowed: !this.data.filterShowed
    }
    if (data.filterShowed) {
      data.onlyOpen = this.data.filterOnlyOpen
    }
    this.setData(data)
  },
  toggleTimeSort(e) {
    let state = 0
    let order = 'desc'
    switch (this.data.sortState) {
      case 0:
      case 1:
      case 2:
      case 4:
        state = 3
        order = 'asc'
        break
      case 3:
        state = 4
        order = 'desc'
        break
    }
    this.setData({
      sortState: state,
      order
    })
    this.cancelMask()
    this.refreshPostList()
  },

  clearFilter(e) {
    let filterChange = !this.data.filterOnlyOpen
    this.setData({
      onlyOpen: true,
      filterOnlyOpen: true,
      filtered: true,
      filterShowed: false,

    })
    if (filterChange) this.refreshPostList()
  },

  bindOnlyOpen(e) {
    this.setData({
      onlyOpen: e.detail.value
    })
  }
})