import { auction } from './src/auction.js'
import { bid } from './src/bid.js'
import { auctionConflictResolver } from './src/auctionconflictresolver.js'
const main = async () => {
  // await auction()
  // await bid()
  await auctionConflictResolver()
}

main()