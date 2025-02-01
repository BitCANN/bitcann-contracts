# BitCANN
Bitcoin Cash for Assigned Names and Numbers


### Contract Description

1. RegistrationContract
2. StartRegistration
3. Bid
4. RevealName
5. DomainFactroy
6. Domain
7. ProveInvalidDomain
8. RemoveIllegalRegistration
9. ResolveRegistrationConflict


#### RegistrationContract

The Registration contract contains NFTs with the domain category that have scriptHash of the contract which with the contract interacts with. [5-10 threads each] `require(inputs[0].nftCommitment == lockingBytecode)`. These contracts are tightly locked with each other.


All the transactions made with registration contract should have the `lockingbytecode` of the target contract in it's nftCommitment and should be 0th index. The target contract's NFT should be 1st index.  Rest of the restrictions on inputs and outputs are done by the target contract. It's ok to trust all the convanents places by this target contract as it's been whitelisted before deployment.


#### StartRegistration




### FAQs

#### How are the domains sold?
Auction, the auction starts with 0.025 BCH as the starting about, any new bid must be 5% higher than the previous bid. By default, the auction ends in 144 blocks (i.e 1 day) but if any new bid is added the auction is extended further by 72 blocks. However, if the auction has > 72 blocks left then no changes to the deadline are made.

#### How gets the money from auction?
For the first 2 years, the split if 50% to miners and 50% to the development team after which it's 100% assigned to miners.

#### Are the names revealed upfront?
No, the auction begins by the interested party providing a hash256(name) which is 32 bytes. Only the interested parties in the domain can know by hashing the name they desire.

#### When is the name revealed?
The names are revealed when the auction ends, anyone or the winning bidder can make a transaction revealing the name in an OP_RETURN.

#### What type of names does it support?
- Letters (a-z or A-Z)
- Numbers (0-9)
- Hyphens (-)

#### How is the correctness of the name verified?
Once the name is revealed the bidder has to wait atleast 2 blocks to claim the domain. This interval provide an opportinity to anyone how can prove that the domain is invalid by providing the name and index of the invalid character. If the name is indeed invalid, the funds are transfered to the party who proved the name to be invalid as reward for keep in system in check. `proveDomainInvalid`

#### How are auctions created?
The creation of auction is single-threaded i.e a single NFT with minting capaility is used to create new auctions, each new auction is given an auctionID. For example: If the current value of the NFT's commitment is 7 then any new auction that is created will have the auctionID of 8. Along with the minting NFT, 2 more NFTs are issued as part of the auction creation process.
part0: auctionID(8 bytes) + nameHash(32 bytes) + value(0.025 BCH)
part1: auctionID(8 bytes) + auctionEndBlock(4 bytes) + bidderLockingBytecode(25 bytes) + isNameRevealed(1 byte)

It is important to understand that the auctionID can also be seen as registrationID, the reasoning for it will be explained later.

#### What if two auctions from the same name are running?
Since auctionIDs increase linearly, the auctionID with the higher number will be considered invalid. Anyone can provide the two competting auctionIDs along with the two pair NFTs and burn the invalidAuction and take away the funds from the invalid auction as a reward for keeping the system in check.

#### I won the bidding contest, how do I claim the domain?
Once you have revealed the name and waited for atleast 2 blocks, you can claim the domain for yourself. Each domain has a unique contract assigned exclusively for itself. When claiming, a new auth + 

#### Why heartbeat?
If the domain has been inactive for > 2 years then the domain is considered as abandoned and anyone can prove the inactivity and burn the auth+heartbeat NFT to make the auction of auction possible.


#### Why has ID+heartBeat NFT in the domain contract?
why attach auctionID to the auth/heartbeat NFT? because if there comes a time when the domain is
auctioned off again then the ownership 'NFT' still exists somewhere in the real world. This means 
even if the NFT exists. The structure of the ownership NFT is 'auctionID+nameHash' 

Since the Domain contract has the ID+heartbeat NFT and the ownership NFT has the auctionID + nameHash
there are always used together whenever adding or removing records from the Domain contract.

So if the new auction even happens, then the new owner of the domain can burn the previous IDheartbeat NFT so that the previous owner cannot come out of the blue resulting in two conflicting owners. The new owner shall be the real owner of the domain.

#### An illegal registration auction has started for a domain that is owner by someone, will there be two owners?
Anyone can provide the auth+heartbeat NFT form the domain Contract by using the `externalUse` function and prove that the auction is illegal and take away the funds from the auction.


#### Can a bid be cancelled?
No, If a bid it made, it's locked in. Whoever wins the registration auction of the domain can later put it for sale in a secondary market.
