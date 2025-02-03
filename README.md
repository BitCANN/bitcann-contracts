# BitCANN
Bitcoin Cash for Assigned Names and Numbers


### Contract Description


1. Registration
2. RegistrationAuction
3. Bid
4. RevealName
5. DomainFactroy
6. Domain
7. ProveInvalidDomain
8. IllegalRegistration
9. RegistrationConflict


#### Registry


The Registration contract contains NFTs with the domain category that have scriptHash of the contract which with the contract interacts with. [5-10 threads each] `require(inputs[0].nftCommitment == lockingBytecode)`. These contracts are tightly locked with each other.


All the transactions made with registration contract should have the `lockingbytecode` of the target contract in it's nftCommitment and should be 0th index. The target contract's NFT should be 1st index.  Rest of the restrictions on inputs and outputs are done by the target contract. It's ok to trust all the convanents places by this target contract as it's been whitelisted before deployment.


#### RegistrationAuction

Input0


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

#### What consists of the ownership NFT?
It has information in two parts in the NFT commitment, 8 bytes is the registrationID and 32 bytes is the nameHash (Domain name hashed). The capability of the NFT is immutable. Whoever has the NFT has the capability to add or remove records, they can also renounce ownership.

#### What happens if they renounce ownership?
The owner must call the `renounceOwnership` function of their respective Domain contract.
The function will burn the `heartbeat` NFT that exists in the Domain contract and also burn the 
`ownership` NFT that the owner provides when calling this function. This will ensure that a new
auction can be initiated by any other interested party.


#### How will any party initiate the auction?
If a domain is owned by anyone then the Domain contract representing the domain name must have a `heartbeat` NFT, if anyone tries to create an auction for a domain which has that NFT, they can prove it's existance and penalise the illegal auction by taking away the funds in the Bid and burning the illegal auction's Registation Pair NFTs.

So, if no one can provide the heaertbeat NFT that means the auction is valid and can continue to expect more bids and be sold at a later block.

#### What is a heartbeatNFT?

#### What is Registration Counter NFT?
Registration on BCH is a single threaded operation, which means only 1 auction can initiate at a time. So this restricts any parallel activity for registration. The registration contract has a single NFT from the `domainCategory`, let's call it registrationCounter NFT.
This NFT has minting Capability and it acts as storage. It's nftcommitment increases by 1 for each new auction initiated. The NFT commitment is of 8 bytes starting for 0 at the time of genesis.

#### What is Registration Pair NFTs?
When a new registration beings an auction is created, for each auction there can ever be 2 NFTs that exist as a pair. (This pair exists because of the limited space in the NFT commitment i.e 40 bytes).
So the required information is divided into 2 NFTs and they are always used together in a single transaction.

- (Immutable) NFT with registrationId(8 bytes) + nameHash(32 bytes) + satoshivalue attached to the utxo
- (Mutable) NFT with registrationId(8 bytes) + registrationAuctionEndBlock(4 bytes) + bidder's lockingBytecode(25 bytes) + isNameRevealed flag(1 byte)

If the previous registrationID was 0 then in the output the minting counter NFT that belongs to the Registry contract registationID get's incremented by 1.

The registration pair also stats with the registry contract.


#### How are other contracts dealing with the Registry Contract?
1. We already have determined the tokenCategory for this domain system.
2. The registry contract has immutable NFTs that have P2SH lockingBytecode stored as NFTCommitment and have the same tokenCategory as that of the domainCategory.
3. All this happens at the genesis time i.e before the contracts are functional

nftCommitment => (lockingBytecodeP2SH32)

Registry contract says that I don't care how many inputs and outputs are used, as long as my own utxo is the 0th index input and output
and, some contract that has the same lockingbytecode that I have stored in the NFTcommitment of my 0th input.

Let's say the lockingBytecode of the Bid Contract is `abc` then in the genesis if 5 NFTs were created with category the same as domainCategory and their
NFT commitment as `abc` then it's a 5 threaded system which means, 5 transaction can be executed parallely consuming one of these 5 NFTs as the 0th input and 
1st input being the contract that `abc` as it's lockingbytecode.

So in a way registry contract as whitelisted a list of contract that can be execute along with the itself.


Registry Contract also acts as a storage contract


#### What is the structure of the Domain contract?
A domain contract is a 1-of-1, each unique domain has a single owner and a single contract.

#### What type of record can be added?

Anything, the records exists as an OP_RETURN. The owner of the domain makes these 'addRecord' calls. 
The record can be any from DNS configuration to identity, to website, so socials and/or addresses.




npm => bitcann.js


findAddress({ type: 'BCH', name: 'kuldeep.sat' })

1. bytecode = hash256(kuldeep.sat) + domainContractLockingBytecode
2. scriptHash = hash160(bytecode)
3. scriptHashToCashAddress(scriptHash)
4. Fetch the transacitonHistory.

(kuldeep.sat -> address)





1. OP_RETURNS (Records)

10 transacvtion:

A 192.u10293820913.

kuldeep.sat  -> 192.32131232131

MX
NS -> 

await bitcann.addRecord('TXT', 'uvkbhhulkdjtyrhxfgn hvbiukt6rutdjyhxfchgvjiluoeu56drycfhgv')



regisration + nameHash

kuldeep.sat -> nameHash

chainGraph, who owner? address -> ()


TXT 

AAAA CNAME, wwebside

bchaddress (address)
evmaddress (address)
