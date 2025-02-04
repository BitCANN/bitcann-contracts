# BitCANN
Bitcoin Cash for Assigned Names and Numbers

## Table of Contents
1. [Features](#features)
2. [Overview](#overview)
   - [Operational Contracts](#operational-contracts)
   - [Guard Contracts](#guard-contracts)
   - [Domain Contracts](#domain-contracts)
3. [Contracts](#contracts)
   - [Registry](#registry)
   - [Auction](#auction)
   - [Bid](#bid)
   - [DomainFactory](#domainfactory)
   - [DomainNameShield](#domainnameshield)
   - [IllegalRegistration](#illegalregistration)
   - [RegistrationConflict](#registrationconflict)
   - [Domain](#domain-contract)
4. [FAQs](#faqs)
   - [How are the domains sold?](#how-are-the-domains-sold)
   - [How gets the money from auction?](#how-gets-the-money-from-auction)
   - [Are the names revealed upfront?](#are-the-names-revealed-upfront)
   - [When is the name revealed?](#when-is-the-name-revealed)
   - [What type of names does it support?](#what-type-of-names-does-it-support)
   - [How is the correctness of the name verified?](#how-is-the-correctness-of-the-name-verified)
   - [How are auctions created?](#how-are-auctions-created)
   - [What if two auctions from the same name are running?](#what-if-two-auctions-from-the-same-name-are-running)
   - [I won the bidding contest, how do I claim the domain?](#i-won-the-bidding-contest-how-do-i-claim-the-domain)
   - [Why heartbeat?](#why-heartbeat)
   - [Why has ID+heartBeat NFT in the domain contract?](#why-has-idheartbeat-nft-in-the-domain-contract)
   - [An illegal registration auction has started for a domain that is owner by someone, will there be two owners?](#an-illegal-registration-auction-has-started-for-a-domain-that-is-owner-by-someone-will-there-be-two-owners)
   - [Can a bid be cancelled?](#can-a-bid-be-cancelled)
   - [What consists of the ownership NFT?](#what-consists-of-the-ownership-nft)
   - [What happens if they renounce ownership?](#what-happens-if-they-renounce-ownership)
   - [How will any party initiate the auction?](#how-will-any-party-initiate-the-auction)
   - [What is a heartbeatNFT?](#what-is-a-heartbeatnft)
   - [What is Registration Counter NFT?](#what-is-registration-counter-nft)
   - [What is Registration Pair NFTs?](#what-is-registration-pair-nfts)
   - [How are other contracts dealing with the Registry Contract?](#how-are-other-contracts-dealing-with-the-registry)
   - [What is the structure of the Domain contract?](#what-is-the-structure-of-the-domain-contract)
   - [What type of record can be added?](#what-type-of-record-can-be-added)

### Features

- Decentralised domain names like `.sat` and `.bch`
- Add/Remove records, currency addresses, text records, social, email and custom records
- No expiry/renewals
- Domain ownership is an NFT, providing proof of ownership and enabling secondary market trading.
- Lookup as easy as fetching transaction history
- Sign-In using your identity
- Indexer needed only for heavy usage apps/services
- Earn by protecting the system by:
   - Burning illegal registrations attempts
   - Identifying and burning registration conflicts
   - Proving domain violations


## Overview

There are a total of 8 contracts. These contract can be divided into 3 different categories to understand the system.

- **Operational Contracts**: [Registry.cash](#registry) [Auction.cash](#auction), [Bid.cash](#bid), [DomainFactory.cash](#domainfactory)

- **Guard Contracts**: [DomainNameShield.cash](#domainnameshield), [IllegalRegistration.cash](#illegalregistration), [RegistrationConflict.cash](#registrationconflict)

- **Domain Contract**: [Domain.cash](#domain-contract)

#### Operational Contracts

The Registry contract functions as the control and storage hub. All authorized contracts (both Operational and Guard) must execute their transactions in conjunction with the Registry contract.

The contracts operate in a unidirectional flow:
- The Auction contract initiates the registration process,
- The Bid contract updates the bid amount and bidder information for the on going auction.
- Once the auction is complete, the DomainFactory contract distributes the ownership NFTs, and fees.


#### Guard Contracts

These contracts serve the purpose is to incentivise the enforcement of the rules. For example, if someone were to start a registration for a domain that is already owned then `IllegalRegistration` contract will authorize anyone to provide proof of ownership of the domain and penalise the illegal auction by burning the registration and giving the funds to the proof provider.

Similarly, other contracts also provide a way to authorize anyone to penalise anyone who attempts to breaks the rule of the system. 

#### Domain Contracts

Each `Domain` contract is unique and is controlled by anyone who has the Ownership NFT relevant to that Domain contract. One can aquire the ownership NFT by following the registration process or buying it from a secondary market or by simply receiving it in a regular transaction.

All the other contract work together to finally produce a pair NFT where one exists in the Domain contract(**Heartbeat NFT**) and the other exists with the owner (**Ownership NFT**).

Note: To interact with the domain one must use both NFTs together.


## Contracts

#### Registry

The Registry contract provides authorization and storage:

1. **Counter NFT**: Minting NFT with domain category that increments by 1 with each new registration.
2. **Authorization NFT**: Multiple immutable NFTs containing lockingBytecodes of authorized contracts. (Operational and Guard Contracts)
3. **Registration NFT Pair**: The Auction contract issues a pair NFT (one mutable and one immutable) that stay with the Registry Contract

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry contract's immutable NFT | Registry contract's NFT returned unchanged |
| 1 | Authorized contract's UTXO | Authorized contract's UTXO returned unchanged |

Note: The actual number and structure of inputs/outputs and covanents beyond this pair is controlled by the authorized contract being used.

Each authorized contract has a designated number of threads:
- Auction: 1 thread (single-threaded registration)
- Bid: ~5 threads
- DomainFactory: ~5 threads
- DomainNameShield: ~5 threads
- IllegalRegistration: ~5 threads
- RegistrationConflict: ~5 threads


#### Auction

   The Auction contract starts a new auction. Each auction requires:
   - A minimum starting bid of atleast 0.025 BCH
   - Runs for 144 blocks (~1 day), extended by 72 blocks if bid made near end (i.e less than 72 blocks were remaining)
   - Creates two NFT pairs to track the auction state:
     1. Immutable NFT containing registrationId (8 bytes) + name (bytes). The satoshis held by this NFT is the bid value.
     2. Mutable NFT containing registrationId (8 bytes) + auctionEndBlock (4 bytes) + bidderLockingytecode (25 bytes)

   Transaction Structure:
   | # | Inputs | Outputs |
   |---|--------|---------|
   | 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
   | 1 | Any input from this contract | Input1 back to this contract without any change |
   | 2 | Counter NFT from Registry contract (Increases the registrationId by 1 in the output) | Counter NFT going back to the Registry contract |
   | 3 | Funding UTXO | RegistrationPair0 to the Registry contract |
   | 4 | | RegistrationPair1 to the Registry contract |
   | 5 | | Optional change in BCH |


#### Bid

The Bid contract allows updating the bid amount on active domain registration auctions by the new bidder. Each update must:
- Be at least 5% higher than the previous bid
- Extend auction by 72 blocks if placed when < 72 blocks remain
- Return previous bidder's funds in same transaction
- Update NFT pairs tracking auction state:
  1. Immutable NFT with registrationId (8 bytes) + name (bytes) + new bid value
  2. Mutable NFT with registrationId (8 bytes) + updated auctionEndBlock (4 bytes) + new bidder's lockingBytecode (25 bytes)

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
| 1 | Any input from this contract | Input1 back to this contract without any change |
| 2 | RegistrationPair0 from the Registry contract | RegistrationPair0 to the Registry contract |
| 3 | RegistrationPair1 from the Registry contract | RegistrationPair1 to the Registry contract |
| 4 | Funding UTXO from new bidder | Previous bid amount returned to previous bidder |
| 5 | | Optional change in BCH to new bidder |


#### DomainFactory

The DomainFactory contract finalizes domain registration auctions by:
- Verifying auction has ended and winner's bid is valid
- Issuing mutable heartbeat NFT to domain contract
- Issuing immutable domain ownership NFT to auction winner 
- Distributing auction fees between platform and miners


Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
| 1 | Any input from this contract | Input1 back to this contract without any change |
| 2 | RegistrationPair0 from the Registry contract | Heartbeat NFT to domain contract |
| 3 | RegistrationPair1 from the Registry contract | Domain Ownership NFT to auction winner |
| 4 | | 50% Platform fee (only for first 4 years) rest to miners |


#### DomainNameShield

The DomainNameShield contract allows anyone to prove a domain name contains invalid characters or the tld is invalid. By providing a proof they burn the registration NFT Pair, taking away the entire amount in the bid as a reward.

Rules:
1. The name must consist of only these characters
   - Letters (a-z or A-Z)
   - Numbers (0-9)
   - Hyphens (-)
2. The name cannot start and end with `-`
3. The name must end with the tld

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
| 1 | Any input from this contract | Input1 back to this contract without any change |
| 2 | RegistrationPair0 (immutable) containing auctionId + name | Reward to caller |
| 3 | RegistrationPair1 (mutable) containing auctionId + endBlock + bidderLockingBytecode | |


#### IllegalRegistration

This prevents registrations for domains that have already been registered and have owners. Anyone can provide proof of a valid ownership and burn the auction registration pair NFTs and claim the funds as reward as reward

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
| 1 | Any input from this contract | Input1 back to this contract without any change |
| 2 | Heartbeat NFT proving active domain ownership | Heartbeat NFT back to domain contract |
| 3 | Registration NFT pair0 | Bid funds to caller as reward |
| 4 | Registration NFT pair1 | |


#### RegistrationConflict

If two registration auctions exist the one with higher registrationID is invalid. Since registration is a single threaded operation such scenarios are highly unlikely to occur.
This contract allows anyone to proving the registration Pair NFts of both auctions, burning the invalid auction pair in the process and taking away the funds as reward for keeping the system in check.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | Registry Contract's immutable NFT with commitment that has the lockingBytecode of this contract | Registry Contract's immutable NFT back to the Registry contract |
| 1 | Any input from this contract | Input1 back to this contract without any change |
| 2 | Valid auction's NFT pair0 (earlier registrationId) | Valid auction's NFT pair0 preserved |
| 3 | Valid auction's NFT pair1 | Valid auction's NFT pair1 preserved |
| 4 | Invalid auction's NFT pair0 (newer registrationId) | BCH change/reward to caller |
| 5 | Invalid auction's NFT pair1 | |

#### Domain Contract

The Domain contract manages individual domain names after they are claimed from auction.

Key aspects:
- Unique contract for each unique domain name
- Requires heartbeat NFT for all operations to prove active ownership
- Enables domain owner to manage records
- Enforces atleast one activity in 2-year

The heartbeat design ensures domains remain under active control while allowing permanent ownership as long as the activity requirement is met.

---

## FAQs

#### How are domains sold?
Domains are sold through a blind auction. The auction starts using the [Auction](#auction) Contract and bids are made using the [Bid](#bid) contract.

#### Who earns from the auction sales?

0 - 4 years:
- 50% to miners
- 50% to development team

4 - forever
- 100% to miners

#### When are names revealed?
During the auction, the domain name exists only as a 32-byte hash in the registrationPairNFT's commitment. After the auction's `auctionEndBlock` is reached and bidding has ended, the name can be revealed by either the winner or any other party using the [RevealName](#revealname) contract. 

To claim domain ownership, the auction winner must:
1. Reveal the actual name that matches the hash
2. Wait at least 2 blocks after revealing. ([why?](#domainnameshield))
3. If no one proves the name invalid during this period, the winner can claim ownership via [DomainFactory](#domainfactory)

#### What makes a name valid??
1. The name must consist of only these characters
  - Letters (a-z or A-Z)
  - Numbers (0-9)
  - Hyphens (-)
2. The name cannot start and end with `-`
3. The name must end with tld


#### How is the correctness of the name verified?
Once the name is revealed the winner must wait atleast 2 blocks to claim the domain [[DomainFactory]](#domainfactory). This interval provide an opportinity to anyone how can prove that the domain is invalid by providing the name and index of the invalid character. [[DomainNameShield]](#domainnameshield)

#### How are auctions created?
The creation of auction is single-threaded i.e a single NFT with minting capaility is used to create new auctions, each new auction is given an auctionID. For example: If the current value of the NFT's commitment is 7 then any new auction that is created will have the auctionID of 8. Along with the minting NFT, 2 more NFTs are issued as part of the auction creation process.
part0: auctionID(8 bytes) + name(bytes) + value(0.025 BCH)
part1: auctionID(8 bytes) + auctionEndBlock(4 bytes) + bidderLockingBytecode(25 bytes)

It is important to understand that the auctionID can also be seen as registrationID, the reasoning for it will be explained later.

#### What if two auctions from the same name are running?
Since auctionIDs increase linearly, the auctionID with the higher number will be considered invalid. Anyone can provide the two competting auctionIDs along with the two pair NFTs and burn the invalidAuction and take away the funds from the invalid auction as a reward for keeping the system in check.

#### I won the bidding contest, how do I claim the domain?
Once you have revealed the name and waited for atleast 2 blocks, you can claim the domain for yourself. Each domain has a unique contract assigned exclusively for itself. When claiming, a new auth + 

#### Why heartbeat?
If the domain has been inactive for > 2 years then the domain is considered as abandoned and anyone can prove the inactivity and burn the auth+heartbeat NFT to make the auction of auction possible.

Permanent domain ownership with a 2-year activity requirement
- Domains are owned permanently as long as owners perform at least one on-chain action in a span of 2 years
- If no activity is detected, the domain becomes eligible for re-auction


#### An illegal registration auction has started for a domain that is owner by someone, will there be two owners?
Anyone can provide the auth+heartbeat NFT form the domain Contract by using the `externalUse` function and prove that the auction is illegal and take away the funds from the auction.

#### Can a bid be cancelled?
No, If a bid it made, it's locked in. Whoever wins the registration auction of the domain can later put it for sale in a secondary market.

#### What happens if they renounce ownership?
The owner must call the `renounceOwnership` function of their respective Domain contract.
The function will burn the `heartbeat` NFT that exists in the Domain contract and also burn the 
`ownership` NFT that the owner provides when calling this function. This will ensure that a new
auction can be initiated by any other interested party.


#### How will any party initiate the auction?
If a domain is owned by anyone then the Domain contract representing the domain name must have a `heartbeat` NFT, if anyone tries to create an auction for a domain which has that NFT, they can prove it's existance and penalise the illegal auction by taking away the funds in the Bid and burning the illegal auction's Registation Pair NFTs.

So, if no one can provide the heaertbeat NFT that means the auction is valid and can continue to expect more bids and be sold at a later block.


#### What is Registration Counter NFT?
Registration on BCH is a single threaded operation, which means only 1 auction can initiate at a time. So this restricts any parallel activity for registration. The registration contract has a single NFT from the `domainCategory`, let's call it registrationCounter NFT.
This NFT has minting Capability and it acts as storage. It's nftcommitment increases by 1 for each new auction initiated. The NFT commitment is of 8 bytes starting for 0 at the time of genesis.

#### What is Registration Pair NFTs?
When a new registration beings an auction is created, for each auction there can ever be 2 NFTs that exist as a pair. (This pair exists because of the limited space in the NFT commitment i.e 40 bytes).
So the required information is divided into 2 NFTs and they are always used together in a single transaction.

- (Immutable) NFT with registrationId(8 bytes) + name(bytes) + satoshivalue attached to the utxo
- (Mutable) NFT with registrationId(8 bytes) + AuctionEndBlock(4 bytes) + bidder's lockingBytecode(25 bytes)

If the previous registrationID was 0 then in the output the minting counter NFT that belongs to the Registry contract registationID get's incremented by 1.

The registration pair also stats with the registry contract.

#### What is Domain contract authorization NFT pair?
1. The domain contract holds a mutable NFT (called heartbeat NFT). It's commitment has 2 pieces. registrationID (8 bytes) + lastActivityBlockNumber (4 bytes)
2. The owner of the domain has the immutable NFT (called ownership NFT). It's commitment has 2 pieces. registrationId(8 bytes) + name(bytes)

The owner must use both of these NFT to do the following:
- Add or Remove records
- Renounce Ownership
- Withdraw funds

**Note**: Every time the owner adds or removes any record, the `lastActivityBlockNumber` in the heartbeat NFT gets updated to the current block number.

**Warning**: If a domain remains inactive for more than 2 years (no record updates), the heartbeat NFT can be removed by anyone from the domain contract. This makes the ownershipNFT unusable and the domain becomes eligible for re-auction by any interested party.

#### What happens to the ownershipNFT when the heartbeatNFT is burned?
Since ownershipNFT and heartbeat must have the same registrationID to work with the domain contract, it becomes useless.

#### How do domain or record lookups work?
Domain lookups can be done in multiple ways:
- Find domain contract: Take name, calculate hash256, attach domain contract bytecode, hash to get address
- Find owner: Check who owns the domain NFT
- Find records: Get transaction history of domain contract and check OP_RETURN outputs

#### How does ownership transfer work? 
Ownership transfer is handled simply by transferring the domain NFT to the new owner. The NFT proves ownership rights to the domain.



#### How are records managed?
Records are managed through OP_RETURN outputs:
- Owner can add any type of record (DNS, identity, website, socials, addresses etc)
- Records can be found by checking transaction history
- Records can be removed by creating a transaction with RMV + hash of record to remove

#### How to remove records?

[TBD] 
Records are added as OP_RETURN this means that the data is not stored on chain in any UTXO, it will be read by a dedicated indexer. So, in order to remove a record create a transaction from the domain contract mentioning the keyword `RMV` followed by hash160 of the previous OP_RETURN what you would like to remove, the indexers should not include that record. Or `RMV` and complete OP_RETURN what is supposed to be remove.