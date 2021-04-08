import _ from 'lodash'
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
      const reg = new RegExp(target.replace(/\.\.\./g, '.+'))
      return reg.test(str)
    }
  },
  notIn: function (str, target) {
    if (!target.includes('...')) {
      return !str['includes'](target)
    } else {
      const reg = new RegExp(target.replace(/\.\.\./g, '.+'))
      return !reg.test(str)
    }
  },
  equal: function (str, target) {
    return str === target
  },
  startsWith: function (str, target) {
    const reg = new RegExp(`^${target}`)
    return reg.test(str)
  },
  endsWith: function (str, target) {
    if (!target.includes('...')) {
      return _.endsWith(str, target)
    } else {
      const specialChar = /[\$\(\)\*\+\.\[\?\\\^\{\|]/g
      const charList = _.uniq(target.match(specialChar))
      let newTarget = target
      charList.forEach(item => {
        newTarget = newTarget.replace(new RegExp(`\\${item}`, 'g'), `\\${item}`)
      })
      newTarget = newTarget.replace(/\\.{3}/g, '.+')
      // '\\(.+时.+分\\)'
      const reg = new RegExp(`${newTarget}$`)
      return reg.test(str)
    }
  }
}
