import { main as auction } from './transactions/auction.js'
import { main as bid } from './transactions/bid.js'
import { main as auctionConflictResolver } from './transactions/conflict-resolver.js'
import { main as nameEnforcer } from './transactions/name-enforcer.js'
import { main as domainFactory } from './transactions/domain-factory.js'
import { main as ownershipGuard } from './transactions/ownership-guard.js'
import { main as addRecord } from './transactions/addRecord.js'
import { main as mocknetSetup } from './common/mocknet-setup.js'

const main = async () => {
  const args = process.argv.slice(2);
  if (args.includes('mainnet')) {
    // await auction()
    // await bid()
    // await auctionConflictResolver()
    // await nameEnforcer()
    // await domainFactory()
    // await ownershipGuard()
    await addRecord()
  } else {
    await mocknetSetup()
    await auction()
    await bid()
    // await auctionConflictResolver()
    // await nameEnforcer()
    // await domainFactory()
    // await ownershipGuard()
  }
}

main()
