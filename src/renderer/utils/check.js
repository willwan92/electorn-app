export const strUtils = {
  in: function (str, target) {
    return str['includes'](target)
  },
  notIn: function (str, target) {
    return !str['includes'](target)
  },
  equal: function (str, target) {
    return str === target
  },
  startsWith: function (str, target) {
    const reg = new RegExp(`^${target}`)
    return reg.test(str)
  },
  endsWith: function (str, target) {
    const reg = new RegExp(`${target}$`)
    return reg.test(str)
  }
}
