import { auction } from './contracts/auction.js'
import { bid } from './contracts/bid.js'
import { auctionConflictResolver } from './contracts/conflict-resolver.js'
import { nameEnforcer } from './contracts/name-enforcer.js'

const main = async () => {
  // await auction()
  // await bid()
  // await auctionConflictResolver()
  await nameEnforcer()
}

main()