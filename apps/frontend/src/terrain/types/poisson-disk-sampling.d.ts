declare module 'poisson-disk-sampling' {
  interface PoissonOptions {
    shape: [number, number]
    minDistance: number
    maxDistance?: number
    tries?: number
  }

  export default class PoissonDiskSampling {
    constructor(options: PoissonOptions)
    fill(): [number, number][]
  }
}