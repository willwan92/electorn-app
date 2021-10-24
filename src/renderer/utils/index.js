import fs from 'fs'

export function parseTime (time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (('' + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const timeStr = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    if (key === 'a') return ['一', '二', '三', '四', '五', '六', '日'][value - 1]
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return timeStr
}

export function formatTime (time, option) {
  time = +time * 1000
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) { // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time, option)
  } else {
    return d.getMonth() + 1 + '月' + d.getDate() + '日' + d.getHours() + '时' + d.getMinutes() + '分'
  }
}

export function trimAllSpace (str) {
  if (typeof str !== 'string') {
    throw new Error('str is not a string')
  }
  return str.replace(/\s/g, '')
}

export async function saveFile ({ filePath, fileName, fileType, fileData, num = 0 }) {
  const fullPath = num ? `${filePath}/${fileName}(${num}).${fileType}` : `${filePath}/${fileName}.${fileType}`
  fs.writeFile(fullPath, fileData, { flag: 'ax' }, (err) => {
    if (!err) {
      Promise.resolve()
    } else {
      if (err.code === 'EEXIST') {
        this.saveFile({ filePath, fileName, fileType, fileData, num: num + 1 })
      } else {
        Promise.reject(err)
      }
    }
  })
}

/**
 * 获取一个操作票的所有步骤中的指定的步骤
 * @param {Array} steps 一个操作票的所有步骤
 * @param {String} type 指定的类型
  'all': '所有步骤',
  'any': '存在一个步骤',
  'first': '任务的第一步',
  'last': '任务的最后一步',
  'sub-first': '母步骤',
  'other': '其他步骤（除了母步骤、第一步和最后一步）'
 */
export function getSelectedSteps (steps, type) {
  if (type === 'all' || type === 'any') {
    return steps
  }

  let res = []
  if (type === 'first') {
    res.push(steps[0])
    return res
  }

  const len = steps.length
  if (type === 'last') {
    const lastStep = steps[len - 1]
    if (!Array.isArray(lastStep)) {
      res.push(lastStep)
    } else {
      const subLen = lastStep.length
      res.push(lastStep[subLen - 1])
    }
    return res
  }

  // 获取母步骤或其他步骤（除了母步骤、第一步和最后一步）
  let step
  for (let i = 1; i < len; i++) {
    step = steps[i]
    if (type === 'sub-first') {
      if (Array.isArray(step)) {
        // 母步骤
        res.push(step[0])
      }
    }

    if (type === 'other') {
      if (Array.isArray(step)) {
        for (let j = 1, length = step.length; j < length; j++) {
          if (i !== len - 1) {
            // 其他步骤
            res.push(step[j])
          } else {
            if (j !== length - 1) {
              // 其他步骤
              res.push(step[j])
            }
          }
        }
      } else {
        if (i !== len - 1) {
          // 其他步骤
          res.push(step[i])
        }
      }
    }
  }

  return res
}
