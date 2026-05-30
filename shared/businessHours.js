export const DEFAULT_BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires'

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DAY_LABELS = {
  domingo: 'domingo',
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miercoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sabado',
}
const WEEKDAY_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function getBusinessOpenStatus(
  businessHours,
  now = new Date(),
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
) {
  if (!hasConfiguredBusinessHours(businessHours)) {
    return {
      configured: false,
      isOpen: true,
      message: '',
      nextOpenText: '',
      scheduleText: '',
      todayKey: '',
      todayLabel: '',
    }
  }

  const localTime = getLocalTimeParts(now, timeZone)
  const todayKey = DAY_KEYS[localTime.dayIndex]
  const yesterdayKey = DAY_KEYS[(localTime.dayIndex + 6) % 7]
  const todaySchedule = normalizeDaySchedule(businessHours?.[todayKey])
  const yesterdaySchedule = normalizeDaySchedule(businessHours?.[yesterdayKey])
  const isOpenToday = isCurrentDayScheduleOpen(todaySchedule, localTime.minutes)
  const isOpenFromYesterday = isPreviousOvernightScheduleOpen(yesterdaySchedule, localTime.minutes)
  const isOpen = isOpenToday || isOpenFromYesterday
  const scheduleText = formatScheduleRange(todaySchedule)
  const nextOpenText = isOpen
    ? ''
    : getNextOpenText(businessHours, localTime.dayIndex, localTime.minutes)

  return {
    configured: true,
    isOpen,
    message: isOpen
      ? ''
      : 'El local esta cerrado ahora. Podes ver el menu, pero los pedidos se habilitan en horario de atencion.',
    nextOpenText,
    scheduleText,
    todayKey,
    todayLabel: DAY_LABELS[todayKey],
  }
}

export function isBusinessOpen(businessHours, now = new Date(), timeZone = DEFAULT_BUSINESS_TIME_ZONE) {
  return getBusinessOpenStatus(businessHours, now, timeZone).isOpen
}

export function formatScheduleRange(schedule) {
  const normalized = normalizeDaySchedule(schedule)

  if (!normalized?.abierto) {
    return 'cerrado'
  }

  return `${normalized.desde} a ${normalized.hasta}`
}

function hasConfiguredBusinessHours(value) {
  if (!value || typeof value !== 'object') {
    return false
  }

  return DAY_KEYS.some((day) => {
    const schedule = value[day]
    return schedule && typeof schedule === 'object' && 'abierto' in schedule
  })
}

function normalizeDaySchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return null
  }

  const desde = normalizeTime(schedule.desde)
  const hasta = normalizeTime(schedule.hasta)

  if (!desde || !hasta) {
    return null
  }

  return {
    abierto: Boolean(schedule.abierto),
    desde,
    hasta,
  }
}

function isCurrentDayScheduleOpen(schedule, currentMinutes) {
  if (!schedule?.abierto) {
    return false
  }

  const start = parseTimeToMinutes(schedule.desde)
  const end = parseTimeToMinutes(schedule.hasta)

  if (start === null || end === null) {
    return false
  }

  if (start === end) {
    return true
  }

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end
  }

  return currentMinutes >= start
}

function isPreviousOvernightScheduleOpen(schedule, currentMinutes) {
  if (!schedule?.abierto) {
    return false
  }

  const start = parseTimeToMinutes(schedule.desde)
  const end = parseTimeToMinutes(schedule.hasta)

  if (start === null || end === null || start <= end) {
    return false
  }

  return currentMinutes < end
}

function getNextOpenText(businessHours, currentDayIndex, currentMinutes) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayIndex = (currentDayIndex + offset) % 7
    const key = DAY_KEYS[dayIndex]
    const schedule = normalizeDaySchedule(businessHours?.[key])

    if (!schedule?.abierto) {
      continue
    }

    const start = parseTimeToMinutes(schedule.desde)

    if (start === null) {
      continue
    }

    if (offset === 0 && start <= currentMinutes) {
      continue
    }

    const label = offset === 0 ? 'Hoy' : capitalize(DAY_LABELS[key])
    return `${label} abre a las ${schedule.desde}`
  }

  return ''
}

function getLocalTimeParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const dayIndex = WEEKDAY_TO_INDEX[values.weekday] ?? now.getDay()
  const hour = Number(values.hour) % 24
  const minute = Number(values.minute)

  return {
    dayIndex,
    minutes: hour * 60 + minute,
  }
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return null
  }

  const hour = Math.min(Math.max(Number(match[1]), 0), 23)
  const minute = Math.min(Math.max(Number(match[2]), 0), 59)

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parseTimeToMinutes(value) {
  const normalized = normalizeTime(value)

  if (!normalized) {
    return null
  }

  const [hour, minute] = normalized.split(':').map(Number)
  return hour * 60 + minute
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
