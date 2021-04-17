/* 正整数 */
export function validatPositiveInt (str) {
  const reg = /^[1-9]\d*$/
  return reg.test(str)
}
