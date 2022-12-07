const schedulerDict = {
    dpm: 'DPM',
    euler: 'Euler',
    euler_ancestral: 'Euler Ancestral',
    lms: 'LMS',
    plms: 'PLMS',
    ddim: 'DDIM',
}

// create list
const schedulers = Object.keys(schedulerDict).map((key) => ({ key, value: schedulerDict[key] }))

export default schedulers