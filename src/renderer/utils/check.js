import _ from 'lodash'

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
   * 判断字符串 str 中 是否包含目标字符串 target
   * @param { String } str 字符串
   * @param { String } target 目标字符串
   * @returns Boolean
   */
  in: function (str, target) {
    if (!target.includes('...')) {
      return str['includes'](target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(newTarget)
      return reg.test(str)
    }
  },
  notIn: function (str, target) {
    if (!target.includes('...')) {
      return !str['includes'](target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(newTarget)
      return !reg.test(str)
    }
  },
  equal: function (str, target) {
    return str === target
  },
  startsWith: function (str, target) {
    if (!target.includes('...')) {
      return _.startsWith(str, target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(`^${newTarget}`)
      return reg.test(str)
    }
  },
  endsWith: function (str, target) {
    if (!target.includes('...')) {
      return _.endsWith(str, target)
    } else {
      const newTarget = escapeSpecialChar(target)
      const reg = new RegExp(`${newTarget}$`)
      return reg.test(str)
    }
  }
}
