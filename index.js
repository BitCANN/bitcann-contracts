import { auction } from './src/auction.js'
import { bid } from './src/bid.js'
import { auctionConflictResolver } from './src/conflict-resolver.js'
import { nameEnforcer } from './src/name-enforcer.js'

const main = async () => {
  // await auction()
  // await bid()
  // await auctionConflictResolver()
  await nameEnforcer()
}

main()