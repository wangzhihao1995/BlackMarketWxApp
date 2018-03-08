import Promise from 'es6-promise'
import {
  SessionExpiredError,
  LoginError,
  SessionError,
  UserInfoError,
  BindInfoError,
  ServerError,
  NetworkError,
  EmptyLocalBindError,
  ResponseError,
  NoChangeError,
  EmptyError,
  StorageFailedError,
  ErrorTypes,
} from 'exception'

let baseUrl = "https://pkublackmarket.cn"
let uploadUrl = ""

let wxw = {
  keys: {
    session: 'session',
    studentInfo: 'studentInfo',
    userInfo: 'userInfo'
  },

  headerKeys: {
    session: 'X-User-Session-Key'
  },


  urls: {
    code2sessionUrl: baseUrl + "/api/wechat/jscode2session",
    checkSessionUrl: baseUrl + "/api/wechat/check_session",
    uploadUserInfoUrl: baseUrl + "/api/wechat/user",
    studentInfoUrl: baseUrl + "/api/student/",
    verifyCodeUrl: baseUrl + "/api/student/register",

    courseUrl: baseUrl + "/api/course/",
    coursePostUrl: baseUrl + "/api/course/post/",
    myCoursePostUrl: baseUrl + "/api/course/post/mine",
    viewCoursePostContactUrl: baseUrl + "/api/course/post/viewcount",

    goodsPostUrl: baseUrl + "/api/goods/post/",
    myGoodsPostUrl: baseUrl + "/api/goods/post/mine",
    viewGoodsPostContactUrl: baseUrl + "/api/goods/post/viewcount",

    sharedCoursePostUrl: baseUrl + "/api/course/post/",
    sharedCoursePostImage: baseUrl + "/api/share/post/",
    shareCoursePostNoticeUrl: baseUrl + "/api/share/post",
    sharedProfileUrl: baseUrl + "/api/student/share/profile/",
    sharedProfileImage: baseUrl + "/api/share/student/",
    shareProfileNoticeUrl: baseUrl + "/api/share/student",

    uploadTokenUrl: baseUrl + "/api/qiniu/token",
    uploadCallbackUrl: baseUrl + "/api/qiniu/callback",

  },

  showMessage(msg, title) {
    if (msg) {
      let options = {
        content: msg,
        showCancel: false
      }
      if (title) options.title = title
      wx.showModal(options)
    }
  },

  /**
   * 检查微信自身Session
   * @returns Promise
   * @throws SessionExpiredError
   */
  checkSession() {
    return new Promise((resolve, reject) => {
      wx.checkSession({
        success() {
          resolve()
        },
        fail() {
          reject(new SessionExpiredError())
        }
      })
    })
  },

  getStorage(key) {
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: key,
        success(data) {
          resolve(data.data)
        },
        fail() {
          reject(new EmptyError())
        }
      })
    })
  },

  setStorage(key, value) {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key: key,
        data: value,
        success() {
          resolve(value)
        },
        fail() {
          reject(new StorageFailedError())
        }
      })
    })
  },

  /**
   * 获取本地储存的3rd-session
   * @returns {Promise<session>}
   * @throws {SessionError}
   */
  getSession() {
    return this.getStorage(this.keys.session)
      .catch(() => {
        console.log(new SessionError())
        return Promise.reject(new SessionError())
      })
  },

  setSession(session) {
    return this.setStorage(this.keys.session, session)
  },

  // =============== 微信API兼容 ===========

  showCompatibleWarning(opName = '此') {
    this.showMessage('您的微信版本过低，无法进行' + opName + '操作')
  },

  setClipboardData(options) {
    if (wx.setClipboardData) {
      wx.setClipboardData(options)
    } else {
      this.showCompatibleWarning('复制')
    }
  },

  reLaunch(options, fallback) {
    if (wx.reLaunch) {
      wx.reLaunch(options)
    } else {
      if (fallback) fallback()
    }
  },

  openSetting(options) {
    if (wx.openSetting) {
      wx.openSetting(options)
    } else {
      this.showCompatibleWarning('设置')
    }
  },

  getSetting(options) {
    if (wx.getSetting) {
      wx.getSetting(options)
    } else {
      this.showCompatibleWarning('读取设置')
    }
  },

  /**
   * 网络请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求数据
   * @param {object} header - 请求头部
   * @param {string} type - 请求数据格式，默认为'json'，有效内容为'json', 'form'
   * @param {string} method - 请求方法，默认为'GET'，有效内容与微信request相同
   * @returns {Promose<Object>}
   * @throws {ResponseError}
   * @throws {NetworkError}
   */
  request(url, data, header = {}, type = 'json', method = 'GET') {
    let that = this
    let contentType = (type === 'form') ? 'application/x-www-form-urlencoded' : 'application/json'
    header['content-type'] = contentType

    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        data: data,
        header: header,
        method: method,
        success(data) {
          if (data.statusCode === 200) {
            resolve(data.data)
          } else {
            reject(new ResponseError(data.data.error.message, data.data.error))
          }
        },
        fail(err) {
          reject(new NetworkError('Caused when request to ' + url + ', errMsg: ' + err.message))
        }
      })
    })
  },

  upload(url, filePath, name, header, data, taskObj = {}) {
    if (wx.uploadFile) {
      return new Promise((resolve, reject) => {
        taskObj.task = wx.uploadFile({
          url,
          filePath,
          name,
          header,
          formData: data,
          success(res) {
            let data = res.data
            resolve(data)
          },
          fail(err) {
            reject(new Error(err))
          }
        })
      })
    } else {
      this.showCompatibleWarning('上传')
    }
  },

  download(url, data, header = {}, type = 'json') {
    let contentType = (type === 'form') ? 'application/x-www-form-urlencoded' : 'application/json'
    header['content-type'] = contentType

    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url,
        header: header,
        success(res) {
          resolve(res)
        },
        fail(err) {
          reject(new NetworkError(err.errMsg))
        }
      })
    })
  },

  /**
   * 检查3rd-session有效性
   * @param {string} session - 3rd-session
   * @returns {Promise<Object>}
   * @throws {ResponseError}
   * @throws {NetworkError}
   */
  checkServerSession(session) {
    return this.request(this.urls.checkSessionUrl, {},
        this.getSessionHeader(session), 'form'
      )
      .then(() => Promise.resolve(session))
      .catch(err => Promise.reject(SessionExpiredError()))
  },

  getSessionHeader(session, header = {}) {
    header[this.headerKeys.session] = session
    return header
  },

  /**
   * 微信登录
   * @returns {Promise<String>} 登录Code
   * @throws {LoginError}
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success(data) {
          resolve(data.code)
        },
        fail() {
          reject(new LoginError())
        }
      })
    })
  },

  /**
   * 使用登录Code换取3rd-session
   * @param {String} code - 登录Code
   * @returns {Promise<String>} 3rd-session
   * @throws {ServerError}
   */
  loginCode2Session(code) {
    let that = this
    return this.request(this.urls.code2sessionUrl, {
        code: code
      }, {}, 'form')
      .then(data => {
        if (data.session_key) {
          return that.setSession(data.session_key)
        } else {
          return Promise.reject(new ServerError(data))
        }
      })
  },

  getUserInfo(session) {
    let that = this
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        withCredentials: true,
        success(res) {
          resolve({
            session: session,
            data: res
          })
        },
        fail() {
          reject(new UserInfoError())
        }
      })
    })
  },

  compareUserInfo(res, check) {
    let that = this
    return that.getStorage(that.keys.userInfo)
      .then(info => {
        if (JSON.stringify(info) != JSON.stringify(res.userInfo)) {
          return Promise.resolve(res)
        } else {
          return Promise.reject(new NoChangeError())
        }
      })
      .catch(err => {
        if (err && err.type && err.type == ErrorTypes.NoChange && check) {
          return Promise.reject(err)
        } else {
          return Promise.resolve(res)
        }
      }) // 本地不存在时，一定未上传
  },

  uploadUserInfo(session, result, check = false) {
    let that = this
    return this.compareUserInfo(result, check)
      .then(res => {
        return that.request(this.urls.uploadUserInfoUrl,
            res,
            that.getSessionHeader(session),
            'json', 'PUT'
          )
          .then(data => {
            that.setStorage(that.keys.userInfo, res.userInfo).then()
            return Promise.resolve(session)
          })
          .catch(err => {
            if (err.type && !err.data) {
              return Promise.reject(err)
            } // NetworkError
            else if (err.data.statusCode && err.data.statusCode >= 500) {
              return Promise.reject(new ServerError(err))
            } else return Promise.reject(new ServerError())
          })
      })
      .catch(err => {
        if (err.type && err.type === ErrorTypes.NoChange) {
          return Promise.resolve(session)
        } else {
          return Promise.reject(err)
        }
      })
  },

  getLocalStudentInfo(session) {
    return this.getStorage(this.keys.studentInfo)
      .catch(() => {
        return Promise.reject(new EmptyLocalBindError('', session))
      })
  },

  setLocalStudentInfo(info) {
    return this.setStorage(this.keys.studentInfo, info)
  },

  fetchServerStudentInfo(session) {
    console.log('fetch Session: ' + session)
    return this.request(this.urls.studentInfoUrl, {}, this.getSessionHeader(session), 'form')
      .catch(err =>
        Promise.reject(new BindInfoError())
      )
  },

  getVerifyCode(session, mobile) {
    return this.request(this.urls.verifyCodeUrl, {
        mobile
      },
      this.getSessionHeader(session), 'json', 'POST')
  },

  uploadStudentInfo(session, info, method = 'POST') {
    return this.request(this.urls.studentInfoUrl, info,
      this.getSessionHeader(session), 'json', method)
  },

  getCourses(session) {
    return this.request(this.urls.courseUrl, {}, this.getSessionHeader(session))
  },

  getCoursePostList(session, order = 'desc', start = 0, limit = 10, supply = 0, demand = 0, status = 1) {
    if (status === null) {
      return this.request(this.urls.coursePostUrl, {
          order,
          start,
          limit,
          supply,
          demand
        }, this.getSessionHeader(session),
        'form')
    }
    return this.request(this.urls.coursePostUrl, {
        order,
        start,
        limit,
        supply,
        demand,
        status
      }, this.getSessionHeader(session),
      'form')
  },

  getGoodsPostList(session, order = 'desc', start = 0, limit = 10, status = 1) {
    if (status === null) {
      return this.request(this.urls.goodsPostUrl, {
          order,
          start,
          limit
        }, this.getSessionHeader(session),
        'form')
    }
    return this.request(this.urls.goodsPostUrl, {
        order,
        start,
        limit,
        status
      }, this.getSessionHeader(session),
      'form')
  },

  getCoursePost(session, id) {
    return this.request(this.urls.coursePostUrl + id, {}, this.getSessionHeader(session))
  },

  getGoodsPost(session, id) {
    return this.request(this.urls.goodsPostUrl + id, {}, this.getSessionHeader(session))
  },

  createCoursePost(session, data) {
    return this.request(this.urls.coursePostUrl, data, this.getSessionHeader(session), 'json', 'POST')
  },

  createGoodsPost(session, data) {
    return this.request(this.urls.goodsPostUrl, data, this.getSessionHeader(session), 'json', 'POST')
  },

  editCoursePost(session, data, id) {
    return this.request(this.urls.coursePostUrl + id, data, this.getSessionHeader(session), 'json', 'PUT')
  },

  editGoodsPost(session, data, id) {
    return this.request(this.urls.goodsPostUrl + id, data, this.getSessionHeader(session), 'json', 'PUT')
  },

  getMyCoursePost(session, data) {
    return this.request(this.urls.myCoursePostUrl, data, this.getSessionHeader(session), 'form')
  },

  getMyGoodsPost(session, data) {
    return this.request(this.urls.myGoodsPostUrl, data, this.getSessionHeader(session), 'form')
  },

  viewCoursePostContact(session, postId) {
    return this.request(this.urls.viewCoursePostContactUrl, {
      postId
    }, this.getSessionHeader(session), 'json', 'PUT')
  },

  viewGoodsPostContact(session, postId) {
    return this.request(this.urls.viewGoodsPostContactUrl, {
      postId
    }, this.getSessionHeader(session), 'json', 'PUT')
  },

  getCoursePostRemainingViewCount(session) {
    return this.request(this.urls.viewCoursePostContactUrl, {}, this.getSessionHeader(session))
  },

  getGoodsPostRemainingViewCount(session) {
    return this.request(this.urls.viewGoodsPostContactUrl, {}, this.getSessionHeader(session))
  },

  getSharedPost(fuzzyPostId) {
    return this.request(this.urls.sharedCoursePostUrl + fuzzyPostId, {}, {})
  },

  postShare(postId, post_type, student_id) {
    let data = {
      postId: Number.parseInt(postId),
      post_type: Number.parseInt(post_type)
    }
    if (student_id) data['student_id'] = student_id
    return this.request(this.urls.shareCoursePostNoticeUrl, data, {}, 'json', 'POST')
  },

  getSharedProfile(user_id) {
    return this.request(this.urls.sharedProfileUrl + user_id, {}, {})
  },

  getSharedProfileImage(user_id) {
    return this.download(this.urls.sharedProfileImage + user_id + '/image?path=' +
      encodeURIComponent('pages/me/profile/profile?uid=' + user_id + '&shared=1'))
  },

  getSharedCoursePostImage(post, user_id) {
    let params = []
    if (post.demand.course) params.push('demand=' + post.demand.course.id)
    if (post.supply.course) params.push('supply=' + post.supply.course.id)
    if (user_id) params.push('student_id=' + user_id)
    let param = params.join('&')
    let url = this.urls.sharedCoursePostImage + post.id + '/image?path=' +
      encodeURIComponent('pages/course/share/sharedPost?id=' + post.fuzzy_id) + '&' + param
    console.log(url)
    return this.download(url)
  },

  profileShare(student_id) {
    let data = {
      student_id
    }
    return this.request(this.urls.shareProfileNoticeUrl, data, {}, 'json', 'POST')
  },

  showLoading(options) {
    if (wx.showLoading) {
      wx.showLoading(options)
    } else {
      this.showCompatibleWarning('显示加载UI')
    }
  },

  hideLoading() {
    if (wx.hideLoading) {
      wx.hideLoading()
    }
  },

  chooseImage(max_count = 1) {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: max_count,
        sizeType: ['compressed'],
        success(res) {
          resolve(res.tempFiles ? res.tempFiles : res.tempFilePaths)
        },
        fail(res) {
          reject()
        }
      })
    })
  },

  getUploadToken(session, ext = 'jpg') {
    let data = {
      ext
    }
    return this.request(this.urls.uploadTokenUrl, data, this.getSessionHeader(session), 'json', 'POST')
  },

  uploadImage(files) {
    if (files.length > 0) {
      let taskObj = {}
      let index = 0
      let lastPromise = null
      while (index < files.length) {
        if (lastPromise) {
          lastPromise = lastPromise
            .then(res => {
              console.log(res)
              return wxw.upload()
            })
        }
      }
    }
  },

  uploadImageCallback(session, results) {

  }
}

module.exports = wxw
