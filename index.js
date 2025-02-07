import { auction } from './src/auction.js'
import { bid } from './src/bid.js'

const main = async () => {
  await auction()
  // await bid()
}

main()