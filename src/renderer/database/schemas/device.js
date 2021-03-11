export const deviceSchema = {
  title: 'device schema',
  version: 0, // <- incremental version-number
  description: '双编设备',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true // <- this means: unique, required, string and will be used as '_id'
    },
    deviceName: {
      type: 'string',
    },
    workplace: {
      type: 'string',
    }
  },
  required: ['color']
}
