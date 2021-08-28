import _ from 'lodash'

/**
 * 把字符串转成正则表达式格式的字符串
 * @param {String} str 需要转换的字符串
 * @returns {String} 转换后的字符串
 */
function escapeSpecialChar (str) {
  const specialChar = /[$()*+.[?\\^{|]/g
  const charList = _.uniq(str.match(specialChar))
  let newStr = str
  charList.forEach(item => {
    newStr = newStr.replace(new RegExp(`\\${item}`, 'g'), `\\${item}`)
  })
  return newStr.replace(/(\\\.){3}/g, '.+').replace(/\\/g, '\\\\')
}

export const strUtils = {
  /**
   * 判断 source 中是否包含目标字符串 target
   * target支持输入省略号"..."，省略号代表任意字符。
   * @param { String } source 字符串
   * @param { String } target 目标字符串
   * @returns Boolean
   */
  in: function (source, target) {
    if (typeof source !== 'string') {
      throw new Error('source is not a string')
    }
    const str = source.trim()
    if (!target.includes('...')) {
      return str['includes'](target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(newTarget)
      return reg.test(str)
    }
  },
  notIn: function (source, target) {
    if (typeof source !== 'string') {
      throw new Error('source is not a string')
    }
    const str = source.trim()
    if (!target.includes('...')) {
      return !str['includes'](target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(newTarget)
      return !reg.test(str)
    }
  },
  equal: function (source, target) {
    if (typeof source !== 'string') {
      throw new Error('source is not a string')
    }
    const str = source.trim()
    return str === target
  },
  startsWith: function (source, target) {
    if (typeof source !== 'string') {
      throw new Error('source is not a string')
    }
    const str = source.trim()
    if (!target.includes('...')) {
      return _.startsWith(str, target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(`^${newTarget}`)
      return reg.test(str)
    }
  },
  endsWith: function (source, target) {
    if (typeof source !== 'string') {
      throw new Error('source is not a string')
    }
    const str = source.trim()
    if (!target.includes('...')) {
      return _.endsWith(str, target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(`${newTarget}$`)
      return reg.test(str)
    }
  }
}
