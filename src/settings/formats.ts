export const percent = (value: number) => `${Math.round(value * 100)}%`
export const seconds = (value: number) => `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} s`
