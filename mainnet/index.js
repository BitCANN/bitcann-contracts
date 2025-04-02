import { main as auction } from './transactions/auction.js'
// import { main as bid } from './transactions/bid'
// import { main as auctionConflictResolver } from './transactions/conflict-resolver'
// import { main as nameEnforcer } from './transactions/name-enforcer'
// import { main as domainFactory } from './transactions/domain-factory'
// import { main as ownershipGuard } from './transactions/ownership-guard'

const main = async () => {
  await auction()
  // await bid()
  // await auctionConflictResolver()
  // await nameEnforcer()
  // await domainFactory()
  // await ownershipGuard()
}

main()