const schedulerDict = {
    euler: 'Euler',
    euler_ancestral: 'Euler Ancestral',
    lms: 'LMS',
    pndm: 'PNDM',
}

// create list
const schedulers = Object.keys(schedulerDict).map((key) => ({ key, value: schedulerDict[key] }))

export default schedulers