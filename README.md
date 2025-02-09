# BitCANN
Bitcoin Cash for Assigned Names and Numbers

## Table of Contents
1. [Features](#features)
1. [NFTs](#nfts)
2. [Contracts](#overview)
   - [Operational Contracts](#operational-contracts)
      - [Registry](#registry)
      - [Auction](#auction)
      - [Bid](#bid)
      - [DomainFactory](#domainfactory)
   - [Guard Contracts](#guard-contracts)
      - [DomainNameShield](#domainnameshield)
      - [IllegalRegistration](#illegalregistration)
      - [RegistrationConflict](#registrationconflict)
   - [Domain Contracts](#domain-contracts)
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

- Decentralised domain names like `.sat` and `.bch` and more.
- Add/Remove records, RPA Pay Codes, build social platforms, add currency addresses, text records, social, email, custom records and more.
- No Renewals or Expiry*
- NFT Domain ownership, enabling secondary market trading.
- Easy lookups
- Sign-In using your identity
- Indexers only for heavy usage apps/services
- Earn by protecting the system by:
   - Burning illegal registrations attempts
   - Identifying and burning registration conflicts
   - Proving domain violations


### NFTs

Note: All the NFTs belong to the same Category i.e `domainCategory`

#### RegistrationNFTs
A pair of minting NFTs that reside within the [Registry.cash](#registry) contract, consisting of:
   - **CounterNFT**: A minting NFT has nftCommitment that starts from 0 and increments by 1 with each new registration. It is also initialized with the maximum possible token amount of `9223372036854775807` that interacts with [Auction.cash](#auction) to facilitate the creation of new auction NFTs. Based on the value of the new registrationID the new minted AuctionNFT gets the exact tokenAmount. [FAQ](#what-if-the-tokenamount-in-the-counternft-runs-out)
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes >
      - `tokenAmount`: Keeps reducing with each new registration.
   - **DomainMintingNFT**: A minting NFT that works with [DomainFactory.cash](#domainfactory) to issue new Domain NFTs. This has no nftCommitment or tokenAmount.
      - `category`: domainCategory

#### AuctionNFT
A mutable NFT created for each new auction that remains within [Registry.cash](#registry), containing comprehensive auction information through the following attributes:
   - `nftCommitment`: A combination of `bidderPKH< 20 bytes > + name < bytes >`
   - `tokenAmount`: This represents the registrationID
   - `capability`: Mutable
   - `satoshis`: The latest bid amount
   - `category`: The designated domainCategory
   A new bid simply updates the pkh in the nftCommitment and updates the satoshi value to the new amount.

#### AuthorizedThreadNFTs
Each authorized contract's lockingbytecode(Excluding [Domain.cash](#3-domain)) is added to an immutable NFT commitment. These immutable NFTs stay with `Registry.cash`. Any interaction with the registry must include one of these thread NFTs to create a transaction.
   - `category`: domainCategory
   - `commitment`: lokingbytecode <35 bytes>

The Registry Contract has a designated number of threads for authorized contract:
- Auction: ~5 thread
- Bid: ~5 threads
- DomainFactory: ~5 threads
- AuctionNameEnforcer: ~5 threads
- DomainOwnershipGuard: ~5 threads
- AuctionConflictResolver: ~5 threads

#### DomainNFTs
A set of three immutable NFTs minted when an auction ends:
   - **OwnershipNFT**: This NFT proves ownership of a specific domain.
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes > + name < bytes >

   - **InternalAuthNFT**: A specialized authorization NFT that resides within the Domain contract and must be used together with the OwnershipNFT to enable the owner's interaction with [Domain.cash](#3-domain).
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes >

   - **ExternalAuthNFT**: A specialized authorization NFT that resides within the Domain Contract  but can be attached to any transaction, particularly utilized by [DomainOwnershipGuard.cash](#domainownershipguard) to prove existing domain ownership and enforce penalties on illegal auction attempts.
      - `category`: domainCategory

If the domain has been inactive for > 2 years then the domain is considered as abandoned and anyone can prove the inactivity and burn the Internal and external Auth NFTs to make the auction of auction possible.

## Contracts

There are a total of 8 contracts. These contract can be divided into 3 different categories to understand the system.

- **Operational Contracts**: [Registry.cash](#registry) [Auction.cash](#auction), [Bid.cash](#bid), [DomainFactory.cash](#domainfactory)

- **Guard Contracts**: [AuctionNameEnforcer.cash](#auctionnameenforcer), [DomainOwnershipGuard.cash](#domainownershipguard), [AuctionConflictResolver.cash](#auctionconflictresolver)

- **Domain Contract**: [Domain.cash](#3-domain)

### 1. Operational Contracts

These contracts work together to ultimatly provide ownerhip to the Owner.


It contains 
The contracts operate in a unidirectional flow:
- The Auction contract initiates the registration process,
- The Bid contract updates the bid amount and bidder information for the on going auction.
- Once the auction is complete, the DomainFactory contract distributes the ownership NFTs, and fees.


#### Registry

The Registry contract functions as the control and storage hub. All authorized contracts (both Operational and Guard) must execute their transactions in conjunction with the Registry contract.

This contract holds both RegistrationNFTs, and AuctionNFTs.


Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFTs](#registrationnfts) Counter NFT | [RegistrationNFTs](#registrationnfts) Counter NFT, with nftCommitment incremented by 1 and tokenAmount recreased by NewRegistrationID |
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |

Note: The actual number and structure of inputs/outputs and covanents beyond this pair is controlled by the authorized contract being used.


#### Auction

   The Auction contract starts a new auction. Each auction requires:
   - A minimum starting bid of atleast 0.025 BCH
   - Runs for atleast a day, the clock resets with new bid.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) |
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [RegistrationNFTs](#registrationnfts) Counter NFT | [RegistrationNFTs](#registrationnfts) Counter NFT, with nftCommitment incremented by 1 and tokenAmount decreased by NewRegistrationID |
| 3 | Funding UTXO from bidder | [AuctionNFT](#auctionnft) |
| 4 | | OP_RETURN revealing the name |
| 5 | | Optional change in BCH |


#### Bid

The bid contract allows anyone to bid on a active auction by allowing restricted manupulation of auctionNFT. It updates the bid amount and the pkh in the nftCommitment. The only condition is that the new Bid amount must be at least 5% higher.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) |
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [AuctionNFT](#auctionnft) | [AuctionNFT](#auctionnft) with increased amount and updated commitment |
| 3 | Funding UTXO from new bidder | Previous bid amount returned to previous bidder |
| 4 | | Optional change to new bidder |


#### DomainFactory

The DomainFactory burns the auctionNFT and issues 3 new NFTs [DomainNFTs](#domainnfts). It verifies that the actionNFT input is atleast 1 day old. It also attaches the tokenAmount from auctionNFT to the authorized contract's thread.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [RegistrationNFT](#registrationnfts) Domain Minting NFT | [RegistrationNFT](#registrationnfts) Domain Minting NFT back to registry contract |
| 3 | [AuctionNFT](#auctionnft) | [DomainNFT](#domainnfts) Ownership NFT |
| 4 | | [DomainNFT](#domainnfts) Internal Auth NFT|
| 5 | | [DomainNFT](#domainnfts) External Auth NFT |
| 6 | | Platform fee (For a restructed amount of time) and rest to miners |



### 2. Guard Contracts

These contracts serve the purpose is to incentivise the enforcement of the rules. For example, if someone were to start a registration for a domain that is already owned then `IllegalRegistration` contract will authorize anyone to provide proof of ownership of the domain and penalise the illegal auction by burning the auctionNFT and giving the funds to the proof provider.

Similarily, other contracts also provide a way to authorize anyone to penalise anyone who attempts to breaks the rule of the system


#### AuctionNameEnforcer

The AuctionNameEnforcer contract allows anyone to prove that the running auction has an invalid domain name. By providing a proof (index of the invalid character) they burn the auctionNFT, taking away the entire amount as a reward.

Rules: 
- The name must consist of only these characters
   - Letters (a-z or A-Z)
   - Numbers (0-9)
   - Hyphens (-)

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [AuctionNFT](#auctionnft) | Reward output |


#### DomainOwnershipGuard

This prevents registrations for domains that have already been registered and have owners. Anyone can provide proof of a valid ownership and burn the auctionNFT and claim the funds as reward.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [DomainNFT](#domainnfts) External Auth NFT | [DomainNFT](#domainnfts) External Auth NFT back to the Domain Contract |
| 2 | [AuctionNFT](#auctionnft) | Reward output |


#### AuctionConflictResolver

If two registration auctions exist the one with higher registrationID is invalid. Since registration is a single threaded operation such scenarios are highly unlikely to occur.
This contract allows anyone to proving the registration Pair NFts of both auctions, burning the invalid auction pair in the process and taking away the funds as reward for keeping the system in check.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [RegistrationNFT](#registrationnfts) NFT with authorized contract's locking bytecode as commitment | [RegistrationNFT](#registrationnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | Valid [AuctionNFT](#auctionnft) |  Valid [AuctionNFT](#auctionnft) back to Registry Contract |
| 3 | Invalid [AuctionNFT](#auctionnft) | Reward output |

### 3. Domain

The Domain contract manages individual domain names after they are claimed from auction.

Key aspects:
- Unique contract for each unique domain name
- Requires heartbeat NFT for all operations to prove active ownership
- Enables domain owner to manage records
- Enforces atleast one activity in 2-year


---

## FAQs

#### How are domains sold?
Domains are sold through an auction. The auction starts using the [Auction](#auction) Contract and is open for new Bids from anyone using the [Bid](#bid) contract. Once the no new bids have been made for a day, the bidder can claim the domain by using the [DomainFactory](#domainfactory) contract.

#### Who earns from the auction sales?

For a fixed period of time, a percentage of bid amount is collected as platform fee and then the funds are distributed to the miners. After the fixed time is over 100% of the bid amount is distributed to the miners.

#### How is the correctness of the name verified?
Check [[AuctionNameEnforcer]](#auctionnameenforcer)

#### How are auctions created?
Check [[Auction]](#auction)

#### What if two auctions from the same name are running?
Check [[AuctionConflictResolver]](#auctionconflictresolver)

#### I won the bidding contest, how do I claim the domain?
Check [[DomainFactory]](#domainfactory)

#### Why Internal Auth NFT and External Auth NFT in each Domain Contract?
Check [DomainNFTs](#domainnfts)

#### What if the tokenAmount in the CounterNFT runs out?
As more and more registrations happen, the tokens get gathered up in the authorized contract threads. Anyone can accumulate the tokenAmounts from all these threads and send it to the counter NFT.

Registry Contract has a way to accumulate all the funds used up since the beginning.
Accumumulation of tokens, When any process ends, either through guards or from domainfactory, the tokenAmount help in the auctionNFTs is send to the active authorized thread NFT. Later these thread NFTs in combination with the CounterNFT can be used to send all the tokenAmounts back to the CounterNFT ensuring a continued registration process.


#### An illegal registration auction has started for a domain that is owner by someone, will there be two owners?
Check [[DomainOwnershipGuard]](#domainownershipguard)

#### Can a bid be cancelled?
No, If a bid it made, it's locked in.

#### Can anyone renounce ownership of a domain?
Yes, The owner must call the `renounceOwnership` function of their respective Domain contract.
The function will burn the Internal Auth NFT and the External Auth NFT allowing anyone to initiate a new auction for the domain.

#### What happens to the ownershipNFT when the ownership is renounced or the domain is abandoned?
Since the ownershipNFT's first 8 bytes are registrationID, they cannot influence the domain contract as the new internal Auth NFT will have a different registrationID. The existing ownershipNFT renders useless.

#### How do domain or record lookups work?
Domain lookups can be done in multiple ways:
- Find domain contract: Take name, calculate hash256, attach domain contract bytecode, hash to get address
- Find owner: Check who owns the domain NFT
- Find records: Get transaction history of domain contract and check OP_RETURN outputs

#### How does ownership transfer work? 
Ownership transfer is handled simply by transferring the domain NFT to the new owner. The NFT proves ownership rights to the domain.

#### How to add records?
Each DomainContract has a way to add records. The owner can add new records using the `addRecord` function of the DomainContract. Records are added as OP_RETURN outputs. Records can be found by checking transaction history

#### How to remove records?

[TBD] Since the records are OP_RETURN it's not possible to remove them. However, it's possible to provide a way that can act as a standard for libraries to understand. To 'remove' a Record a new transaction with OP_RETURN(RMV + hash) of record to remove can be created.

#### No Renewal or Expiry?
To ensure that the domains are not lost forever, the Owner must do atleast 1 activity(Add or Remove records) using the domain in a span of 2 years. Once done, the cycle resets. So if the owner has not interacted with the domain for > 2 years then the system assumes that it's abandoned and allows for re-auction