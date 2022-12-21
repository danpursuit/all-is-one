const interpDict = {
    Linear: 'Linear',
    Quadratic: 'Quadratic',
    Cubic: 'Cubic',
}
export const interps = Object.keys(interpDict).map((key) => ({ key, value: interpDict[key] }))
const seedBehaviorDict = {
    random: 'Random',
    iter: 'Increase By One',
    fixed: 'Fixed',
}
export const seedBehaviors = Object.keys(seedBehaviorDict).map((key) => ({ key, value: seedBehaviorDict[key] }))
