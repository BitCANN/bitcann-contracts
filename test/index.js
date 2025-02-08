import { main as auction } from './contracts/auction.js'
import { main as bid } from './contracts/bid.js'
import { main as auctionConflictResolver } from './contracts/conflict-resolver.js'
import { main as nameEnforcer } from './contracts/name-enforcer.js'
import { main as domainFactory } from './contracts/domain-factory.js'

const main = async () => {
  // await auction()
  // await bid()
  // await auctionConflictResolver()
  // await nameEnforcer()
  await domainFactory()
}

main()